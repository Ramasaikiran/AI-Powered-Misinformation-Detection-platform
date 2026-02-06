import React, { useState, useCallback, useRef, useEffect } from 'react';
import DashboardCard from '../components/DashboardCard';
import Modal from '../components/Modal';
import { useToast } from '../components/ToastProvider';
import { ICONS } from '../constants';
import { analyzeImageForAI, analyzeArticleContent, generateAwarenessTemplateText, getTrendingTopics, understandVoiceCommand, summarizeResultForSpeech, getChatbotResponse, extractArticleTextFromHtml } from '../services/geminiService';
import type { ImageDetectionResult, ArticleAnalysisResult, UserHistoryItem } from '../types';

// Helper to convert file to base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const DashboardPage: React.FC = () => {
    // Shared State
    const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});
    const [modalInfo, setModalInfo] = useState<{ isOpen: boolean; title: string; content: React.ReactNode }>({ isOpen: false, title: '', content: null });
    const { showToast } = useToast();

    // Voice Assistant State
    const [isListening, setIsListening] = useState(false);
    const [assistantMessages, setAssistantMessages] = useState<{ sender: 'user' | 'bot', text: string }[]>([
        { sender: 'bot', text: 'Hi! How can I help? Tap the mic to talk to me.' }
    ]);
    const recognitionRef = useRef<any>(null);
    const assistantMessagesEndRef = useRef<HTMLDivElement>(null);

    // Image Detection State
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageResult, setImageResult] = useState<ImageDetectionResult | null>(null);

    // Article Detection State
    const [articleInput, setArticleInput] = useState('');
    const [articleResult, setArticleResult] = useState<ArticleAnalysisResult | null>(null);

    // Awareness Templates State
    const [templatePrompt, setTemplatePrompt] = useState('');
    const [templateContent, setTemplateContent] = useState<{ title: string; highlights: string[]; tips: string[] } | null>(null);
    const [isTopicsDropdownOpen, setIsTopicsDropdownOpen] = useState(false);
    const templateDropdownRef = useRef<HTMLDivElement>(null);
    const infographicRef = useRef<HTMLDivElement>(null);
    
    // Trending Searches State
    const [trendingTopics, setTrendingTopics] = useState<{ topic: string; risk: string; score: number }[]>([]);

    // User Insights State
    const [userHistory, setUserHistory] = useState<UserHistoryItem[]>(() => {
        try {
            const savedHistory = localStorage.getItem('codeHustlersHistory');
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error("Failed to parse history from localStorage", error);
            return [];
        }
    });
    const truthBadgeEarned = userHistory.length >= 5;

    const handleLoading = (key: string, value: boolean) => setIsLoading(prev => ({...prev, [key]: value}));
    
    // Auto-scroll for assistant messages
    useEffect(() => {
        assistantMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [assistantMessages]);

    // Fetch trending topics on mount
    useEffect(() => {
        const fetchTopics = async () => {
            handleLoading('trending', true);
            try {
                const topics = await getTrendingTopics();
                setTrendingTopics(topics);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'An unknown error occurred.';
                showToast(message, 'error');
                setTrendingTopics([]); // Clear topics on error
            } finally {
                handleLoading('trending', false);
            }
        };
        fetchTopics();
    }, [showToast]);

    // Save history to localStorage on change
    useEffect(() => {
        try {
            localStorage.setItem('codeHustlersHistory', JSON.stringify(userHistory));
        } catch (error) {
            console.error("Failed to save history to localStorage", error);
        }
    }, [userHistory]);

    // Close template dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
                setIsTopicsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addAssistantMessage = (sender: 'user' | 'bot', text: string, speak: boolean = false) => {
        setAssistantMessages(prev => [...prev, { sender, text }]);
        if (sender === 'bot' && speak) {
          const utterance = new SpeechSynthesisUtterance(text);
          speechSynthesis.speak(utterance);
        }
    };

    // Initialize Speech Recognition
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
                console.error("Speech recognition error", event.error);
                setIsListening(false);
                let errorMessage = 'Sorry, I had trouble with speech recognition. Please try again.';
                if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                    errorMessage = "Microphone access is required. Please check your browser's site settings.";
                    const modalContent = (
                        <div>
                            <p className="mb-4">CodeHustlers needs access to your microphone for the voice assistant.</p>
                            <p>To fix this, please go to your browser's site settings for this page and change the microphone permission from 'Block' to 'Allow'.</p>
                            <p className="mt-2 text-sm text-black/70 dark:text-white/70">You may need to reload the page after changing the setting.</p>
                        </div>
                    );
                    setModalInfo({ isOpen: true, title: 'Microphone Access Denied', content: modalContent });
                } else if (event.error === 'no-speech') {
                    errorMessage = "I didn't hear anything. Please try speaking again.";
                }
                addAssistantMessage('bot', errorMessage, true);
            };
        }
    }, []);

    const toggleListening = async () => {
        if (!recognitionRef.current) {
            addAssistantMessage('bot', 'Sorry, speech recognition is not supported on your browser.', true);
            return;
        }

        if (navigator.permissions) {
            try {
                const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
                if (permissionStatus.state === 'denied') {
                    const modalContent = (
                        <div>
                            <p className="mb-4">CodeHustlers needs access to your microphone for the voice assistant.</p>
                            <p>To fix this, please go to your browser's site settings for this page and change the microphone permission from 'Block' to 'Allow'.</p>
                            <p className="mt-2 text-sm text-black/70 dark:text-white/70">You may need to reload the page after changing the setting.</p>
                        </div>
                    );
                    setModalInfo({ isOpen: true, title: 'Microphone Access Denied', content: modalContent });
                    addAssistantMessage('bot', 'Microphone access is denied. Please enable it in your browser settings.', true);
                    return;
                }
            } catch (error) {
                console.error("Could not query microphone permission:", error);
            }
        }
        
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const processVoiceCommand = async (command: string) => {
        addAssistantMessage('user', command);
        handleLoading('voice', true);
    
        const context = {
            hasImage: !!imageFile,
            hasArticle: !!articleInput.trim(),
        };

        try {
            const result = await understandVoiceCommand(command, context);
            addAssistantMessage('bot', result.responseText, true);
        
            switch (result.intent) {
                case 'analyze_image':
                    if (context.hasImage) {
                        await handleImageDetect(true);
                    } else {
                        addAssistantMessage('bot', 'Please upload an image first, then ask me to analyze it.', true);
                    }
                    break;
                case 'analyze_article':
                     if (result.parameters?.article) {
                        setArticleInput(result.parameters.article);
                        await handleArticleDetect(true, result.parameters.article);
                    } else if (context.hasArticle) {
                        await handleArticleDetect(true);
                    } else {
                        addAssistantMessage('bot', 'Please provide an article URL or text for me to analyze.', true);
                    }
                    break;
                case 'get_trending_topics':
                    const topics = await getTrendingTopics();
                    const topicsText = topics.map(t => t.topic).join(', ');
                    addAssistantMessage('bot', `The current trending topics are: ${topicsText}`, true);
                    setTrendingTopics(topics);
                    break;
                case 'general_question':
                    const answer = await getChatbotResponse(command);
                    addAssistantMessage('bot', answer, true);
                    break;
            }
        } catch (error) {
             const message = error instanceof Error ? error.message : 'An unknown error occurred.';
             showToast(message, 'error');
             addAssistantMessage('bot', "I'm having trouble processing that request right now.", true);
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
    
    const resetImageAnalysis = () => {
        setImageFile(null);
        setImagePreview(null);
        setImageResult(null);
    }

    const handleImageDetect = async (fromVoice: boolean = false) => {
        if (!imageFile) return;
        handleLoading('image', true);
        setImageResult(null);
        try {
            const base64Image = await toBase64(imageFile);
            const result = await analyzeImageForAI(base64Image, imageFile.type);
            setImageResult(result);
            updateHistory('image', imageFile.name, result.classification);
             if (fromVoice) {
                const summary = await summarizeResultForSpeech('image', result);
                addAssistantMessage('bot', summary, true);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            showToast(message, 'error');
             if (fromVoice) {
                addAssistantMessage('bot', 'Sorry, I encountered an error while analyzing the image.', true);
            }
        } finally {
            handleLoading('image', false);
        }
    };
    
    const handleArticleDetect = async (fromVoice: boolean = false, contentOverride?: string) => {
        const content = contentOverride || articleInput;
        const trimmedInput = content.trim();
        if (!trimmedInput) return;

        handleLoading('article', true);
        setArticleResult(null);

        const urlFindRegex = /(https?:\/\/[^\s"']*[^\s"'\.,])/;
        const urlMatch = trimmedInput.match(urlFindRegex);
        const potentialUrl = urlMatch ? urlMatch[0] : null;

        let articleContentToAnalyze = trimmedInput;
        let analysisQuery = potentialUrl || (trimmedInput.substring(0, 30) + '...');

        try {
            if (potentialUrl) {
                try {
                    showToast('URL detected. Fetching article content...', 'info');
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(potentialUrl)}`;
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
                    const html = await response.text();
                    if (!html) throw new Error(`Fetched content is empty.`);
                    showToast('Extracting main text from page...', 'info');
                    const extractedText = await extractArticleTextFromHtml(html);
                    if (!extractedText.trim()) throw new Error("Could not extract text from the URL.");
                    articleContentToAnalyze = extractedText;
                } catch (fetchError) {
                    showToast(`Failed to process URL. Analyzing text instead.`, 'error');
                    articleContentToAnalyze = trimmedInput;
                }
            }
            
            const result = await analyzeArticleContent(articleContentToAnalyze);
            setArticleResult(result);
            updateHistory('article', analysisQuery, `Risk: ${result.riskLevel}`);
             if (fromVoice) {
                const summary = await summarizeResultForSpeech('article', result);
                addAssistantMessage('bot', summary, true);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            showToast(message, 'error');
        } finally {
            handleLoading('article', false);
        }
    };

    const handleTemplateGenerate = async () => {
        if (!templatePrompt) return;
        handleLoading('template', true);
        setTemplateContent(null);
        try {
            const result = await generateAwarenessTemplateText(templatePrompt);
            setTemplateContent(result);
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'An unknown error occurred.', 'error');
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
        if (userHistory.length === 0) return;
        if (window.confirm('Are you sure you want to clear your entire analysis history? This action cannot be undone.')) {
            setUserHistory([]);
            localStorage.removeItem('codeHustlersHistory');
            showToast('History cleared successfully.', 'success');
        }
    };

    const handleDownloadInfographic = () => {
        const node = infographicRef.current;
        if (!node || !templateContent) return;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = 600;
        canvas.height = 400;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 600, 400);
        ctx.fillStyle = '#4f46e5';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText(templateContent.title, 40, 60);
        ctx.fillStyle = '#000000';
        ctx.font = '16px sans-serif';
        templateContent.highlights.forEach((h, i) => ctx.fillText(`• ${h}`, 40, 100 + (i * 30)));
        
        const link = document.createElement('a');
        link.download = 'awareness-card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="animate-fade-in-up">
            <h1 className="text-3xl font-bold mb-8 text-center text-black dark:text-white">AI Detection Suite</h1>
            <p className="text-center text-black/70 dark:text-white/70 mb-12 max-w-2xl mx-auto">Professional-grade tools for comprehensive misinformation detection and analysis.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {/* Voice Assistant */}
                <DashboardCard title="Voice Assistant" icon={ICONS.mic}>
                     <div className="h-56 flex flex-col justify-between">
                        <div className="flex-1 space-y-2 overflow-y-auto p-2 bg-black/5 dark:bg-white/5 rounded-md mb-4 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                            {assistantMessages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`px-3 py-1.5 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-black/10 text-black dark:bg-white/10 dark:text-white'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            <div ref={assistantMessagesEndRef} />
                        </div>
                        <div className="text-center">
                            <button
                                onClick={toggleListening}
                                disabled={isLoading['voice']}
                                className={`relative w-16 h-16 mx-auto flex items-center justify-center p-2 rounded-full transition-colors text-white font-bold ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:bg-gray-400`}
                            >
                                {isLoading['voice'] ? <span className="animate-pulse">...</span> : ICONS.mic}
                                {isListening && <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping"></span>}
                            </button>
                        </div>
                    </div>
                </DashboardCard>

                {/* Image Detection */}
                <DashboardCard title="AI Image Detection" icon={ICONS.image}>
                    <div className="space-y-4">
                        <div 
                            className="border-2 border-dashed border-black/20 dark:border-white/20 rounded-xl p-4 text-center hover:border-indigo-500 transition-colors cursor-pointer relative"
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            {imagePreview ? (
                                <div className="relative group">
                                    <img src={imagePreview} alt="Preview" className="h-32 w-full object-contain rounded-lg" />
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); resetImageAnalysis(); }}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        &times;
                                    </button>
                                </div>
                            ) : (
                                <div className="py-4">
                                    <p className="text-sm text-black/60 dark:text-white/60">Drop image here or click to upload</p>
                                </div>
                            )}
                            <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                        </div>
                        <button 
                            onClick={() => handleImageDetect()}
                            disabled={!imageFile || isLoading['image']}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-400"
                        >
                            {isLoading['image'] ? 'Analyzing...' : 'Analyze Image'}
                        </button>
                        {imageResult && (
                            <div className="mt-4 p-3 bg-black/5 dark:bg-white/5 rounded-lg border border-indigo-500/20">
                                <p className="font-bold flex justify-between">
                                    Result: <span className={imageResult.classification === 'Authentic' ? 'text-green-500' : 'text-red-500'}>{imageResult.classification}</span>
                                </p>
                                <p className="text-sm mt-1">{imageResult.explanation}</p>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                {/* Article Analysis */}
                <DashboardCard title="Article Analysis" icon={ICONS.article}>
                    <div className="space-y-4">
                        <textarea 
                            value={articleInput}
                            onChange={(e) => setArticleInput(e.target.value)}
                            placeholder="Paste article URL or content here..."
                            className="w-full h-24 bg-transparent border border-black/20 dark:border-white/20 rounded-lg p-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                        />
                        <button 
                            onClick={() => handleArticleDetect()}
                            disabled={!articleInput.trim() || isLoading['article']}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-400"
                        >
                            {isLoading['article'] ? 'Checking...' : 'Check Article'}
                        </button>
                        {articleResult && (
                            <div className="mt-2 p-3 bg-black/5 dark:bg-white/5 rounded-lg text-sm border border-indigo-500/20">
                                <p className="font-bold">Risk: {articleResult.riskLevel}</p>
                                <p className="mt-1 line-clamp-3">{articleResult.summary}</p>
                                <button 
                                    onClick={() => setModalInfo({ isOpen: true, title: 'Full Analysis', content: <div>{articleResult.claims.map((c, i) => <div key={i} className="mb-4"><strong>{c.claim}</strong><p className="text-sm mt-1">{c.verification}</p></div>)}</div> })}
                                    className="text-indigo-500 text-xs mt-2 font-bold"
                                >
                                    View Full Breakdown
                                </button>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                {/* Trending Topics */}
                <DashboardCard title="Trending Risks" icon={ICONS.trending}>
                    <div className="h-56 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600">
                        {isLoading['trending'] ? (
                            <div className="flex flex-col space-y-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-black/5 dark:bg-white/5 animate-pulse rounded"></div>)}
                            </div>
                        ) : trendingTopics.map((topic, idx) => (
                            <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5">
                                <span className="text-sm font-medium flex-1 truncate mr-2" title={topic.topic}>{topic.topic}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${topic.risk === 'High' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                    {topic.risk}
                                </span>
                            </div>
                        ))}
                    </div>
                </DashboardCard>

                {/* Awareness Templates */}
                <DashboardCard title="Awareness Tools" icon={ICONS.template}>
                    <div className="space-y-4">
                        <input 
                            value={templatePrompt}
                            onChange={(e) => setTemplatePrompt(e.target.value)}
                            placeholder="Enter a topic..."
                            className="w-full bg-transparent border border-black/20 dark:border-white/20 rounded-lg p-2 text-sm focus:outline-none"
                        />
                        <button 
                            onClick={handleTemplateGenerate}
                            disabled={!templatePrompt.trim() || isLoading['template']}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-lg transition disabled:bg-gray-400"
                        >
                            {isLoading['template'] ? 'Generating...' : 'Create Awareness Kit'}
                        </button>
                        {templateContent && (
                            <div className="mt-2 text-center">
                                <button onClick={() => setModalInfo({ isOpen: true, title: 'Awareness Kit', content: <div className="space-y-4"><h4 className="font-bold text-lg">{templateContent.title}</h4>{templateContent.highlights.map((h, i) => <p key={i}>• {h}</p>)}<button onClick={handleDownloadInfographic} className="w-full bg-indigo-600 text-white py-2 rounded-lg mt-4">Download Image</button></div> })} className="text-indigo-500 text-sm font-bold">View Results</button>
                            </div>
                        )}
                    </div>
                </DashboardCard>

                {/* User Insights */}
                <DashboardCard title="User Insights" icon={ICONS.insights}>
                    <div className="h-56 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold uppercase text-black/50 dark:text-white/50">Recent Activity</h4>
                                {userHistory.length > 0 && (
                                    <button 
                                        onClick={clearHistory}
                                        className="text-xs text-red-500 hover:text-red-600 font-semibold tracking-wider uppercase transition-colors"
                                    >
                                        Clear History
                                    </button>
                                )}
                            </div>
                            <div className="space-y-2 overflow-y-auto h-32 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 pr-1">
                                {userHistory.length === 0 ? (
                                    <p className="text-sm text-center text-black/40 py-4 italic">No activity yet.</p>
                                ) : (
                                    userHistory.map(item => (
                                        <div key={item.id} className="text-xs p-2 bg-black/5 dark:bg-white/5 rounded-lg flex justify-between items-center border border-transparent hover:border-black/5">
                                            <span className="truncate flex-1 mr-2" title={item.query}>{item.query}</span>
                                            <span className="text-indigo-500 font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 uppercase text-[9px]">{item.type}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
                             <div className="flex items-center">
                                <div className={`p-2 rounded-full mr-3 ${truthBadgeEarned ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M2.166 4.9L9.03 9.069a2 2 0 001.94 0L17.834 4.9A2 2 0 0016.864 1.5H3.136a2 2 0 00-.97 3.4zM3.508 11.5A3 3 0 016.5 8.5h7a3 3 0 012.992 3L16.5 19H3.5l.008-7.5z" clipRule="evenodd" /></svg>
                                </div>
                                <span className="text-xs font-bold">{truthBadgeEarned ? 'Truth Seeker Badge Earned!' : `Badge: ${Math.max(0, 5 - userHistory.length)} more needed`}</span>
                             </div>
                        </div>
                    </div>
                </DashboardCard>
            </div>

            <Modal 
                isOpen={modalInfo.isOpen} 
                onClose={() => setModalInfo(prev => ({ ...prev, isOpen: false }))} 
                title={modalInfo.title}
            >
                {modalInfo.content}
            </Modal>
        </div>
    );
};

export default DashboardPage;