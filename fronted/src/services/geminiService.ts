// fronted/src/geminiservice.ts

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const BACKEND_URL = "http://localhost:8080/api/chat";

export async function sendMessageToBackend(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      history: history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Backend error:", errorText);
    throw new Error(`Backend returned ${response.status}`);
  }

  const data = await response.json();
  // backend sends { reply: "..." }
  return data.reply;
}
