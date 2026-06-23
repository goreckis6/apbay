/**
 * Generate meta description (short intro) using Ollama Cloud.
 * Default model: gemini-3-flash-preview:cloud (override with OLLAMA_MODEL).
 */
import { NextRequest, NextResponse } from "next/server";
import { Ollama } from "ollama";
import { resolveOllamaModel } from "@/lib/resolveOllamaModel";
const API_KEY = process.env.OLLAMA_API_KEY;

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "OLLAMA_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: { title: string; type?: string; modInfo?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const type = String(body.type || "game").trim() || "game";
  const modInfo = String(body.modInfo || "").trim();
  const kind = type === "game" ? "game" : "app";
  const model = resolveOllamaModel(body.model);

  const prompt = `Write a short meta description (1-2 sentences, 120-150 characters max) for an APK download page.

TITLE: ${title}
${modInfo ? `MOD FEATURES: ${modInfo}` : ""}

Requirements:
- SEO-friendly, include the ${kind} name and key appeal
- 1-2 sentences, 120-150 characters total (strict limit)
- Compelling, encourages click/download
- Output ONLY the description text, no quotes or extra formatting`;

  const ollama = new Ollama({
    host: "https://ollama.com",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    let description = (response.message?.content ?? "").trim();
    description = description.replace(/^["']|["']$/g, "").trim();
    if (description.length > 150) description = description.slice(0, 147) + "...";

    return NextResponse.json({ description });
  } catch (err) {
    console.error("Ollama meta description error:", err);
    let msg = err instanceof Error ? err.message : "Ollama request failed";
    const lower = String(msg).toLowerCase();
    const isLimit =
      /timeout|timed out|rate limit|rate-limited|quota|429|too many requests|limit exceeded|limit reached/i.test(lower);
    if (isLimit) {
      msg = `${msg} Spróbuj ponownie później. Sprawdź limity planu Ollama Cloud (ollama.com).`;
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
