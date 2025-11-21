// src/App.tsx
import { useState } from "react";
import { sendMessageToBackend, ChatMessage } from "./services/geminiservice";

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
    <div>
      <h1>Daly College AI Assistant</h1>

      <div style={{ border: "1px solid #ccc", padding: "1rem", height: "300px", overflowY: "auto" }}>
        {messages.map((m, idx) => (
          <div key={idx} style={{ marginBottom: "0.5rem" }}>
            <strong>{m.role === "user" ? "You" : "Assistant"}: </strong>
            {m.content}
          </div>
        ))}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ marginTop: "1rem" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your question..."
        />
        <button onClick={handleSend} disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
