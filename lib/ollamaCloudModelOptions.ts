/** Ollama Cloud models selectable from admin UI (tags from ollama.com). Safe for client components. */
export const OLLAMA_CLOUD_MODEL_OPTIONS = [
  { value: "gemini-3-flash-preview:cloud", label: "Gemini 3 Flash" },
  { value: "glm-4.6:cloud", label: "GLM 4.6" },
  { value: "deepseek-v3.1:671b-cloud", label: "DeepSeek V3.1 671B" },
] as const;

export const DEFAULT_OLLAMA_MODEL_FALLBACK = "gemini-3-flash-preview:cloud";
