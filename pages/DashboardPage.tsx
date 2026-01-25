
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
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
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

        // Proactively check for permissions using the Permissions API.
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
                // If query fails, proceed and let the browser's default behavior handle it.
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

        // Regex to find the first valid URL in a block of text
        const urlFindRegex = /(https?:\/\/[^\s"']*[^\s"'\.,])/;
        const urlMatch = trimmedInput.match(urlFindRegex);
        const potentialUrl = urlMatch ? urlMatch[0] : null;

        let articleContentToAnalyze = trimmedInput;
        // Use the URL for history if found, otherwise use a snippet of the text
        let analysisQuery = potentialUrl || (trimmedInput.substring(0, 30) + '...');

        try {
            if (potentialUrl) {
                try {
                    showToast('URL detected. Fetching article content...', 'info');
                    // Using a CORS proxy to fetch content client-side.
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(potentialUrl)}`;
                    const response = await fetch(proxyUrl);

                    if (!response.ok) {
                        throw new Error(`Request failed with status ${response.status}`);
                    }
                    const html = await response.text();

                    if (!html) {
                         throw new Error(`Fetched content is empty.`);
                    }

                    showToast('Extracting main text from page...', 'info');
                    const extractedText = await extractArticleTextFromHtml(html);
                    
                    if (!extractedText.trim()) {
                        throw new Error("Could not extract any meaningful text from the URL.");
                    }
                    articleContentToAnalyze = extractedText;
                } catch (fetchError) {
                    const message = fetchError instanceof Error ? fetchError.message : 'An unknown error occurred';
                    showToast(`Failed to process URL: ${message}. Analyzing the provided text instead.`, 'error');
                    // Fallback to analyzing the input text directly if fetching/extraction fails
                    articleContentToAnalyze = trimmedInput;
                    analysisQuery = trimmedInput.substring(0, 30) + '...';
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
            if (fromVoice) {
                addAssistantMessage('bot', 'Sorry, I encountered an error while analyzing the article.', true);
            }
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
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            showToast(message, 'error');
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
        if (window.confirm('Are you sure you want to clear your analysis history? This cannot be undone.')) {
            setUserHistory([]);
            showToast('History cleared successfully.', 'success');
        }
    };

    const handleDownloadInfographic = () => {
        const node = infographicRef.current;
        if (!node || !templateContent) return;
    
        // --- Configuration ---
        const scaleFactor = 2; // For higher resolution output
        const padding = 20;
        const { width } = node.getBoundingClientRect();
        const contentWidth = width - padding * 2;
        const fonts = {
            title: 'bold 20px sans-serif',
            highlight: '14px sans-serif',
            tip: 'italic 12px sans-serif',
        };
        const lineHeights = { title: 25, highlight: 20, tip: 18 };
        const margins = { afterTitle: 15, afterHighlights: 10 };
        
        // Determine colors based on theme for the export
        const isDarkMode = document.documentElement.classList.contains('dark');
        const colors = {
            background: isDarkMode ? '#000000' : '#ffffff',
            title: '#4f46e5',      // indigo-600
            highlight: isDarkMode ? '#ffffff' : '#000000',
            tip: isDarkMode ? '#ffffffaa' : '#000000aa',
        };
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        // --- Helper to measure height of wrapped text ---
        const measureTextHeight = (text: string, font: string, lineHeight: number): number => {
            ctx.font = font;
            const words = text.split(' ');
            let line = '';
            let y = lineHeight; // Start with one line's height
            for (const word of words) {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > contentWidth && line.length > 0) {
                    y += lineHeight;
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            return y;
        };
    
        // --- 1. Calculate total height required ---
        let totalHeight = padding;
        totalHeight += measureTextHeight(templateContent.title, fonts.title, lineHeights.title);
        totalHeight += margins.afterTitle;
        templateContent.highlights.forEach(h => {
            totalHeight += measureTextHeight(`• ${h}`, fonts.highlight, lineHeights.highlight);
        });
        totalHeight += margins.afterHighlights;
        templateContent.tips.forEach(t => {
            totalHeight += measureTextHeight(t, fonts.tip, lineHeights.tip);
        });
        totalHeight += padding;
        
        // --- 2. Set final canvas dimensions and styles ---
        canvas.width = width * scaleFactor;
        canvas.height = totalHeight * scaleFactor;
        
        ctx.fillStyle = colors.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.scale(scaleFactor, scaleFactor);
        ctx.textBaseline = 'top'; // Crucial for accurate Y positioning
    
        // --- Helper to draw wrapped text ---
        const drawWrappedText = (text: string, x: number, y: number, font: string, lineHeight: number, color: string): number => {
            ctx.font = font;
            ctx.fillStyle = color;
            const words = text.split(' ');
            let line = '';
            let currentY = y;
            for (const word of words) {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > contentWidth && line.length > 0) {
                    ctx.fillText(line.trim(), x, currentY);
                    currentY += lineHeight;
                    line = word + ' ';
                } else {
                    line = testLine;
                }
            }
            ctx.fillText(line.trim(), x, currentY);
            return currentY + lineHeight; // Return Y position for the *next* element
        };
    
        // --- 3. Perform drawing ---
        let currentY = padding;
        currentY = drawWrappedText(templateContent.title, padding, currentY, fonts.title, lineHeights.title, colors.title);
        currentY += margins.afterTitle;
        templateContent.highlights.forEach(h => {
            currentY = drawWrappedText(`• ${h}`, padding, currentY, fonts.highlight, lineHeights.highlight, colors.highlight);
        });
        currentY += margins.afterHighlights;
        templateContent.tips.forEach(t => {
            currentY = drawWrappedText(t, padding, currentY, fonts.tip, lineHeights.tip, colors.tip);
        });
    
        // --- 4. Trigger Download ---
        const link = document.createElement('a');
        link.download = 'CodeHustlers-Awareness-Card.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const getShareText = () => {
        if (!templateContent) return '';
        const { title, highlights, tips } = templateContent;
        const highlightsText = highlights.map(h => `• ${h}`).join('\n');
        const tipsText = tips.join('\n');
        return `${title}\n\n${highlightsText}\n\nKey Tips:\n${tipsText}\n\nAnalyzed with #CodeHustlers`;
    };

    const handleShare = (platform: 'whatsapp' | 'facebook') => {
        const text = getShareText();
        const encodedText = encodeURIComponent(text);
        let url = '';
        if (platform === 'whatsapp') {
            url = `https://api.whatsapp.com/send?text=${encodedText}`;
        } else if (platform === 'facebook') {
            // A placeholder URL is needed for the sharer.php link. The main content is in the quote.
            const placeholderUrl = 'https://ai.google.dev';
            url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(placeholderUrl)}&quote=${encodedText}`;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const handleInstagramShare = () => {
        showToast('First download the image, then share it on Instagram!', 'info');
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
                                className={`relative w-20 h-20 mx-auto flex items-center justify-center p-2 rounded-full transition-colors text-white font-bold ${isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:bg-gray-400