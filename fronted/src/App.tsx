import React, { useState, useCallback } from 'react';
import { Message, GroundingChunk } from './types';
import { sendMessageToServer } from './services/geminiService';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

const CHUNK_SEPARATOR = '__END_OF_CHUNK__';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      parts: [{ text: "Hello! I'm the Daly College Assistant. How can I help you today?" }],
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = { role: 'user', parts: [{ text: messageText }] };
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setUserInput('');

    try {
      const history = messages.slice(1);
      const stream = await sendMessageToServer(history, messageText);
      
      if (!stream) {
        throw new Error('Failed to get response stream.');
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let modelResponse = '';
      const groundingChunks: GroundingChunk[] = [];

      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split(CHUNK_SEPARATOR);
        buffer = parts.pop() || '';

        for (const part of parts) {
          if (part) {
            try {
              const parsedChunk = JSON.parse(part);
              
              if (parsedChunk.text) {
                modelResponse += parsedChunk.text;
                setMessages(prev => {
                  const newMessages = [...prev];
                  newMessages[newMessages.length - 1].parts[0].text = modelResponse;
                  return newMessages;
                });
              }

              if (parsedChunk.groundingChunks) {
                for (const chunkData of parsedChunk.groundingChunks) {
                  if (chunkData.web?.uri && !groundingChunks.some(c => c.web?.uri === chunkData.web.uri)) {
                    groundingChunks.push(chunkData);
                  }
                }
              }

            } catch (e) {
              console.error("Failed to parse chunk:", part, e);
            }
          }
        }
      }

      if (groundingChunks.length > 0) {
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === 'model') {
            lastMessage.groundingChunks = groundingChunks;
          }
          return newMessages;
        });
      }

    } catch (err) {
      const errorMessage = 'An error occurred. Please try again.';
      setError(errorMessage);
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: errorMessage }] }]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  // QUICK BUTTON PROMPTS  
  const quickPrompts = [
    { label: "Principal", text: "Who is the principal of Daly College?" },
    { label: "Fee Structure", text: "Give me the full Daly College fee structure for day scholars and boarders." },
    { label: "Senior Faculty", text: "List all senior faculty and HODs of Daly College." },
    { label: "Boarding Houses", text: "Tell me about Daly College boarding houses and their house masters." },
    { label: "Day Boarding Houses", text: "Explain Daly College day boarding houses and their house masters." },
    { label: "Campus", text: "What is the campus size and facilities of Daly College?" },
    { label: "Admissions", text: "What is the admission procedure for Daly College?" },
    { label: "Board of Governors", text: "Who are the members of the Daly College Board of Governors?" },
    { label: "About Daly College", text: "Tell me about Daly College." },
  ];

  return (
    <div className="bg-slate-100 dark:bg-slate-900 font-sans h-screen w-screen flex flex-col">
      <Header />

      {/* QUICK BUTTONS */}
      <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 flex flex-wrap gap-2">
        {quickPrompts.map((qp, index) => (
          <button
            key={index}
            onClick={() => handleSendMessage(qp.text)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-3 py-1 rounded-md transition"
          >
            {qp.label}
          </button>
        ))}
      </div>

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

      {/* FOOTER WITH CREDIT */}
      <footer className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 md:p-6">
        <InputBar
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onSend={() => handleSendMessage(userInput)}
          isLoading={isLoading}
        />
        <p className="text-center text-xs text-slate-500 mt-3">
          Developed by Dipakshi Kedia, 2025
        </p>
      </footer>
    </div>
  );
};

export default App;
