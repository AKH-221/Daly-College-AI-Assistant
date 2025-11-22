// fronted/src/services/geminiService.ts

import { Message } from "../types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const CHUNK_SEPARATOR = "__END_OF_CHUNK__";

// Base backend URL: env or localhost fallback
const BASE_BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "") ||
  "http://localhost:8080";

const CHAT_ENDPOINT = `${BASE_BACKEND_URL}/api/chat`;

/**
 * Low-level helper to call the backend and get a full reply string.
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
  return data.reply ?? "";
}

/**
 * Old/simple API – returns full reply as string.
 */
export async function sendMessageToBackend(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  return callBackend(message, history);
}

/**
 * New API used by App.tsx:
 * Takes history (Message[]), calls backend, wraps the reply
 * into a fake streaming ReadableStream with JSON chunks.
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

  const reply = await callBackend(messageText, chatHistory);
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      const chunkPayload =
        JSON.stringify({ text: reply }) + CHUNK_SEPARATOR;
      controller.enqueue(encoder.encode(chunkPayload));
      controller.close();
    },
  });
}
