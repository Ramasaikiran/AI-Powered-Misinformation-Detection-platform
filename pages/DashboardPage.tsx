import React, { useState, useCallback, useRef, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { ICONS } from '../constants';
import { analyzeImageForAI, analyzeArticleContent, generateAwarenessTemplateText, getTrendingTopics, understandVoiceCommand, summarizeResultForSpeech, getChatbotResponse, extractArticleTextFromHtml } from '../services/geminiService';
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
        { sender: 'bot', text: 'Hi! How can I help? Tap the mic to talk to me.' }
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
    const infographicRef = useRef<HTMLDivElement>(null);
    
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
                addAssistantMessage('bot', "I'm having trouble hearing you. Try again?", true);
            };
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            addAssistantMessage('bot', 'Voice not supported on this browser.', true);
            return;
        }
        if (isListening) recognitionRef.current.stop();
        else recognitionRef.current.start();
    };

    const processVoiceCommand = async (command: string) => {
        addAssistantMessage('user', command);
        handleLoading('voice', true);
        try {
            const context = { hasImage: !!imageFile, hasArticle: !!articleInput.trim() };
            const result = await understandVoiceCommand(command, context);
            addAssistantMessage('bot', result.responseText, true);
        } catch (err) {
            showToast("Command failed", 'error');
        } finally {
            handleLoading('voice', false);
        }
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
                showToast('Fetching article...', 'info');
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
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#4f46e5';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(templateContent.title, 40, 60);
        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';
        templateContent.highlights.forEach((h, i) => ctx.fillText(`• ${h}`, 40, 100 + (i * 25)));
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
        <div className="animate-fade-in-up pb-12">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-center text-black dark:text-white">Professional Detection Suite</h1>
            <p className="text-center text-black/60 dark:text-white/60 mb-12 max-w-2xl mx-auto">Cross-modality verification tools powered by the latest Gemini AI models.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <DashboardCard title="Voice Assistant" icon={ICONS.mic}>
                     <div className="h-64 flex flex-col justify-between">
                        <div className="flex-1 space-y-2 overflow-y-auto p-3 bg-black/5 dark:bg-white/5 rounded-xl mb-4 text-sm">
                            {assistantMessages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-3 py-1.5 rounded-lg max-w-[85%] ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-black/10 dark:bg-white/10'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={assistantMessagesEndRef} />
                        </div>
                        <button onClick={toggleListening} className={`w-14 h-14 mx-auto flex items-center justify-center rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse scale-110' : 'bg-indigo-600 hover:scale-105'} text-white shadow-lg`}>
                            {ICONS.mic}
                        </button>
                    </div>
                </DashboardCard>

                <DashboardCard title="Vision Analysis" icon={ICONS.image}>
                    <div className="space-y-4">
                        <div className="border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl p-4 text-center relative hover:border-indigo-500 cursor-pointer transition-colors" onClick={() => document.getElementById('img-up')?.click()}>
                            {imagePreview ? <img src={imagePreview} className="h-24 w-full object-contain" alt="Preview" /> : <p className="text-xs text-black/50">Click to upload image</p>}
                            <input id="img-up" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </div>
                        <button onClick={handleImageDetect} disabled={!imageFile || isLoading['image']} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                            {isLoading['image'] ? 'Analyzing...' : 'Analyze Authenticity'}
                        </button>
                        {imageResult && (
                            <div className="p-3 bg-black/5 rounded-lg text-xs border border-indigo-500/10">
                                <p className="font-bold flex justify-between">Classification: <span className={imageResult.classification === 'Authentic' ? 'text-green-500' : 'text-red-500'}>{imageResult.classification}</span></p>
                                <p className="mt-1 opacity-80">{imageResult.explanation}</p>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                <DashboardCard title="Fact Checker" icon={ICONS.article}>
                    <div className="space-y-3">
                        <textarea value={articleInput} onChange={(e) => setArticleInput(e.target.value)} placeholder="Article URL or text..." className="w-full h-24 bg-transparent border border-black/10 dark:border-white/10 rounded-xl p-3 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                        <button onClick={handleArticleDetect} disabled={!articleInput.trim() || isLoading['article']} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                            {isLoading['article'] ? 'Checking...' : 'Verify Content'}
                        </button>
                        {articleResult && (
                            <div className="p-3 bg-black/5 rounded-lg text-xs border border-indigo-500/10 relative">
                                <button onClick={() => copyToClipboard(articleResult.summary)} className="absolute top-2 right-2 text-indigo-500 hover:text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                </button>
                                <div className="flex justify-between font-bold mb-1">
                                    <span>Risk: {articleResult.riskLevel}</span>
                                    <span className="text-indigo-500">{articleResult.credibilityScore}%</span>
                                </div>
                                <p className="line-clamp-2 mb-2 italic opacity-80">"{articleResult.summary}"</p>
                                <button onClick={() => setModalInfo({ isOpen: true, title: 'Analysis Breakdown', content: <div className="space-y-4">{articleResult.claims.map((c, i) => <div key={i} className="p-3 bg-black/5 rounded-lg"><p className="font-bold mb-1">{c.claim}</p><p className="text-sm opacity-80">{c.verification}</p></div>)}</div> })} className="text-indigo-500 font-bold hover:underline">Full Report</button>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                <DashboardCard title="Trending Risks" icon={ICONS.trending}>
                    <div className="h-64 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-indigo-500/20">
                        {isLoading['trending'] ? [1, 2, 3].map(i => <div key={i} className="h-12 bg-black/5 animate-pulse rounded-lg" />) : trendingTopics.map((topic, idx) => (
                            <div key={idx} className="p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-transparent hover:border-indigo-500/20 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-sm font-bold truncate flex-1 pr-2">{topic.topic}</span>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${topic.risk === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>{topic.risk}</span>
                                </div>
                                {topic.sources && topic.sources.length > 0 && (
                                    <div className="flex gap-2 items-center text-[9px] opacity-60">
                                        <span className="uppercase font-bold">Cited:</span>
                                        {topic.sources.slice(0, 2).map((s, si) => (
                                            <a key={si} href={s.uri} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline truncate max-w-[80px]">{s.title}</a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                <DashboardCard title="Awareness Kit" icon={ICONS.template}>
                    <div className="space-y-4">
                        <input value={templatePrompt} onChange={(e) => setTemplatePrompt(e.target.value)} placeholder="Misleading topic..." className="w-full bg-transparent border border-black/10 dark:border-white/10 rounded-lg p-3 text-sm focus:outline-none" />
                        <button onClick={handleTemplateGenerate} disabled={!templatePrompt.trim() || isLoading['template']} className="w-full bg-indigo-600 text-white font-bold py-2 rounded-lg disabled:opacity-50">
                            {isLoading['template'] ? 'Creating...' : 'Generate Awareness Kit'}
                        </button>
                        {templateContent && (
                            <div className="text-center">
                                <button onClick={() => setModalInfo({ 
                                    isOpen: true, 
                                    title: 'Awareness Kit', 
                                    content: (
                                        <div className="space-y-6">
                                            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl text-black dark:text-white">
                                                <h4 className="font-extrabold text-xl mb-3 text-indigo-500">{templateContent.title}</h4>
                                                <div className="space-y-2 mb-4">
                                                    {templateContent.highlights.map((h, i) => <p key={i} className="text-sm">• {h}</p>)}
                                                </div>
                                                <div className="pt-4 border-t border-indigo-500/10">
                                                    <p className="font-bold text-xs uppercase mb-2">Safety Tips:</p>
                                                    {templateContent.tips.map((t, i) => <p key={i} className="text-sm italic opacity-80 mb-1">- {t}</p>)}
                                                </div>
                                            </div>
                                            <button onClick={handleDownloadInfographic} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg">Download Shareable Card</button>
                                        </div>
                                    ) 
                                })} className="text-indigo-500 font-bold text-sm underline">View Generated Kit</button>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                <DashboardCard title="User Insights" icon={ICONS.insights}>
                    <div className="h-64 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-black/40 dark:text-white/40">Recent Activity</h4>
                                {userHistory.length > 0 && <button onClick={clearHistory} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase">Reset</button>}
                            </div>
                            <div className="space-y-2 overflow-y-auto h-40 pr-1 scrollbar-thin scrollbar-thumb-indigo-500/10">
                                {userHistory.length === 0 ? <p className="text-xs text-center text-black/40 py-8 italic">No analysis history yet.</p> : userHistory.map(item => (
                                    <div key={item.id} className="text-[11px] p-2 bg-black/5 dark:bg-white/5 rounded-lg flex justify-between items-center group">
                                        <span className="truncate flex-1 mr-2 opacity-80" title={item.query}>{item.query}</span>
                                        <span className="text-indigo-500 font-bold uppercase text-[9px] bg-indigo-500/10 px-1 rounded">{item.type}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 border-t border-black/10 dark:border-white/10">
                             <div className="flex items-center">
                                <div className={`p-2 rounded-full mr-3 ${truthBadgeEarned ? 'bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)] animate-pulse' : 'bg-black/5 dark:bg-white/5 text-black/30'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.069a2 2 0 001.94 0L17.834 4.9A2 2 0 0016.864 1.5H3.136a2 2 0 00-.97 3.4zM3.508 11.5A3 3 0 016.5 8.5h7a3 3 0 012.992 3L16.5 19H3.5l.008-7.5z" clipRule="evenodd" /></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-tight">{truthBadgeEarned ? 'Truth Seeker Status Active' : 'Rookie Fact-Checker'}</p>
                                    <p className="text-[9px] opacity-60">{truthBadgeEarned ? 'Badge Earned!' : `${Math.max(0, 5 - userHistory.length)} more required for badge`}</p>
                                </div>
                             </div>
                        </div>
                    </div>
                </DashboardCard>
            </div>

            <Modal isOpen={modalInfo.isOpen} onClose={() => setModalInfo(prev => ({ ...prev, isOpen: false }))} title={modalInfo.title}>
                {modalInfo.content}
            </Modal>
        </div>
    );
};

export default DashboardPage;