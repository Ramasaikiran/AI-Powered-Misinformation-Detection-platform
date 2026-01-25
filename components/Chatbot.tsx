import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { getChatbotResponse } from '../services/geminiService';

interface Message {
    text: string;
    sender: 'user' | 'bot';
}

const Chatbot: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { text: "Hi! How can I help you with CodeHustlers today?", sender: 'bot' }
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
            const botResponseText = await getChatbotResponse(userInput);
            const newBotMessage: Message = { text: botResponseText, sender: 'bot' };
            setMessages(prev => [...prev, newBotMessage]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Sorry, I couldn't get a response.";
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
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-full shadow-lg z-50 transform transition-transform hover:scale-110"
                aria-label="Open Chatbot"
            >
                {ICONS.chat}
            </button>
            {isOpen && (
                <div className="fixed bottom-20 right-6 w-full max-w-sm h-full max-h-[600px] bg-white dark:bg-black backdrop-blur-md rounded-2xl shadow-2xl z-50 flex flex-col animate-fade-in-up border border-black/10 dark:border-white/10">
                    {/* Header */}
                    <div className="flex justify-between items-center p-4 border-b border-black/10 dark:border-white/10">
                        <h3 className="font-bold text-black dark:text-white">CodeHustlers Assistant</h3>
                        <button onClick={() => setIsOpen(false)} className="text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white">&times;</button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 p-4 overflow-y-auto">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                                <div className={`px-4 py-2 rounded-lg max-w-xs ${msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-black/10 text-black dark:bg-white/10 dark:text-white'}`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start mb-3">
                                <div className="px-4 py-2 rounded-lg bg-black/10 dark:bg-white/10 text-black dark:text-white">
                                    <span className="animate-pulse">...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-black/10 dark:border-white/10">
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask a question..."
                                className="w-full bg-transparent p-2 rounded-md border border-black/20 dark:border-white/20 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                disabled={isLoading}
                            />
                            <button onClick={handleSend} disabled={isLoading} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-gray-500">
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