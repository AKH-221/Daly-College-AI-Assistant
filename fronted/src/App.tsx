import React, { useState, useCallback } from 'react';
import { Message } from './types';
import { sendMessageToServer } from './services/geminiService';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

const App: React.FC = () => {
  // ✅ Default welcome message when page loads
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [
        {
          text: `Hello! I am the Daly College AI Assistant.  
I can help you with information about Daly College’s history, campus, facilities, staff, boarding houses, day boarding, fee guidance, admissions, and more.  
How can I assist you today?`,
        },
      ],
    },
  ]);

  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Controls whether the quick prompts are visible
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      // hide quick prompts after the first question is sent
      setShowQuickPrompts(false);

      setIsLoading(true);
      setError(null);

      const userMessage: Message = {
        role: 'user',
        parts: [{ text: messageText }],
      };

      setMessages((prev) => [...prev, userMessage]);
      setUserInput('');

      try {
        // history not used by backend – we just send the plain text
        const replyText = await sendMessageToServer([], messageText);

        const modelMessage: Message = {
          role: 'model',
          parts: [{ text: replyText }],
        };

        setMessages((prev) => [...prev, modelMessage]);
      } catch (err) {
        const errorMessage = 'An error occurred. Please try again.';
        setMessages((prev) => [
          ...prev,
          { role: 'model', parts: [{ text: errorMessage }] },
        ]);
        setError(errorMessage);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const quickPrompts = [
    { label: 'Principal', text: 'Who is the principal of Daly College?' },
    {
      label: 'Fee Structure',
      text: 'Give me the full Daly College fee structure for day scholars and boarders.',
    },
    {
      label: 'Senior Faculty',
      text: 'List all senior faculty and HODs of Daly College.',
    },
    {
      label: 'Boarding Houses',
      text: 'Tell me about Daly College boarding houses and their house masters.',
    },
    {
      label: 'Day Boarding Houses',
      text: 'Explain Daly College day boarding houses and their house masters.',
    },
    {
      label: 'Campus',
      text: 'What is the campus size and facilities of Daly College?',
    },
    {
      label: 'Admissions',
      text: 'What is the admission procedure for Daly College?',
    },
    {
      label: 'Board of Governors',
      text: 'Who are the members of the Daly College Board of Governors?',
    },
    { label: 'About Daly College', text: 'Tell me about Daly College.' },
  ];

  return (
    <div className="bg-slate-100 dark:bg-slate-900 font-sans h-screen w-screen flex flex-col">
      <Header />

      {/* ❌ Removed old top-bar quick prompts */}

      <main className="relative flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {/* ✅ Floating quick prompts – only before first question */}
        {showQuickPrompts && (
          <div className="mb-4 flex justify-center">
            <div className="bg-indigo-600/10 dark:bg-indigo-500/10 border border-indigo-400/60 dark:border-indigo-500 rounded-xl px-3 py-2 shadow-md flex flex-wrap gap-2 justify-center max-w-4xl">
              {quickPrompts.map((qp, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(qp.text)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm px-3 py-1 rounded-md transition"
                >
                  {qp.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <ChatWindow messages={messages} />

        {error && (
          <div className="flex justify-center">
            <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md text-sm">
              {error}
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 md:p-6">
        <InputBar
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onSend={() => handleSendMessage(userInput)}
          isLoading={isLoading}
        />

        {/* ✅ Correct developer credit */}
        <p className="text-center text-xs text-slate-500 mt-3">
          Daly College AI Assistant — Developed by Aung Kyaw Hann, Year 2025-26.
        </p>
      </footer>
    </div>
  );
};

export default App;