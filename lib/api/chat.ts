import type { Message } from "@/types";

const API_URL = "https://www.aichixia.xyz/api/v1/chat/completions";
const API_KEY = process.env.NEXT_PUBLIC_AI_API_KEY!;
const DEFAULT_MODEL = "deepseek-v3.2";

interface ChatPayload {
  systemPrompt: string;
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export async function streamChat(
  payload: ChatPayload,
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: Error) => void
) {
  const { systemPrompt, messages, model = DEFAULT_MODEL, temperature = 0.8, max_tokens = 1024 } = payload;

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages,
        temperature,
        max_tokens,
        stream: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err?.error?.message ?? "API request failed");
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error("No response body");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.replace("data: ", "").trim();
        if (data === "[DONE]") {
          onDone();
          return;
        }
        try {
          const parsed = JSON.parse(data);
          const text = parsed.choices?.[0]?.delta?.content;
          if (text) onChunk(text);
        } catch {}
      }
    }

    onDone();
  } catch (err) {
    onError(err instanceof Error ? err : new Error("Unknown error"));
  }
}

export async function sendChat(payload: ChatPayload): Promise<string> {
  const { systemPrompt, messages, model = DEFAULT_MODEL, temperature = 0.8, max_tokens = 1024 } = payload;

  const formattedMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature,
      max_tokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? "API request failed");
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
