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
          borderBottom: "1px solid #ccc",
        }}
      >
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              marginBottom: "1rem",
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                padding: "0.7rem 1rem",
                borderRadius: "10px",
                maxWidth: "70%",
                background: m.role === "user" ? "#2563eb" : "#e5e7eb",
                color: m.role === "user" ? "white" : "black",
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.3rem" }}>
                {m.role === "user" ? "You" : "Assistant"}:
              </strong>
              {m.content}
            </div>
          </div>
        ))}

        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>

      {/* INPUT AREA */}
      <div
        style={{
          padding: "0.8rem",
          display: "flex",
          gap: "0.5rem",
          background: "white",
          borderTop: "1px solid #ccc",
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type your question..."
          style={{
            flexGrow: 1,
            padding: "0.7rem",
            borderRadius: "8px",
            border: "1px solid "#aaa",
            outline: "none",
            fontSize: "1rem",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading}
          style={{
            padding: "0.7rem 1rem",
            fontSize: "1rem",
            background: loading ? "#6b7280" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}

export default App;
