/**
 * Generate Article Content Blocks using Ollama Cloud.
 * Uses OLLAMA_API_KEY env var. Default: gemini-3-flash-preview:cloud (override with OLLAMA_MODEL).
 */
import { NextRequest, NextResponse } from "next/server";
import { Ollama } from "ollama";
import type { ContentBlock } from "@/lib/contentBlocks";
import { resolveOllamaModel } from "@/lib/resolveOllamaModel";
const API_KEY = process.env.OLLAMA_API_KEY;

function hasImageBlocks(blocks: unknown[]): boolean {
  return blocks.some((b) => {
    if (!b || typeof b !== "object" || !("type" in b)) return false;
    const t = String((b as Record<string, unknown>).type);
    return t === "image" || t === "two-columns";
  });
}

function buildFirstParagraphPrompt(title: string, description: string, type: string, modInfo: string): string {
  const kind = type === "game" ? "game" : "app";
  return `Write ONLY the first paragraph (2-4 sentences) for an APK download page about this ${kind}.

TITLE: ${title}
${description ? `CONTEXT: ${description}` : ""}
${modInfo ? `MOD FEATURES: ${modInfo}` : ""}

Requirements:
- SEO-friendly intro that describes the ${kind} based on the title
- 2-4 sentences, compelling and keyword-rich
- Output ONLY a JSON array with one block: [{"type":"text","content":"your paragraph here"}]
- No other text`;
}

function buildPrompt(title: string, description: string, type: string, modInfo: string): string {
  const kind = type === "game" ? "game" : "app";
  return `You are an expert writer for an APK download site. Generate a detailed, SEO-optimized article that describes this ${kind} based on its title.

TITLE: ${title}
${description ? `SHORT DESCRIPTION: ${description}` : ""}
${modInfo ? `MOD FEATURES: ${modInfo}` : ""}

FOCUS: Describe the ${kind} in depth based on the title. Explain what it is, how it works, key features, gameplay (for games) or functionality (for apps), and why users should download it.

WORD COUNT: The total content must be 300-400 words max. Keep paragraphs concise (2-4 sentences each).

SEO OPTIMIZATION:
- Naturally include the full title and ${kind} name several times throughout the article
- Use relevant keywords (e.g. "download", "MOD APK", "Android", ${kind}-specific terms)
- Write clear, descriptive headings (h1, h2) that include search-friendly phrases
- Structure content with proper H1/H2 hierarchy for readability and SEO
- Make the first paragraph compelling and keyword-rich

OUTPUT FORMAT: Return ONLY a valid JSON array of content blocks. No markdown, no explanation.
Each block must be one of:
- { "type": "text", "content": "paragraph text" }
- { "type": "h1", "content": "Section heading" }
- { "type": "h2", "content": "Subsection heading" }

RULES:
- Generate 5-10 blocks (300-400 words total)
- Start with 1-2 "text" blocks (concise intro that describes the ${kind} based on the title)
- Use "h1" for main sections (e.g. "KEY FEATURES", "GAMEPLAY") - do NOT use "WHY DOWNLOAD" or "CONCLUSION"
- Use "h2" for subsections
- Each "text" block: 2-4 sentences, concise and informative
- Do NOT include "image" or "two-columns" blocks
- Do NOT add "WHY DOWNLOAD" or "CONCLUSION" sections at the end
- Output ONLY the JSON array, no other text`;
}

function parseBlocksFromResponse(content: string): ContentBlock[] {
  const trimmed = content.trim();
  // Extract JSON array (handle markdown code blocks)
  let jsonStr = trimmed;
  const codeMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) jsonStr = codeMatch[1].trim();
  const arrMatch = trimmed.match(/\[[\s\S]*\]/);
  if (arrMatch) jsonStr = arrMatch[0];

  const parsed = JSON.parse(jsonStr) as unknown[];
  const blocks: ContentBlock[] = [];

  for (const item of parsed) {
    if (!item || typeof item !== "object" || !("type" in item)) continue;
    const obj = item as Record<string, unknown>;
    const type = String(obj.type);

    if (type === "text" && typeof obj.content === "string") {
      blocks.push({ type: "text", content: obj.content });
    } else if (type === "h1" && typeof obj.content === "string") {
      blocks.push({ type: "h1", content: obj.content });
    } else if (type === "h2" && typeof obj.content === "string") {
      blocks.push({ type: "h2", content: obj.content });
    }
  }
  return blocks;
}

export async function POST(req: NextRequest) {
  if (!API_KEY) {
    return NextResponse.json(
      { error: "OLLAMA_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: {
    title: string;
    description?: string;
    type?: string;
    modInfo?: string;
    existingBlocks?: unknown[];
    model?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const title = String(body.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const description = String(body.description || "").trim();
  const type = String(body.type || "game").trim() || "game";
  const modInfo = String(body.modInfo || "").trim();
  const existingBlocks = Array.isArray(body.existingBlocks) ? body.existingBlocks : [];
  const firstParagraphOnly = hasImageBlocks(existingBlocks);
  const model = resolveOllamaModel(body.model);

  const ollama = new Ollama({
    host: "https://ollama.com",
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  const prompt = firstParagraphOnly
    ? buildFirstParagraphPrompt(title, description, type, modInfo)
    : buildPrompt(title, description, type, modInfo);

  try {
    const response = await ollama.chat({
      model,
      messages: [{ role: "user", content: prompt }],
      stream: false,
    });

    const content = response.message?.content ?? "";
    if (!content) {
      return NextResponse.json(
        { error: "Empty response from Ollama" },
        { status: 500 }
      );
    }

    let blocks = parseBlocksFromResponse(content);
    if (blocks.length === 0) {
      return NextResponse.json(
        { error: "Could not parse content blocks from response" },
        { status: 500 }
      );
    }

    if (firstParagraphOnly && existingBlocks.length > 0) {
      const newFirstText = blocks.find((b) => b.type === "text");
      if (newFirstText && newFirstText.type === "text") {
        const firstTextIdx = existingBlocks.findIndex(
          (b) => b && typeof b === "object" && "type" in b && String((b as Record<string, unknown>).type) === "text"
        );
        const existing = existingBlocks as ContentBlock[];
        if (firstTextIdx >= 0) {
          blocks = [...existing.slice(0, firstTextIdx), newFirstText, ...existing.slice(firstTextIdx + 1)];
        } else {
          blocks = [newFirstText, ...existing];
        }
      } else {
        blocks = existingBlocks as ContentBlock[];
      }
    }

    return NextResponse.json({ blocks });
  } catch (err) {
    console.error("Ollama generate error:", err);
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
