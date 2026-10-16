#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { effectSchema, generateLanding, layoutSchema, listSections, listStyles, listThemes, sectionSchema, styleSchema, themeSchema } from "dazzle-core";

const featureSchema = z.object({ title: z.string(), description: z.string(), icon: z.string().optional() });
const statSchema = z.object({ value: z.string(), label: z.string() });
const faqSchema = z.object({ question: z.string(), answer: z.string() });
const port = Number(process.env.PORT ?? 3000);
const apiKey = process.env.MCP_API_KEY;

function registerTools(server: McpServer): void {
  server.tool("dazzle_generate_landing", "Create a polished, responsive landing page from a complete creative brief. Use the style, layout, sections, copy, audience, and color controls to make the result specific rather than generic.", {
    brand: z.string().min(1).describe("Brand, company, product, or event name"), tagline: z.string().min(1).describe("Hero headline or central promise"), description: z.string().optional(), eyebrow: z.string().optional(), audience: z.string().optional(), creativeDirection: z.string().optional(),
    style: styleSchema.optional().describe("saas, editorial, bento, glass, brutalist, or luxury"), layout: layoutSchema.optional(), theme: themeSchema.optional(), primaryColor: z.string().optional(), backgroundColor: z.string().optional(), effect3d: effectSchema.optional(), sections: z.array(sectionSchema).optional().describe(`Supported: ${listSections().join(", ")}`),
    ctaLabel: z.string().optional(), ctaHref: z.string().optional(), secondaryCtaLabel: z.string().optional(), secondaryCtaHref: z.string().optional(), features: z.array(featureSchema).optional(), stats: z.array(statSchema).optional(), faqs: z.array(faqSchema).optional(), testimonial: z.object({ quote: z.string(), name: z.string(), role: z.string() }).optional(), width: z.number().int().positive().optional(), height: z.number().int().positive().optional(), duration: z.number().positive().optional(), fps: z.number().positive().optional()
  }, async (args) => ({ content: [{ type: "text", text: generateLanding(args) }] }));
  server.tool("dazzle_list_themes", "List available color moods and their tokens", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listThemes(), null, 2) }] }));
  server.tool("dazzle_list_styles", "List visual style presets for generation", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listStyles()) }] }));
  server.tool("dazzle_list_sections", "List all supported landing page sections", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listSections()) }] }));
  server.tool("dazzle_preview_url", "Return a local preview URL for a generated HTML file", { file: z.string(), port: z.number().int().positive().optional() }, async ({ port: previewPort = 3000, file }) => ({ content: [{ type: "text", text: `http://localhost:${previewPort}/?file=${encodeURIComponent(file)}` }] }));
  server.tool("dazzle_render_video", "Describe a video render request for an optional HyperFrames integration", { file: z.string(), output: z.string(), fps: z.number().default(30), width: z.number().default(1920), height: z.number().default(1080), duration: z.number().default(10) }, async (args) => ({ content: [{ type: "text", text: `Render requested for ${args.file} → ${args.output} (${args.width}x${args.height}, ${args.fps}fps, ${args.duration}s). Install HyperFrames and ffmpeg to execute renders.` }] }));
}

function authorized(req: IncomingMessage): boolean {
  if (!apiKey) return true;
  const bearer = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  return bearer === apiKey || req.headers["x-api-key"] === apiKey;
}
function json(res: ServerResponse, status: number, body: unknown): void { res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(body)); }
function readBody(req: IncomingMessage): Promise<unknown> { return new Promise((resolve, reject) => { let data = ""; req.setEncoding("utf8"); req.on("data", (chunk: string) => { data += chunk; if (data.length > 2_000_000) reject(new Error("Request body too large")); }); req.on("end", () => { try { resolve(data ? JSON.parse(data) : undefined); } catch { reject(new Error("Request body must be valid JSON")); } }); req.on("error", reject); }); }

async function handleMcp(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!authorized(req)) { json(res, 401, { error: "Unauthorized. Set Authorization: Bearer <MCP_API_KEY>." }); return; }
  try {
    res.setHeader("access-control-allow-origin", "*");
    res.setHeader("access-control-allow-headers", "content-type, authorization, mcp-session-id, x-api-key");
    res.setHeader("access-control-expose-headers", "mcp-session-id, mcp-protocol-version");
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = new McpServer({ name: "dazzle", version: "0.2.0" }); registerTools(server); await server.connect(transport);
    const body = req.method === "POST" ? await readBody(req) : undefined;
    await transport.handleRequest(req, res, body);
  } catch (error) { if (!res.headersSent) json(res, 500, { error: error instanceof Error ? error.message : "MCP request failed" }); }
}

async function startHttp(): Promise<void> {
  const httpServer = createServer((req, res) => {
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (req.method === "OPTIONS" && url.pathname === "/mcp") { res.writeHead(204, { "access-control-allow-origin": "*", "access-control-allow-headers": "content-type, authorization, mcp-session-id, x-api-key", "access-control-allow-methods": "GET,POST,DELETE,OPTIONS" }); res.end(); return; }
    if (url.pathname === "/health" && req.method === "GET") { json(res, 200, { status: "ok", name: "dazzle", transport: "streamable-http", authenticated: Boolean(apiKey) }); return; }
    if (url.pathname === "/mcp" && ["GET", "POST", "DELETE"].includes(req.method ?? "")) { void handleMcp(req, res); return; }
    json(res, 404, { error: "Not found", endpoints: ["/health", "/mcp"] });
  });
  httpServer.listen(port, "0.0.0.0", () => console.log(`Dazzle MCP listening on port ${port} at /mcp`));
}

if (process.env.MCP_TRANSPORT === "http" || process.env.RENDER === "true" || process.env.PORT) await startHttp();
else { const server = new McpServer({ name: "dazzle", version: "0.2.0" }); registerTools(server); await server.connect(new StdioServerTransport()); }
