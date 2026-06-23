export type ContentBlock =
  | { type: "text"; content: string }
  | { type: "h1"; content: string }
  | { type: "h2"; content: string }
  | { type: "image"; url: string; alt?: string }
  | {
      type: "two-columns";
      left: { type: "text"; content: string } | { type: "image"; url: string; alt?: string };
      right: { type: "text"; content: string } | { type: "image"; url: string; alt?: string };
    };

export function parseContentBlocks(json: string | null): ContentBlock[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
