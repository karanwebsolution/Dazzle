#!/usr/bin/env node
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { designDirector, effectSchema, fontSchema, generateLanding, iconStyleSchema, layoutSchema, listSections, listStyles, listThemes, redesignLanding, sectionSchema, styleSchema, themeSchema, visualVariantSchema } from "dazzle-core";
import { executeDazzlePipeline, pipelineOutput, registerCreativeTools } from "./creative-tools.js";

const featureSchema = z.object({ title: z.string(), description: z.string(), icon: z.string().optional() });
const statSchema = z.object({ value: z.string(), label: z.string() });
const faqSchema = z.object({ question: z.string(), answer: z.string() });
const port = Number(process.env.PORT ?? 3000);
const apiKey = process.env.MCP_API_KEY;
const oauthClients = new Map<string, { redirectUris: string[] }>();
const authorizationCodes = new Map<string, { clientId: string; redirectUri: string; codeChallenge: string; scope: string; expiresAt: number }>();
const accessTokens = new Map<string, { scope: string; expiresAt: number }>();
const tokenSecret = apiKey ?? randomToken(32);
const publicHttp = process.env.RENDER === "true" || process.env.MCP_PUBLIC === "true";
const oauthEnabled = publicHttp && process.env.MCP_ENABLE_OAUTH === "true";

function createMcpServer(iconUrl?: string): McpServer {
  const server = new McpServer({
    name: "dazzle", title: "Dazzle", version: "0.3.0",
    websiteUrl: "https://github.com/karanwebsolution/Dazzle",
    description: "Beautiful, configurable landing pages from CLI or MCP.",
    icons: iconUrl ? [{ src: iconUrl, mimeType: "image/svg+xml", sizes: ["any"], theme: "dark" }] : undefined
  }, { instructions: "Dazzle is a complete landing-page and redesign engine, not a question-answering reference. When a user asks to use Dazzle, create or redesign a website, make a landing page, improve visual quality, add animation, or turn an idea into a real page, call the primary `dazzle` tool immediately. Translate the normal-language request into brand, product, audience, goal, tone, operation, and targetUrl when relevant. Do not make the user provide system instructions. Do not manually orchestrate specialist tools: Dazzle runs strategy, generation, Chromium rendering, validation, FFmpeg-ready media artifacts, and screenshot attachment itself. After the tool returns images, inspect them and call `dazzle` again with a revised brief if the visual result is weak. Local desktop mode exposes the full specialist catalog for inspection; use the primary dazzle tool for normal builds." });
  registerTools(server);
  return server;
}

function registerTools(server: McpServer): void {
  const strategyInput = {
    brand: z.string().min(1).describe("Brand, company, product, or project name"),
    product: z.string().min(1).describe("What is being offered and the central promise"),
    audience: z.string().optional().describe("Who will visit this page"),
    goal: z.string().optional().describe("Desired visitor action: signup, demo, sale, booking, download, or inquiry"),
    tone: z.string().optional().describe("Desired feeling or creative direction"),
    existingHtml: z.string().optional().describe("Existing landing HTML or a concise description of the current page to improve"),
    targetUrl: z.string().url().optional().describe("Existing public page URL to capture before redesign")
  };
  if (process.env.DAZZLE_EXPOSE_LEGACY_TOOLS === "true" || !publicHttp) {
  server.tool("dazzle_design_director", "Legacy diagnostic. Prefer the primary dazzle tool for any real build.", strategyInput, async (args) => ({ content: [{ type: "text", text: JSON.stringify(designDirector(args), null, 2) }] }));
  server.tool("dazzle_redesign_landing", "Legacy alias routed through the complete Dazzle orchestrator. Prefer the primary dazzle tool.", strategyInput, async (args) => pipelineOutput(await executeDazzlePipeline({ ...args, operation: "redesign", outputDir: "/tmp/dazzle-legacy-redesign", width: 1440, height: 1000 })));
  server.tool("dazzle_generate_landing", "Create a polished, responsive landing page from a complete creative brief. Use the style, layout, sections, copy, audience, and color controls to make the result specific rather than generic.", {
    brand: z.string().min(1).describe("Brand, company, product, or event name"), tagline: z.string().min(1).describe("Hero headline or central promise"), description: z.string().optional(), eyebrow: z.string().optional(), audience: z.string().optional(), creativeDirection: z.string().optional(),
    style: styleSchema.optional().describe("saas, editorial, bento, glass, brutalist, or luxury"), layout: layoutSchema.optional(), theme: themeSchema.optional(), fontPreset: fontSchema.optional().describe("sora, manrope, space-grotesk, instrument-serif, fraunces, or dm-sans"), iconStyle: iconStyleSchema.optional().describe("line, solid, geometric, editorial, or minimal"), visualVariant: visualVariantSchema.optional().describe("soft-tech, editorial-grid, neo-brutal, quiet-luxury, organic-flow, or mono-lab"), primaryColor: z.string().optional(), backgroundColor: z.string().optional(), effect3d: effectSchema.optional(), sections: z.array(sectionSchema).optional().describe(`Supported: ${listSections().join(", ")}`),
    ctaLabel: z.string().optional(), ctaHref: z.string().optional(), secondaryCtaLabel: z.string().optional(), secondaryCtaHref: z.string().optional(), features: z.array(featureSchema).optional(), stats: z.array(statSchema).optional(), faqs: z.array(faqSchema).optional(), testimonial: z.object({ quote: z.string(), name: z.string(), role: z.string() }).optional(), width: z.number().int().positive().optional(), height: z.number().int().positive().optional(), duration: z.number().positive().optional(), fps: z.number().positive().optional()
  }, async (args) => ({ content: [{ type: "text", text: generateLanding(args) }] }));
  server.tool("dazzle_list_themes", "List available color moods and their tokens", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listThemes(), null, 2) }] }));
  server.tool("dazzle_list_styles", "List visual style presets for generation", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listStyles()) }] }));
  server.tool("dazzle_list_sections", "List all supported landing page sections", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listSections()) }] }));
  server.tool("dazzle_preview_url", "Return a local preview URL for a generated HTML file", { file: z.string(), port: z.number().int().positive().optional() }, async ({ port: previewPort = 3000, file }) => ({ content: [{ type: "text", text: `http://localhost:${previewPort}/?file=${encodeURIComponent(file)}` }] }));
  server.tool("dazzle_render_video", "Describe a video render request for an optional HyperFrames integration", { file: z.string(), output: z.string(), fps: z.number().default(30), width: z.number().default(1920), height: z.number().default(1080), duration: z.number().default(10) }, async (args) => ({ content: [{ type: "text", text: `Render requested for ${args.file} → ${args.output} (${args.width}x${args.height}, ${args.fps}fps, ${args.duration}s). Install HyperFrames and ffmpeg to execute renders.` }] }));
  }
  registerCreativeTools(server);
}

function origin(req: IncomingMessage): string { return `${req.headers["x-forwarded-proto"] ?? "https"}://${req.headers.host ?? "localhost:" + port}`; }
function randomToken(bytes = 32): string { return randomBytes(bytes).toString("base64url"); }
function signedAccessToken(scope: string, expiresAt: number): string { const payload = Buffer.from(JSON.stringify({ scope, expiresAt }), "utf8").toString("base64url"); const signature = createHmac("sha256", tokenSecret).update(payload).digest("base64url"); return `dazzle_${payload}.${signature}`; }
function verifyAccessToken(value: string): { scope: string; expiresAt: number } | undefined { try { const [prefix, signature] = value.split("."); if (!prefix?.startsWith("dazzle_") || !signature) return undefined; const payload = prefix.slice("dazzle_".length); const expected = createHmac("sha256", tokenSecret).update(payload).digest("base64url"); if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return undefined; const record = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { scope: string; expiresAt: number }; return record.expiresAt > Date.now() ? record : undefined; } catch { return undefined; } }
function htmlEscape(value: string): string { return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c] ?? c)); }
function json(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void { res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers }); res.end(JSON.stringify(body)); }
function readBody(req: IncomingMessage): Promise<string> { return new Promise((resolve, reject) => { let data = ""; req.setEncoding("utf8"); req.on("data", (chunk: string) => { data += chunk; if (data.length > 2_000_000) reject(new Error("Request body too large")); }); req.on("end", () => resolve(data)); req.on("error", reject); }); }
function authorized(req: IncomingMessage): boolean {
  const value = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? (typeof req.headers["x-api-key"] === "string" ? req.headers["x-api-key"] : undefined);
  if (!value) return false;
  if (apiKey && value === apiKey) return true;
  const token = verifyAccessToken(value) ?? accessTokens.get(value);
  return Boolean(token && token.expiresAt > Date.now());
}
function pkceChallenge(verifier: string): string { return createHash("sha256").update(verifier).digest("base64url"); }

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const resourceMetadata = `${origin(req)}/.well-known/oauth-protected-resource`;
  if (publicHttp && !authorized(req)) { json(res, 401, { error: "Unauthorized" }, { "www-authenticate": `Bearer realm="dazzle", resource_metadata="${resourceMetadata}", scope="mcp:tools"` }); return; }
  try {
    res.setHeader("access-control-allow-origin", "*"); res.setHeader("access-control-allow-headers", "content-type, authorization, mcp-session-id, x-api-key"); res.setHeader("access-control-expose-headers", "mcp-session-id, mcp-protocol-version");
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined }); const server = createMcpServer(`${origin(req)}/icon.svg`); await server.connect(transport);
    const body = req.method === "POST" ? JSON.parse(await readBody(req)) : undefined; await transport.handleRequest(req, res, body);
  } catch (error) { if (!res.headersSent) json(res, 500, { error: error instanceof Error ? error.message : "MCP request failed" }); }
}

function resourceMetadata(req: IncomingMessage): Record<string, unknown> { const base = origin(req); return { resource: `${base}/mcp`, authorization_servers: [base], scopes_supported: ["mcp:tools"], bearer_methods_supported: ["header"], icon: `${base}/icon.svg` }; }
function authorizationMetadata(req: IncomingMessage): Record<string, unknown> { const base = origin(req); return { issuer: base, authorization_endpoint: `${base}/oauth/authorize`, token_endpoint: `${base}/oauth/token`, registration_endpoint: `${base}/oauth/register`, response_types_supported: ["code"], grant_types_supported: ["authorization_code"], token_endpoint_auth_methods_supported: ["none"], code_challenge_methods_supported: ["S256"], scopes_supported: ["mcp:tools"], client_id_metadata_document_supported: false }; }
function loginPage(params: URLSearchParams, error = ""): string {
  const fields = [...["client_id", "redirect_uri", "response_type", "scope", "state", "code_challenge", "code_challenge_method"].map((key) => `<input type="hidden" name="${key}" value="${htmlEscape(params.get(key) ?? "")}">`)].join("");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Connect Dazzle</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#08090f;color:#f8fafc;font:16px system-ui}main{width:min(90vw,420px);padding:2rem;border:1px solid #ffffff22;border-radius:20px;background:#151522;box-shadow:0 24px 80px #0008}h1{margin-top:0}p{color:#a1a1aa;line-height:1.5}label{display:block;margin:1.4rem 0 .4rem;font-size:.85rem}input{width:100%;box-sizing:border-box;padding:1rem;border-radius:10px;border:1px solid #ffffff25;background:#08090f;color:#fff;font-size:1rem}button{width:100%;padding:1rem;margin-top:1.5rem;border:0;border-radius:999px;background:#8b5cf6;color:#09090b;font-weight:800;font-size:1rem}small{display:block;margin-top:1rem;color:#71717a}.error{color:#fb7185}</style></head><body><main><p>DAZZLE MCP</p><h1>Connect your creative workspace</h1><p>Claude is asking for permission to use Dazzle's landing-page generation tools.</p>${error ? `<p class="error">${htmlEscape(error)}</p>` : ""}<form method="post" action="/oauth/authorize">${fields}<label>Access key</label><input type="password" name="access_key" autocomplete="current-password" required placeholder="Your MCP_API_KEY"><button type="submit">Allow Claude to connect</button></form><small>Your key is checked only by this Dazzle server.</small></main></body></html>`;
}

async function handleOAuth(req: IncomingMessage, res: ServerResponse, path: string, url: URL): Promise<void> {
  const base = origin(req);
  if (path === "/.well-known/oauth-protected-resource" || path === "/.well-known/oauth-protected-resource/mcp") { json(res, 200, resourceMetadata(req)); return; }
  if (path === "/.well-known/oauth-authorization-server" || path === "/.well-known/openid-configuration") { json(res, 200, authorizationMetadata(req)); return; }
  if (path === "/oauth/register" && req.method === "POST") {
    const data = JSON.parse(await readBody(req)) as { redirect_uris?: unknown }; const redirectUris = Array.isArray(data.redirect_uris) ? data.redirect_uris.filter((item): item is string => typeof item === "string") : [];
    if (!redirectUris.length) { json(res, 400, { error: "invalid_client_metadata", error_description: "redirect_uris is required" }); return; }
    const clientId = `dazzle_client_${randomToken(12)}`; oauthClients.set(clientId, { redirectUris }); json(res, 201, { client_id: clientId, client_id_issued_at: Math.floor(Date.now() / 1000), redirect_uris: redirectUris, token_endpoint_auth_method: "none" }); return;
  }
  if (path === "/oauth/authorize" && req.method === "GET") { res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" }); res.end(loginPage(url.searchParams)); return; }
  if (path === "/oauth/authorize" && req.method === "POST") {
    const form = new URLSearchParams(await readBody(req)); const clientId = form.get("client_id") ?? ""; const redirectUri = form.get("redirect_uri") ?? ""; const client = oauthClients.get(clientId);
    if (!client || !client.redirectUris.includes(redirectUri)) { json(res, 400, { error: "invalid_request", error_description: "Unknown client or redirect URI" }); return; }
    if (!apiKey || form.get("access_key") !== apiKey) { res.writeHead(401, { "content-type": "text/html; charset=utf-8" }); res.end(loginPage(form, "The access key is incorrect.")); return; }
    const code = randomToken(); authorizationCodes.set(code, { clientId, redirectUri, codeChallenge: form.get("code_challenge") ?? "", scope: form.get("scope") || "mcp:tools", expiresAt: Date.now() + 5 * 60_000 });
    const callback = new URL(redirectUri); callback.searchParams.set("code", code); if (form.get("state")) callback.searchParams.set("state", form.get("state") as string); res.writeHead(302, { location: callback.toString() }); res.end(); return;
  }
  if (path === "/oauth/token" && req.method === "POST") {
    const form = new URLSearchParams(await readBody(req)); const record = authorizationCodes.get(form.get("code") ?? ""); const client = oauthClients.get(form.get("client_id") ?? "");
    if (!record || !client || record.expiresAt < Date.now() || record.clientId !== form.get("client_id") || record.redirectUri !== form.get("redirect_uri")) { json(res, 400, { error: "invalid_grant" }); return; }
    if (record.codeChallenge && pkceChallenge(form.get("code_verifier") ?? "") !== record.codeChallenge) { json(res, 400, { error: "invalid_grant", error_description: "PKCE verification failed" }); return; }
    authorizationCodes.delete(form.get("code") ?? ""); const expiresAt = Date.now() + 30 * 24 * 60 * 60_000; const token = signedAccessToken(record.scope, expiresAt); json(res, 200, { access_token: token, token_type: "Bearer", expires_in: 30 * 24 * 60 * 60, scope: record.scope }); return;
  }
  json(res, 404, { error: "OAuth endpoint not found", base });
}

async function startHttp(): Promise<void> {
  const httpServer = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`); const path = url.pathname;
    if (req.method === "OPTIONS" && (path === "/mcp" || path.startsWith("/oauth/"))) { res.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization, mcp-session-id, x-api-key", "access-control-allow-methods": "GET,POST,DELETE,OPTIONS" }); res.end(); return; }
    if (path === "/health" && req.method === "GET") { json(res, 200, { status: "ok", name: "dazzle", transport: "streamable-http", authentication: publicHttp ? "api-key" : "none", oauth: oauthEnabled, authenticated: publicHttp ? Boolean(apiKey) : true, icon: `${origin(req)}/icon.svg`, runtime: { chromium: [process.env.CHROMIUM_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome"].filter(Boolean).find((candidate) => existsSync(candidate as string)) ?? null, ffmpeg: existsSync("/usr/bin/ffmpeg") } }); return; }
    if ((path === "/icon.svg" || path === "/favicon.svg") && (req.method === "GET" || req.method === "HEAD")) { res.writeHead(200, { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=86400", "access-control-allow-origin": "*", "content-disposition": "inline" }); if (req.method === "HEAD") { res.end(); return; } res.end(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="Dazzle"><title>Dazzle</title><defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17152a"/><stop offset="1" stop-color="#08090f"/></linearGradient><linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c4b5fd"/><stop offset=".5" stop-color="#8b5cf6"/><stop offset="1" stop-color="#6d28d9"/></linearGradient></defs><rect width="256" height="256" rx="58" fill="url(#b)"/><circle cx="128" cy="128" r="87" fill="#8b5cf6" opacity=".12"/><path d="M128 25c8 63 40 95 103 103-63 8-95 40-103 103-8-63-40-95-103-103 63-8 95-40 103-103Z" fill="url(#s)"/><circle cx="128" cy="128" r="10" fill="#fff"/></svg>`); return; }
    if (path === "/mcp" && ["GET", "POST", "DELETE"].includes(req.method ?? "")) { void handleMcp(req, res); return; }
    if (oauthEnabled && (path.startsWith("/.well-known/") || path.startsWith("/oauth/"))) { void handleOAuth(req, res, path, url); return; }
    json(res, 404, { error: "Not found", endpoints: ["/health", "/mcp", "/.well-known/oauth-protected-resource", "/oauth/authorize"] });
  });
  httpServer.listen(port, "0.0.0.0", () => console.log(`Dazzle MCP listening on port ${port} at /mcp (OAuth enabled)`));
}

if (process.env.MCP_TRANSPORT === "http" || process.env.RENDER === "true" || process.env.PORT) await startHttp();
else { const server = createMcpServer(); await server.connect(new StdioServerTransport()); }
