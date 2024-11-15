"use client"

import { WalletDefault } from '@coinbase/onchainkit/wallet';
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
    id: string;
    message: string;
    timestamp: Date;
    characterName: string;
}

interface ChatProps {
    messages: ChatMessage[];
}

const Chat = ({ messages }: ChatProps) => {
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isExpanded, setIsExpanded] = useState(false);


    // Smooth scroll to bottom whenever messages change
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTo({
                top: chatContainerRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages]);

    return (
        <div className={`
            transition-all duration-300 flex-1 md:flex-none
            md:w-80 md:h-[calc(100vh-2rem)] md:relative
            ${isExpanded
                ? 'fixed inset-0 z-50 bg-white/95'
                : 'relative bg-white/80 backdrop-blur-sm rounded-lg h-14 md:h-auto'
            }
        `}>
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className={`
                    p-4 border-b border-gray-200 cursor-pointer
                    flex items-center gap-3
                    md:cursor-default h-14 shrink-0
                `}
            >
                <div className="flex-1 flex items-center gap-2">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        Chat History
                        <div className="w-4 h-4 text-xs">
                            <WalletDefault />
                        </div>
                    </h2>
                    <button className="md:hidden ml-auto">
                        {isExpanded ? '✕' : '↑'}
                    </button>
                </div>
            </div>
            <div
                ref={chatContainerRef}
                className={`
                    overflow-y-auto p-4 space-y-4
                    transition-all duration-300
                    ${isExpanded
                        ? 'h-[calc(100vh-4rem)]'
                        : 'h-0 md:h-[calc(100vh-8rem)]'
                    }
                    ${!isExpanded && 'md:opacity-100 opacity-0'}
                `}
            >
                {messages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{msg.characterName}</span>
                            <span className="text-xs text-gray-500">
                                {msg.timestamp.toLocaleTimeString()}
                            </span>
                        </div>
                        <p className="text-sm text-gray-700 break-words">{msg.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Chat;
