import React, { useState, useCallback } from 'react';
import { Message, GroundingChunk } from './types';
import { sendMessageToServer } from './services/geminiService';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [
        {
          text: "Hello! I'm the Daly College Assistant. How can I help you today?"
        }
      ]
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading) return;

      setIsLoading(true);
      setError(null);

      const userMessage: Message = {
        role: 'user',
        parts: [{ text: messageText }]
      };

      // Show user message immediately
      setMessages((prev) => [...prev, userMessage]);
      setUserInput('');

      try {
        // Exclude the initial welcome message from history if you want
        const history = messages.slice(1);

        // Ask Gemini for a reply (simple text, no streaming)
        const replyText = await sendMessageToServer(history, messageText);

        const groundingChunks: GroundingChunk[] = [];

        const modelMessage: Message = {
          role: 'model',
          parts: [{ text: replyText }],
          groundingChunks
        };

        setMessages((prev) => [...prev, modelMessage]);
      } catch (err) {
        const errorMessage = 'An error occurred. Please try again.';
        setError(errorMessage);
        setMessages((prev) => [
          ...prev,
          { role: 'model', parts: [{ text: errorMessage }] }
        ]);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages]
  );

  return (
    <div className="bg-slate-100 dark:bg-slate-900 font-sans h-screen w-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <ChatWindow messages={messages} />
        {error && (
          <div className="flex justify-center">
            <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md text-sm">
              {error}
            </p>
          </div>
        )}
      </main>
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 md:p-6 sticky bottom-0">
        <InputBar
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onSend={() => handleSendMessage(userInput)}
          isLoading={isLoading}
        />
      </footer>
    </div>
  );
};

export default App;
