import React, { useState, useCallback, useRef, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { ICONS } from '../constants';
import { 
  analyzeImageForAI, 
  analyzeArticleContent, 
  generateAwarenessTemplateText, 
  getTrendingTopics, 
  understandVoiceCommand, 
  extractArticleTextFromHtml 
} from '../services/geminiService';
import type { ImageDetectionResult, ArticleAnalysisResult, UserHistoryItem, GroundingSource } from '../types';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const DashboardPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; title: string; content: React.ReactNode }>({ isOpen: false, title: '', content: null });
    const { showToast } = useToast();

    const [isListening, setIsListening] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState<{ sender: 'user' | 'bot', text: string }[]>([
        { sender: 'bot', text: 'Console online. Tap the mic to execute voice actions.' }
    ]);
    const recognitionRef = useRef<any>(null);
    const assistantMessagesEndRef = useRef<HTMLDivElement>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageResult, setImageResult] = useState<ImageDetectionResult | null>(null);

    const [articleInput, setArticleInput] = useState('');
    const [articleResult, setArticleResult] = useState<ArticleAnalysisResult | null>(null);

    const [templatePrompt, setTemplatePrompt] = useState('');
    const [templateContent, setTemplateContent] = useState<{ title: string; highlights: string[]; tips: string[] } | null>(null);
    
    const [trendingTopics, setTrendingTopics] = useState<{ topic: string; risk: string; score: number; sources: GroundingSource[] }[]>([]);

    const [userHistory, setUserHistory] = useState<UserHistoryItem[]>(() => {
        try {
            const savedHistory = localStorage.getItem('codeHustlersHistory');
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            return [];
        }
    });
    const truthBadgeEarned = userHistory.length >= 5;

    const handleLoading = (key: string, value: boolean) => setIsLoading(prev => ({...prev, [key]: value}));
    
    useEffect(() => {
        assistantMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [assistantMessages]);

    useEffect(() => {
        const fetchTopics = async () => {
            handleLoading('trending', true);
            try {
                const topics = await getTrendingTopics();
                setTrendingTopics(topics);
            } catch (err) {
                showToast(err instanceof Error ? err.message : 'Failed to fetch trends', 'error');
            } finally {
                handleLoading('trending', false);
            }
        };
        fetchTopics();
    }, [showToast]);

    useEffect(() => {
        localStorage.setItem('codeHustlersHistory', JSON.stringify(userHistory));
    }, [userHistory]);

    const addAssistantMessage = (sender: 'user' | 'bot', text: string, speak: boolean = false) => {
        setAssistantMessages(prev => [...prev, { sender, text }]);
        if (sender === 'bot' && speak) {
          const utterance = new SpeechSynthesisUtterance(text);
          speechSynthesis.speak(utterance);
        }
    };

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            const recognition = recognitionRef.current;
            recognition.lang = 'en-US';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            recognition.onstart = () => setIsListening(true);
            recognition.onresult = (event: any) => {
                const speechResult = event.results[0][0].transcript;
                processVoiceCommand(speechResult);
            };
            recognition.onspeechend = () => recognition.stop();
            recognition.onend = () => setIsListening(false);
            recognition.onerror = (event: any) => {
                setIsListening(false);
                addAssistantMessage('bot', "Could not capture feed. Please speak clearly.", true);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            addAssistantMessage('bot', 'Voice telemetry not supported on this browser.', true);
            return;
        }
        if (isListening) recognitionRef.current.stop();
        else recognitionRef.current.start();
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            setImageResult(null);
        }
    };

    const handleImageDetect = async () => {
        if (!imageFile) return;
        handleLoading('image', true);
        try {
            const base64Image = await toBase64(imageFile);
            const result = await analyzeImageForAI(base64Image, imageFile.type);
            setImageResult(result);
            updateHistory('image', imageFile.name, result.classification);
        } catch (err) {
            showToast('Analysis failed', 'error');
        } finally {
            handleLoading('image', false);
        }
    };
    
    const handleArticleDetect = async () => {
        const trimmedInput = articleInput.trim();
        if (!trimmedInput) return;
        handleLoading('article', true);
        try {
            let content = trimmedInput;
            if (trimmedInput.startsWith('http')) {
                showToast('Fetching article payload...', 'info');
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(trimmedInput)}`;
                const response = await fetch(proxyUrl);
                const html = await response.text();
                content = await extractArticleTextFromHtml(html);
            }
            const result = await analyzeArticleContent(content);
            setArticleResult(result);
            updateHistory('article', trimmedInput.substring(0, 40) + '...', `Risk: ${result.riskLevel}`);
        } catch (err) {
            showToast('Check failed', 'error');
        } finally {
            handleLoading('article', false);
        }
    };

    const handleTemplateGenerate = async () => {
        if (!templatePrompt.trim()) return;
        handleLoading('template', true);
        try {
            const result = await generateAwarenessTemplateText(templatePrompt);
            setTemplateContent(result);
        } catch (err) {
            showToast('Generation failed', 'error');
        } finally {
            handleLoading('template', false);
        }
    };

    const processVoiceCommand = async (command: string) => {
        addAssistantMessage('user', command);
        handleLoading('voice', true);
        try {
            const context = { hasImage: !!imageFile, hasArticle: !!articleInput.trim() };
            const result = await understandVoiceCommand(command, context);
            
            // Speak response
            addAssistantMessage('bot', result.responseText, true);

            // 10. Voice-to-Action Active Executions
            const intent = result.intent;
            if (intent === 'analyzeImage') {
                if (imageFile) {
                    showToast('Voice Command: Auditing Image Authenticity...', 'info');
                    handleImageDetect();
                } else {
                    addAssistantMessage('bot', 'No image file has been loaded in the vision workspace yet.', true);
                }
            } else if (intent === 'verifyArticle') {
                const queryText = result.parameters?.article || result.parameters?.topic || '';
                if (queryText) {
                    setArticleInput(queryText);
                    showToast(`Voice Command: Running fact check on "${queryText.substring(0, 30)}..."`, 'info');
                    
                    handleLoading('article', true);
                    try {
                        const checkResult = await analyzeArticleContent(queryText);
                        setArticleResult(checkResult);
                        updateHistory('article', queryText.substring(0, 40) + '...', `Risk: ${checkResult.riskLevel}`);
                        addAssistantMessage('bot', `Factual analysis complete. Factual alignment is ${checkResult.credibilityScore}% with a ${checkResult.riskLevel} credibility threat indicator.`, true);
                    } catch (e) {
                        showToast('Check failed', 'error');
                    } finally {
                        handleLoading('article', false);
                    }
                } else if (articleInput.trim()) {
                    showToast('Voice Command: Triggering content scan...', 'info');
                    handleArticleDetect();
                } else {
                    addAssistantMessage('bot', 'Provide article text or define a claim (e.g. "verify that Earth is flat").', true);
                }
            } else if (intent === 'generateKit') {
                const topicText = result.parameters?.topic || result.parameters?.article || '';
                if (topicText) {
                    setTemplatePrompt(topicText);
                    showToast(`Voice Command: Generating Awareness Kit for "${topicText}"...`, 'info');
                    handleLoading('template', true);
                    try {
                        const kitResult = await generateAwarenessTemplateText(topicText);
                        setTemplateContent(kitResult);
                        addAssistantMessage('bot', `I've prepared a safety kit for "${topicText}". Click "View Generated Kit" to review.`, true);
                    } catch (e) {
                        showToast('Generation failed', 'error');
                    } finally {
                        handleLoading('template', false);
                    }
                } else {
                    addAssistantMessage('bot', 'Please specify a target narrative to build a safety kit for.', true);
                }
            }
        } catch (err) {
            showToast("Command failed", 'error');
        } finally {
            handleLoading('voice', false);
        }
    };
    
    const updateHistory = (type: 'image' | 'article', query: string, result: string) => {
        const newItem: UserHistoryItem = {
            id: Date.now().toString(),
            type,
            query,
            result,
            timestamp: new Date().toLocaleString()
        };
        setUserHistory(prev => [newItem, ...prev].slice(0, 10));
    };

    const clearHistory = () => {
        if (window.confirm('Clear your analysis history?')) {
            setUserHistory([]);
            localStorage.removeItem('codeHustlersHistory');
            showToast('History cleared', 'success');
        }
    };

    const handleDownloadInfographic = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx || !templateContent) return;
        canvas.width = 600;
        canvas.height = 400;
        ctx.fillStyle = '#080710';
        ctx.fillRect(0, 0, 600, 400);
        
        ctx.fillStyle = '#00f0ff';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(templateContent.title, 40, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        templateContent.highlights.forEach((h, i) => ctx.fillText(`• ${h}`, 40, 120 + (i * 30)));
        
        const link = document.createElement('a');
        link.download = 'awareness-kit.png';
        link.href = canvas.toDataURL();
        link.click();
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Copied to clipboard', 'success');
    };

    return (
        <div className="space-y-10 pb-20 max-w-7xl mx-auto">
            
            {/* Page Title Header */}
            <div className="text-center space-y-3">
                <h1 className="text-4xl md:text-6xl font-black font-heading tracking-tight text-white">
                    Advanced Control Console
                </h1>
                <p className="text-white/60 text-lg max-w-2xl mx-auto">
                    Evaluate and track decentralized narrative authenticity using real-time generative AI parameters.
                </p>
            </div>

            {/* Grid Layout of Advanced Modules */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                
                {/* 1. Voice Copilot Assistant */}
                <DashboardCard title="Voice telemetry" icon={ICONS.mic}>
                     <div className="h-72 flex flex-col justify-between">
                        <div className="flex-1 space-y-2.5 overflow-y-auto p-4 bg-cyber-black/50 border border-white/5 rounded-2xl mb-4 text-xs scrollbar-thin">
                            {assistantMessages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-3.5 py-2 rounded-2xl max-w-[85%] font-mono leading-relaxed ${
                                      msg.sender === 'user' 
                                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/30' 
                                        : 'bg-white/5 text-white/90 border border-white/10'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={assistantMessagesEndRef} />
                        </div>
                        <button 
                          onClick={toggleListening} 
                          className={`w-14 h-14 mx-auto flex items-center justify-center rounded-2xl transition-all duration-300 ${
                            isListening 
                              ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                              : 'bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:scale-105 hover:shadow-[0_0_20px_rgba(0,240,255,0.35)]'
                          } text-white`}
                          aria-label="Toggle voice telemetry input"
                        >
                            {ICONS.mic}
                        </button>
                    </div>
                </DashboardCard>

                {/* 2. Image Deepfake Vision Auditor */}
                <DashboardCard title="Vision Analysis" icon={ICONS.image}>
                    <div className="space-y-5">
                        <div 
                          className="border border-dashed border-white/10 hover:border-cyan-400/30 rounded-2xl p-6 text-center relative cursor-pointer bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col items-center justify-center min-h-[144px]" 
                          onClick={() => document.getElementById('img-up')?.click()}
                        >
                            {imagePreview ? (
                              <img src={imagePreview} className="max-h-24 w-full object-contain rounded-lg border border-white/5" alt="Vision Upload Frame" />
                            ) : (
                              <div className="space-y-2 text-white/50 hover:text-white transition-colors">
                                <p className="text-xs uppercase font-bold tracking-wider">Load target media</p>
                                <p className="text-[10px] text-white/30">PNG, JPG formats supported</p>
                              </div>
                            )}
                            <input id="img-up" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </div>
                        <button 
                          onClick={handleImageDetect} 
                          disabled={!imageFile || isLoading['image']} 
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-white/5 disabled:to-white/5 text-white disabled:text-white/20 font-bold py-3 rounded-xl disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-all duration-300 uppercase tracking-widest text-xs border border-white/10"
                        >
                            {isLoading['image'] ? 'Parsing frames...' : 'Verify Authenticity'}
                        </button>
                        {imageResult && (
                            <div className="p-4 bg-cyber-dark/80 rounded-2xl text-xs border border-white/10 space-y-2 font-mono">
                                <div className="flex justify-between font-black border-b border-white/5 pb-2">
                                  <span>Classification:</span>
                                  <span className={imageResult.classification === 'Authentic' ? 'text-green-400' : 'text-red-400'}>
                                    {imageResult.classification}
                                  </span>
                                </div>
                                <p className="mt-1 text-white/70 leading-relaxed text-[11px]">{imageResult.explanation}</p>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                {/* 3. Article Claims Fact Checker */}
                <DashboardCard title="Fact Checker" icon={ICONS.article}>
                    <div className="space-y-4">
                        <textarea 
                          value={articleInput} 
                          onChange={(e) => setArticleInput(e.target.value)} 
                          placeholder="Load claim payload or drop article URL..." 
                          className="w-full h-28 bg-cyber-black/50 border border-white/10 hover:border-cyan-400/20 rounded-2xl p-4 text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 focus:outline-none focus:bg-cyber-black/80 transition-all duration-300 resize-none" 
                        />
                        <button 
                          onClick={handleArticleDetect} 
                          disabled={!articleInput.trim() || isLoading['article']} 
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-white/5 disabled:to-white/5 text-white disabled:text-white/20 font-bold py-3 rounded-xl disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-all duration-300 uppercase tracking-widest text-xs border border-white/10"
                        >
                            {isLoading['article'] ? 'Checking claims...' : 'Verify Content'}
                        </button>
                        {articleResult && (
                            <div className="p-4 bg-cyber-dark/80 rounded-2xl text-xs border border-white/10 relative font-mono space-y-2">
                                <button 
                                  onClick={() => copyToClipboard(articleResult.summary)} 
                                  className="absolute top-4 right-4 text-white/40 hover:text-cyan-400 transition-colors"
                                  title="Copy Summary"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                                <div className="flex justify-between font-black border-b border-white/5 pb-2">
                                    <span>RISK: {articleResult.riskLevel}</span>
                                    <span className="text-cyan-400">{articleResult.credibilityScore}% CRED</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-white/70 italic">&quot;{articleResult.summary}&quot;</p>
                                <button 
                                  onClick={() => setModalInfo({ 
                                    isOpen: true, 
                                    title: 'Factual Nodes Breakdown', 
                                    content: (
                                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                                        {articleResult.claims?.map((c, i) => (
                                          <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2 font-mono">
                                            <p className="font-bold text-sm text-cyan-400">Node: &quot;{c.claim}&quot;</p>
                                            <p className="text-xs text-white/70 leading-relaxed">Status: {c.verification}</p>
                                          </div>
                                        ))}
                                      </div>
                                    ) 
                                  })} 
                                  className="text-cyan-400 font-extrabold hover:text-cyan-300 text-xs tracking-wider uppercase block mt-2 hover:underline"
                                >
                                  Factual Lineage Report
                                </button>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                {/* 4. Real-time Trending Narrative Risks */}
                <DashboardCard title="Trending Risks" icon={ICONS.trending}>
                    <div className="h-72 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
                        {isLoading['trending'] ? (
                          [1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 border border-white/5 animate-pulse rounded-2xl" />)
                        ) : trendingTopics.map((topic, idx) => (
                            <div key={idx} className="p-4 bg-cyber-black/50 hover:bg-cyber-black/80 rounded-2xl border border-white/5 hover:border-cyan-400/20 transition-all duration-300 font-mono">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-white/90 truncate flex-1 pr-2">{topic.topic}</span>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                                      topic.risk === 'High' 
                                        ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                        : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                    }`}>
                                      {topic.risk}
                                    </span>
                                </div>
                                {topic.sources && topic.sources.length > 0 && (
                                    <div className="flex gap-2 items-center text-[9px] text-white/40 pt-1 border-t border-white/5">
                                        <span className="uppercase font-bold tracking-widest text-[8px]">Source:</span>
                                        {topic.sources.slice(0, 2).map((s, si) => (
                                            <a key={si} href={s.uri} target="_blank" rel="noreferrer" className="text-cyan-400 hover:text-cyan-300 hover:underline truncate max-w-[85px]" title={s.title}>{s.title}</a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* 5. Generative Awareness Safety Template Kit */}
                <DashboardCard title="Awareness Kit" icon={ICONS.template}>
                    <div className="space-y-4">
                        <input 
                          value={templatePrompt} 
                          onChange={(e) => setTemplatePrompt(e.target.value)} 
                          placeholder="Load custom narrative topic..." 
                          className="w-full bg-cyber-black/50 border border-white/10 hover:border-cyan-400/20 rounded-xl p-3 text-xs font-mono text-white placeholder-white/25 focus:ring-1 focus:ring-cyan-400 focus:outline-none" 
                        />
                        <button 
                          onClick={handleTemplateGenerate} 
                          disabled={!templatePrompt.trim() || isLoading['template']} 
                          className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-white/5 disabled:to-white/5 text-white disabled:text-white/20 font-bold py-3 rounded-xl disabled:cursor-not-allowed hover:shadow-[0_0_25px_rgba(0,240,255,0.25)] transition-all duration-300 uppercase tracking-widest text-xs border border-white/10"
                        >
                            {isLoading['template'] ? 'Synthesizing...' : 'Generate Safety Kit'}
                        </button>
                        {templateContent && (
                            <div className="text-center pt-2">
                                <button onClick={() => setModalInfo({ 
                                    isOpen: true, 
                                    title: 'Narrative Counteraction Kit', 
                                    content: (
                                        <div className="space-y-6 font-mono text-xs">
                                            <div className="p-5 bg-cyan-950/20 border border-cyan-400/20 rounded-2xl text-white">
                                                <h4 className="font-black text-base mb-3 text-cyan-400 uppercase tracking-wide border-b border-white/5 pb-2">{templateContent.title}</h4>
                                                <div className="space-y-2 mb-5 text-white/80 leading-relaxed">
                                                    {templateContent.highlights?.map((h, i) => <p key={i}>• {h}</p>)}
                                                </div>
                                                <div className="pt-4 border-t border-white/5">
                                                    <p className="font-bold text-[9px] text-cyan-400 uppercase tracking-widest mb-2">Safety Audits:</p>
                                                    {templateContent.tips?.map((t, i) => <p key={i} className="italic opacity-80 mb-1.5">- {t}</p>)}
                                                </div>
                                            </div>
                                            <button onClick={handleDownloadInfographic} className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white py-3 rounded-xl font-bold transition-all duration-300 hover:shadow-lg text-xs uppercase tracking-widest border border-white/10">Download Shareable Card</button>
                                        </div>
                                    ) 
                                })} className="text-cyan-400 hover:text-cyan-300 font-extrabold text-xs tracking-wider uppercase underline">View Generated Kit</button>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                {/* 6. Local Insights & Activity Monitor */}
                <DashboardCard title="Audit Insights" icon={ICONS.insights}>
                    <div className="h-72 flex flex-col justify-between font-mono">
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                <h4 className="text-[9px] font-black uppercase tracking-widest text-white/40">History Logs</h4>
                                {userHistory.length > 0 && (
                                  <button onClick={clearHistory} className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase">Clear All</button>
                                )}
                            </div>
                            <div className="space-y-2.5 overflow-y-auto h-40 pr-1 scrollbar-thin">
                                {userHistory.length === 0 ? (
                                  <p className="text-[10px] text-center text-white/30 py-10 italic">Telemetry storage empty.</p>
                                ) : userHistory.map(item => (
                                    <div key={item.id} className="text-[10px] p-2.5 bg-white/5 rounded-xl border border-white/5 flex justify-between items-center group">
                                        <span className="truncate flex-1 mr-2 text-white/70" title={item.query}>{item.query}</span>
                                        <span className="text-[9px] text-cyan-400 font-bold uppercase bg-cyan-400/10 px-2 py-0.5 rounded-md border border-cyan-400/20">{item.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/5">
                             <div className="flex items-center">
                                <div className={`p-2.5 rounded-xl mr-3 ${
                                  truthBadgeEarned 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)] animate-pulse' 
                                    : 'bg-white/5 text-white/30 border border-white/10'
                                }`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.069a2 2 0 001.94 0L17.834 4.9A2 2 0 0016.864 1.5H3.136a2 2 0 00-.97 3.4zM3.508 11.5A3 3 0 016.5 8.5h7a3 3 0 012.992 3L16.5 19H3.5l.008-7.5z" clipRule="evenodd" /></svg>
                                </div>
                                <div className="text-[10px]">
                                    <p className="font-black uppercase tracking-wider text-white/90">{truthBadgeEarned ? 'Security Analyst' : 'Trainee Auditor'}</p>
                                    <p className="text-[9px] text-white/40">{truthBadgeEarned ? 'Trust Clearance Verified' : `${Math.max(0, 5 - userHistory.length)} more audits for clearance`}</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </DashboardCard>
            </div>

            {/* Premium Glass Modal */}
            <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo(prev => ({ ...prev, isOpen: false }))} title={modalInfo.title}>
                {modalInfo.content}
            </Modal>
        </div>
    );
};

export default DashboardPage;