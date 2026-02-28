import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hi! I'm the MarketVue AI assistant. How can I help you analyze the markets today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    // Auto-scroll to bottom of chat
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = { role: 'user', content: input.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
            const response = await fetch(`${apiUrl}/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMessage].map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.reply
            }]);

        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "⚠️ Sorry, I'm having trouble connecting to my servers right now. Please try again later."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const renderMessageContent = (content) => {
        if (typeof content !== 'string') return content;

        // Match standard markdown links: [Text](/path) or [Text](https://...)
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = linkRegex.exec(content)) !== null) {
            // Push text before the link
            if (match.index > lastIndex) {
                parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex, match.index)}</span>);
            }

            const linkText = match[1];
            const linkUrl = match[2];

            if (linkUrl.startsWith('/')) {
                // Internal route: render as a sleek button
                parts.push(
                    <button
                        key={`btn-${match.index}`}
                        onClick={() => {
                            setIsOpen(false); // Close chat when navigating so they can see the page
                            navigate(linkUrl);
                        }}
                        className="inline-flex items-center mt-2 mb-1 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/50 rounded-lg text-xs font-semibold transition-colors shadow-sm shadow-blue-900/20"
                    >
                        {linkText}
                    </button>
                );
            } else {
                // External link: render as standard <a>
                parts.push(
                    <a
                        key={`link-${match.index}`}
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline underline-offset-2 font-medium"
                    >
                        {linkText}
                    </a>
                );
            }

            lastIndex = linkRegex.lastIndex;
        }

        // Push any remaining text
        if (lastIndex < content.length) {
            parts.push(<span key={`text-${lastIndex}`}>{content.substring(lastIndex)}</span>);
        }

        return parts.length > 0 ? parts : content;
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300 animate-in slide-in-from-bottom-5">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Bot className="w-5 h-5" />
                            <span className="font-semibold">Market AI Assistant</span>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="h-96 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex items-start gap-2 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                            >
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-600' : 'bg-slate-700'
                                    }`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-emerald-400" />}
                                </div>
                                <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-sm'
                                    : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-sm flex flex-col items-start'
                                    }`}>
                                    {renderMessageContent(msg.content)}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex items-start gap-2 max-w-[85%]">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                                    <Bot className="w-4 h-4 text-emerald-400" />
                                </div>
                                <div className="p-3 bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-sm flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                                    <span className="text-xs text-slate-400">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-slate-800/80 border-t border-slate-700">
                        <form onSubmit={handleSubmit} className="relative flex items-center">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask about the markets..."
                                disabled={isLoading}
                                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isLoading}
                                className="absolute right-2 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-center w-14 h-14 rounded-full shadow-lg shadow-blue-500/20 transition-all duration-300 hover:scale-105 active:scale-95 ${isOpen ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
            >
                {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </button>
        </div>
    );
}
