
import React from 'react';
import { SendIcon, LoadingIcon } from './icons';

interface InputBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSend: () => void;
  isLoading: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ value, onChange, onSend, isLoading }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading) {
      onSend();
    }
  };

  return (
    <div className="input-shell max-w-4xl mx-auto flex items-center gap-2">
      <span className="input-prefix" aria-hidden="true">Ask</span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        onKeyPress={handleKeyPress}
        placeholder="What would you like to discover?"
        disabled={isLoading}
        className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
      />
      <button
        onClick={onSend}
        disabled={isLoading || !value.trim()}
        className="send-button w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? <LoadingIcon /> : <SendIcon />}
      </button>
      <span className="input-hint hidden sm:block">↵ Send</span>
    </div>
  );
};

export default InputBar;
