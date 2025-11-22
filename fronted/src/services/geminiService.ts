// fronted/src/services/geminiService.ts

import { Message } from "../types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const CHUNK_SEPARATOR = "__END_OF_CHUNK__";

// Base backend URL: use env if available, otherwise default to local
const BASE_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") || "http://localhost:8080";

const CHAT_ENDPOINT = `${BASE_BACKEND_URL}/api/chat`;

/**
 * Low-level helper to call the backend and get a full reply string.
 * Backend is expected to return JSON: { reply: "..." }
 */
async function callBackend(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("Backend error:", response.status, errorText);
    throw new Error(`Backend returned ${response.status}`);
  }

  const data = await response.json();
  // backend sends { reply: "..." }
  return data.reply ?? "";
}

/**
 * Old/simple API – kept in case anything else is still using it.
 * Returns the full reply as a string.
 */
export async function sendMessageToBackend(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  return callBackend(message, history);
}

/**
 * New API used by App.tsx.
 *
 * - Takes `history` in your frontend `Message` format
 * - Converts it to ChatMessage[] for the backend
 * - Calls the backend
 * - Wraps the full reply into a ReadableStream that emits a single JSON chunk:
 *   { "text": "<reply>" } + "__END_OF_CHUNK__"
 * so App.tsx can consume it exactly as it expects.
 */
export async function sendMessageToServer(
  history: Message[],
  messageText: string
): Promise<ReadableStream<Uint8Array>> {
  // Convert frontend Message[] → backend ChatMessage[]
  const chatHistory: ChatMessage[] = history.map((m) => ({
    role: m.role === "user" ? "user" : "assistant",
    content: m.parts?.map((p) => p.text).join(" ") ?? "",
  }));

  // Call backend and get the full reply as a string
  const reply = await callBackend(messageText, chatHistory);

  // Wrap in a fake streaming response so App.tsx logic works
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const chunkPayload = JSON.stringify({ text: reply }) + CHUNK_SEPARATOR;
      controller.enqueue(encoder.encode(chunkPayload));
      controller.close();
    },
  });
}
