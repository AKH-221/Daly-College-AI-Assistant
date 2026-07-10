// src/services/geminiService.ts

import { Message } from "../types";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:8080";

console.log("🔧 Using backend URL:", API_BASE_URL);

// --------------------------------------------------------
// sendMessageToServer()
// Sends message to your backend → backend calls Gemini → returns reply
// --------------------------------------------------------

export async function sendMessageToServer(
  _history: Message[],
  userMessage: string
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: userMessage,   // Only send user message
      }),
    });

    // Handle backend not responding
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Backend returned error:", response.status, errorText);
      throw new Error("Backend returned an error");
    }

    const data = await response.json();
    console.log("📥 Backend replied:", data);

    if (!data.reply) {
      throw new Error("Backend did not return a valid reply");
    }

    return data.reply;

  } catch (err) {
    console.error("❌ Error contacting backend:", err);
    throw new Error("Failed to reach the backend");
  }
}
