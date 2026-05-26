
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { getChatbotResponse, ChatResponse } from '../services/geminiService';
import { GroundingSource } from '../types';

interface Message {
    text: string;
    sender: 'user' | 'bot';
    sources?: GroundingSource[];
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { text: "KRONOSX AI live agent telemetry initialized. Ask me anything about narrative integrity or platform features.", sender: 'bot' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (userInput.trim() === '' || isLoading) return;

        const newUserMessage: Message = { text: userInput, sender: 'user' };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const botResult: ChatResponse = await getChatbotResponse(userInput);
            const newBotMessage: Message = { 
                text: botResult.text, 
                sender: 'bot',
                sources: botResult.sources 
            };
            setMessages(prev => [...prev, newBotMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Sorry, could not process telemetry stream.";
            const errorBotMessage: Message = { text: errorMessage, sender: 'bot' };
            setMessages(prev => [...prev, errorBotMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-gradient-to-tr from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white p-4 rounded-2xl shadow-[0_0_20px_rgba(0,240,255,0.4)] z-50 transform hover:scale-110 active:scale-95 transition-all duration-300 border border-white/10"
                aria-label="Open Chatbot Copilot"
            >
                {ICONS.chat}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full border-2 border-cyber-black animate-ping"></span>
            </button>
            
            {/* Chatbox Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-full max-w-[360px] h-[520px] glass dark:glass rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.6)] border border-white/10 z-50 flex flex-col overflow-hidden animate-float">
                    
                    {/* Header */}
                    <div className="flex justify-between items-center px-6 py-4 bg-white/5 border-b border-white/5">
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,240,255,1)]"></span>
                          <h3 className="font-heading font-black text-sm tracking-widest text-white uppercase">KRONOSX AI Agent</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors text-lg font-bold">&times;</button>
                    </div>

                    {/* Chat Messages Area */}
                    <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-2.5 rounded-2xl text-xs max-w-[85%] font-mono leading-relaxed ${
                                  msg.sender === 'user' 
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/20' 
                                    : 'bg-white/5 text-white/90 border border-white/10'
                                }`}>
                                    {msg.text}
                                </div>
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 text-[9px] font-mono pl-1 space-y-1">
                                        <p className="font-bold text-white/40 uppercase tracking-widest text-[8px]">Linked Evidence:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {msg.sources.map((source, sIdx) => (
                                                <a 
                                                    key={sIdx} 
                                                    href={source.uri} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="inline-block bg-cyan-400/10 text-cyan-400 border border-cyan-400/20 px-2 py-0.5 rounded-md hover:bg-cyan-400/20 transition-all truncate max-w-[110px]"
                                                    title={source.title}
                                                >
                                                    {source.title}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="px-4 py-2.5 rounded-2xl bg-white/5 border border-white/5 text-cyan-400 font-mono text-[10px] animate-pulse">
                                    Analyzing feed...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Chat Input Field */}
                    <div className="p-4 bg-white/5 border-t border-white/5">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Audit claim narrative..."
                                className="w-full bg-cyber-black/50 p-2.5 rounded-xl border border-white/10 text-xs font-mono text-white placeholder-white/20 focus:ring-1 focus:ring-cyan-400 focus:outline-none transition-all"
                                disabled={isLoading}
                            />
                            <button 
                              onClick={handleSend} 
                              disabled={isLoading || !userInput.trim()} 
                              className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/5 text-cyber-black disabled:text-white/20 font-black text-xs uppercase tracking-widest px-4 rounded-xl transition-all duration-300 disabled:cursor-not-allowed border border-white/10"
                            >
                                Send
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Chatbot;
