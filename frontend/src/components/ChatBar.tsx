"use client"

import React, { useState } from 'react';
import { IoSend } from "react-icons/io5";

interface ChatBarProps {
    onSendMessage: (message: string) => void;
    disabled?: boolean;
}

const ChatBar: React.FC<ChatBarProps> = ({ onSendMessage, disabled = false }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSendMessage(message.trim());
            setMessage('');
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="absolute bottom-5 left-1/2 transform -translate-x-1/2 w-[90%] flex gap-2 items-center z-20"
        >
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={disabled}
                placeholder="Ask the AI characters a question..."
                className="flex-1 px-4 py-2 rounded-lg bg-white/95 backdrop-blur-sm 
                          border border-navy-600/20 text-navy-900 placeholder-navy-400
                          focus:outline-none focus:ring-2 focus:ring-navy-300"
            />
            <button
                type="submit"
                disabled={disabled || !message.trim()}
                className="p-2 rounded-lg bg-white/95 backdrop-blur-sm 
                          border border-navy-600/20 text-navy-900
                          hover:bg-navy-50 focus:outline-none 
                          focus:ring-2 focus:ring-navy-300
                          disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <IoSend size={20} className="text-navy-900" />
            </button>
        </form>
    );
};

export default ChatBar;
