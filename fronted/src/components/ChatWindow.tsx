import React, { useRef, useEffect } from "react";
import { Message } from "../types";
import ChatMessage from "./ChatMessage";

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  // Invisible div placed at bottom of messages
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (bottomRef.current) {
      // 🔥 Smooth scroll animation
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages]);

  return (
    <div className="flex-1 space-y-6 max-w-4xl mx-auto w-full">
      {messages.map((msg, index) => (
        <ChatMessage key={index} message={msg} />
      ))}

      {/* Scroll target anchor */}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
