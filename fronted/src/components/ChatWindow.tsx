
import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import ChatMessage from './ChatMessage';

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, isLoading }) => {
  const chatWindowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={chatWindowRef} className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
      {messages.map((msg, index) => (
        <ChatMessage key={index} message={msg} index={index} />
      ))}
      {isLoading && (
        <div className="flex items-start gap-3 message-enter" aria-label="Assistant is thinking">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 flex items-center justify-center assistant-avatar-pulse">
            <span className="text-white text-sm">✦</span>
          </div>
          <div className="thinking-bubble bg-white dark:bg-slate-800 rounded-xl rounded-bl-none p-4 shadow-sm">
            <span /><span /><span />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;
