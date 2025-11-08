
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from '@google/genai';
import { Message, GroundingChunk } from './types';
import { createChatSession } from './services/geminiService';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';

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

  const chatSessionRef = useRef<Chat | null>(null);

  useEffect(() => {
    chatSessionRef.current = createChatSession();
  }, []);

  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessage: Message = { role: 'user', parts: [{ text: messageText }] };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setUserInput('');

    try {
      if (!chatSessionRef.current) {
        throw new Error('Chat session not initialized.');
      }

      const stream = await chatSessionRef.current.sendMessageStream({ message: messageText });

      let modelResponse = '';
      const groundingChunks: GroundingChunk[] = [];
      setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          modelResponse += chunkText;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].parts[0].text = modelResponse;
            return newMessages;
          });
        }
        
        const newChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (newChunks) {
          for (const chunkData of newChunks) {
             if (chunkData.web?.uri && !groundingChunks.some(c => c.web?.uri === chunkData.web.uri)) {
                groundingChunks.push(chunkData);
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
  }, [isLoading]);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 font-sans h-screen w-screen flex flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        <ChatWindow messages={messages} />
        {error && (
            <div className="flex justify-center">
                <p className="text-red-500 bg-red-100 dark:bg-red-900/50 p-2 rounded-md text-sm">{error}</p>
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
