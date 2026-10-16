import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type ProviderProtocol = "openai" | "anthropic";
export interface ProviderPreset { id: string; label: string; baseUrl: string; protocol: ProviderProtocol; envKey: string; defaultModel: string; }
export interface ProviderConfig { provider: string; apiKey?: string; model?: string; baseUrl?: string; }
interface DazzleConfig { activeProvider?: string; providers?: Record<string, ProviderConfig>; }

export const providerPresets: ProviderPreset[] = [
  { id: "openai", label: "OpenAI", baseUrl: "https://api.openai.com/v1", protocol: "openai", envKey: "OPENAI_API_KEY", defaultModel: "gpt-4o-mini" },
  { id: "anthropic", label: "Anthropic Claude", baseUrl: "https://api.anthropic.com/v1", protocol: "anthropic", envKey: "ANTHROPIC_API_KEY", defaultModel: "claude-3-5-haiku-latest" },
  { id: "google", label: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai", protocol: "openai", envKey: "GEMINI_API_KEY", defaultModel: "gemini-2.0-flash" },
  { id: "openrouter", label: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", protocol: "openai", envKey: "OPENROUTER_API_KEY", defaultModel: "openai/gpt-4o-mini" },
  { id: "groq", label: "Groq", baseUrl: "https://api.groq.com/openai/v1", protocol: "openai", envKey: "GROQ_API_KEY", defaultModel: "llama-3.3-70b-versatile" },
  { id: "mistral", label: "Mistral", baseUrl: "https://api.mistral.ai/v1", protocol: "openai", envKey: "MISTRAL_API_KEY", defaultModel: "mistral-small-latest" },
  { id: "deepseek", label: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", protocol: "openai", envKey: "DEEPSEEK_API_KEY", defaultModel: "deepseek-chat" },
  { id: "xai", label: "xAI Grok", baseUrl: "https://api.x.ai/v1", protocol: "openai", envKey: "XAI_API_KEY", defaultModel: "grok-3-mini" },
  { id: "together", label: "Together AI", baseUrl: "https://api.together.xyz/v1", protocol: "openai", envKey: "TOGETHER_API_KEY", defaultModel: "meta-llama/Llama-3.3-70B-Instruct-Turbo" },
  { id: "fireworks", label: "Fireworks AI", baseUrl: "https://api.fireworks.ai/inference/v1", protocol: "openai", envKey: "FIREWORKS_API_KEY", defaultModel: "accounts/fireworks/models/llama-v3p1-8b-instruct" },
  { id: "cerebras", label: "Cerebras", baseUrl: "https://api.cerebras.ai/v1", protocol: "openai", envKey: "CEREBRAS_API_KEY", defaultModel: "llama-3.3-70b" },
  { id: "perplexity", label: "Perplexity", baseUrl: "https://api.perplexity.ai", protocol: "openai", envKey: "PERPLEXITY_API_KEY", defaultModel: "sonar" },
  { id: "cohere", label: "Cohere", baseUrl: "https://api.cohere.ai/compatibility/v1", protocol: "openai", envKey: "COHERE_API_KEY", defaultModel: "command-a-03-2025" },
  { id: "deepinfra", label: "Deep Infra", baseUrl: "https://api.deepinfra.com/v1/openai", protocol: "openai", envKey: "DEEPINFRA_API_KEY", defaultModel: "meta-llama/Meta-Llama-3.1-8B-Instruct" },
  { id: "sambanova", label: "SambaNova", baseUrl: "https://api.sambanova.ai/v1", protocol: "openai", envKey: "SAMBANOVA_API_KEY", defaultModel: "Meta-Llama-3.3-70B-Instruct" },
  { id: "moonshot", label: "Moonshot Kimi", baseUrl: "https://api.moonshot.ai/v1", protocol: "openai", envKey: "MOONSHOT_API_KEY", defaultModel: "kimi-k2-0905-preview" },
  { id: "qwen", label: "Qwen / Alibaba", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", protocol: "openai", envKey: "DASHSCOPE_API_KEY", defaultModel: "qwen-plus" },
  { id: "nvidia", label: "NVIDIA NIM", baseUrl: "https://integrate.api.nvidia.com/v1", protocol: "openai", envKey: "NVIDIA_API_KEY", defaultModel: "meta/llama-3.1-70b-instruct" }
];

const configPath = join(homedir(), ".dazzle", "config.json");
export function preset(id: string): ProviderPreset { const result = providerPresets.find((item) => item.id === id); if (!result) throw new Error(`Unknown provider '${id}'. Run: dazzle providers list`); return result; }
async function loadConfig(): Promise<DazzleConfig> { try { return JSON.parse(await readFile(configPath, "utf8")) as DazzleConfig; } catch { return { providers: {} }; } }
async function saveConfig(config: DazzleConfig): Promise<void> { await mkdir(dirname(configPath), { recursive: true, mode: 0o700 }); await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 }); try { await chmod(configPath, 0o600); } catch { /* Windows */ } }
export async function listConfigured(): Promise<{ preset: ProviderPreset; config?: ProviderConfig; active: boolean }[]> { const config = await loadConfig(); return providerPresets.map((item) => ({ preset: item, config: config.providers?.[item.id], active: config.activeProvider === item.id })); }
export async function configureProvider(input: ProviderConfig): Promise<void> { const config = await loadConfig(); config.providers = config.providers ?? {}; config.providers[input.provider] = { ...config.providers[input.provider], ...input }; config.activeProvider = input.provider; await saveConfig(config); }
export async function removeProvider(id: string): Promise<void> { const config = await loadConfig(); delete config.providers?.[id]; if (config.activeProvider === id) delete config.activeProvider; await saveConfig(config); }
export async function resolveProvider(id?: string): Promise<{ preset: ProviderPreset; config: ProviderConfig; apiKey: string; model: string; baseUrl: string }> { const config = await loadConfig(); const providerId = id ?? config.activeProvider ?? "openai"; const p = preset(providerId); const saved = config.providers?.[providerId] ?? { provider: providerId }; const apiKey = saved.apiKey || process.env[p.envKey]; if (!apiKey) throw new Error(`No API key for ${p.label}. Set ${p.envKey} or run: dazzle providers add ${p.id}`); return { preset: p, config: saved, apiKey, model: saved.model || p.defaultModel, baseUrl: saved.baseUrl || p.baseUrl }; }

export async function chat(input: { provider?: string; model?: string; system?: string; prompt: string; temperature?: number }): Promise<string> {
  const active = await resolveProvider(input.provider); const model = input.model || active.model;
  if (active.preset.protocol === "anthropic") {
    const response = await fetch(`${active.baseUrl.replace(/\/$/, "")}/messages`, { method: "POST", headers: { "content-type": "application/json", "x-api-key": active.apiKey, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model, max_tokens: 4096, system: input.system, messages: [{ role: "user", content: input.prompt }], temperature: input.temperature ?? 0.7 }) });
    const data = await response.json() as { content?: { type: string; text?: string }[]; error?: { message?: string } }; if (!response.ok) throw new Error(data.error?.message || `Provider returned HTTP ${response.status}`); return data.content?.filter((part) => part.type === "text").map((part) => part.text).join("\n") || "";
  }
  const response = await fetch(`${active.baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${active.apiKey}` }, body: JSON.stringify({ model, messages: [{ role: "system", content: input.system || "You are Dazzle, a senior product designer and frontend creative director." }, { role: "user", content: input.prompt }], temperature: input.temperature ?? 0.7 }) });
  const data = await response.json() as { choices?: { message?: { content?: string } }[]; error?: { message?: string } }; if (!response.ok) throw new Error(data.error?.message || `Provider returned HTTP ${response.status}`); return data.choices?.[0]?.message?.content || "";
}
export { configPath };
