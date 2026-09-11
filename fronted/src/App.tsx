import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Message } from './types';
import { sendMessageToServer } from './services/geminiService';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

const App: React.FC = () => {

  // Reference to scroll container <main>
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Animated scroll function
  const smoothScrollToBottom = () => {
    if (scrollContainerRef.current) {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });
    }
  };

  // Default first message (greeting)
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

  // Welcome section toggle
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);

  // Run smooth scroll whenever messages update
  useEffect(() => {
    smoothScrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

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
        const replyText = await sendMessageToServer([], messageText);

        const modelMessage: Message = {
          role: 'model',
          parts: [{ text: replyText }],
        };

        setMessages((prev) => [...prev, modelMessage]);
      } catch (err) {
        const errorText = 'An error occurred. Please try again.';
        setMessages((prev) => [
          ...prev,
          { role: 'model', parts: [{ text: errorText }] },
        ]);
        setError(errorText);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  const quickPrompts = [
    { label: 'Principal', text: 'Who is the principal of Daly College?' },
    { label: 'Fee Structure', text: 'Give me the full Daly College fee structure.' },
    { label: 'Senior Faculty', text: 'List all senior faculty and HODs of Daly College.' },
    { label: 'Boarding Houses', text: 'Tell me about Daly College boarding houses.' },
    { label: 'Day Boarding Houses', text: 'Explain Daly College day boarding houses.' },
    { label: 'Campus', text: 'What are the campus facilities at Daly College?' },
    { label: 'Admissions', text: 'What is the admission procedure for Daly College?' },
    { label: 'Board of Governors', text: 'Who are the members of the Board of Governors?' },
    { label: 'About Daly College', text: 'Tell me about Daly College.' }
  ];

  return (
    <div className="app-shell bg-slate-100 dark:bg-slate-900 h-screen w-screen flex flex-col">
      <Header />

      <main
        ref={scrollContainerRef}
        className="app-main relative flex-1 overflow-y-auto p-4 md:p-6"
      >

        {/* Welcome Section */}
        {showQuickPrompts && (
          <section className="welcome-section flex flex-col items-center text-center mt-2 mb-8">
            <div className="welcome-panel">
            <div className="welcome-orb" aria-hidden="true">✦</div>
            <p className="welcome-kicker">Knowledge itself is power</p>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Your intelligent guide to Daly College
            </h1>

            <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
              Your guide to Daly College academics, admissions, boarding life, campus
              facilities, heritage, sports, and more. Ask anything or try one of
              these prompts to get started:
            </p>

            <div className="welcome-metrics" aria-label="Assistant capabilities">
              <span><strong>24/7</strong> guidance</span>
              <span><strong>9+</strong> topics</span>
              <span><strong>Instant</strong> answers</span>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-6">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qp.text)}
                  style={{ animationDelay: `${i * 55}ms` }}
                  className="prompt-chip px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-100 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 transition"
                >
                  <span className="prompt-chip-dot" aria-hidden="true" />
                  {qp.label}
                </button>
              ))}
            </div>
            </div>
          </section>
        )}

        {/* Chat Window */}
        <ChatWindow messages={messages} isLoading={isLoading} />

        {error && (
          <div className="flex justify-center mt-4">
            <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md text-sm">
              {error}
            </p>
          </div>
        )}
      </main>

      <footer className="app-footer bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 md:p-6">
        <InputBar
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onSend={() => handleSendMessage(userInput)}
          isLoading={isLoading}
        />

        <p className="text-center text-xs text-slate-500 mt-3">
          Daly College AI Assistant — Developed by Aung Kyaw Hann, Year 2025–26.
        </p>
      </footer>
    </div>
  );
};

export default App;
