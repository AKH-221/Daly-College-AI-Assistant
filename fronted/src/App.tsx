import { useState } from "react";
import { sendMessageToBackend, ChatMessage } from "./services/geminiService";

function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newUserMessage: ChatMessage = {
      role: "user",
      content: input.trim(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const reply = await sendMessageToBackend(
        newUserMessage.content,
        updatedMessages
      );

      const newAssistantMessage: ChatMessage = {
        role: "assistant",
        content: reply,
      };

      setMessages((prev) => [...prev, newAssistantMessage]);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong talking to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f3f4f6",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#1f2937",
          color: "white",
          padding: "1rem",
          fontSize: "1.5rem",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Daly College AI Assistant
      </header>

      {/* CHAT AREA */}
      <div
        style={{
          flexGrow: 1,
          padding: "1rem",
          overflowY: "auto",
