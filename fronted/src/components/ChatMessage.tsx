
import React from 'react';
import { Message } from '../types';
import { LinkIcon } from './icons';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const messageText = message.parts[0].text;
  const groundingChunks = message.groundingChunks?.filter(c => c.web && c.web.uri) ?? [];

  const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300 font-semibold">
      You
    </div>
  );

  const ModelIcon = () => (
    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
      DC
    </div>
  );

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <ModelIcon />}
      <div className="flex flex-col gap-2">
        <div
          className={`max-w-lg rounded-xl p-3 shadow-sm ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-bl-none'
          }`}
        >
          <div
            className="prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: messageText.replace(/\n/g, '<br />') }}
          />
        </div>
        {groundingChunks.length > 0 && !isUser && (
            <div className="max-w-lg pt-2 border-t border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Sources</h4>
                <ul className="space-y-1">
                  {groundingChunks.map((chunk, index) => (
                    <li key={index}>
                      <a
                        href={chunk.web!.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs hover:underline"
                        title={chunk.web!.uri}
                      >
                        <LinkIcon />
                        <span className="tcruncate">{chunk.web!.title || new URL(chunk.web!.uri).hostname}</span>
                      </a>
                    </li>
                  ))}
                </ul>
            </div>
          )}
      </div>
      {isUser && <UserIcon />}
    </div>
  );
};

export default ChatMessage;
