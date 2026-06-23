import {
  DEFAULT_OLLAMA_MODEL_FALLBACK,
  OLLAMA_CLOUD_MODEL_OPTIONS,
} from "@/lib/ollamaCloudModelOptions";

const ALLOWED = new Set<string>(OLLAMA_CLOUD_MODEL_OPTIONS.map((o) => o.value));

/** Pick request model if whitelisted; otherwise env OLLAMA_MODEL or fallback. */
export function resolveOllamaModel(bodyModel: unknown): string {
  const envDefault = process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL_FALLBACK;
  if (typeof bodyModel !== "string") return envDefault;
  const trimmed = bodyModel.trim();
  if (ALLOWED.has(trimmed)) return trimmed;
  return envDefault;
}
