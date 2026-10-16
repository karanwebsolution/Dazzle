#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { effectSchema, generateLanding, layoutSchema, listSections, listStyles, listThemes, sectionSchema, styleSchema, themeSchema } from "dazzle-core";

const featureSchema = z.object({ title: z.string(), description: z.string(), icon: z.string().optional() });
const statSchema = z.object({ value: z.string(), label: z.string() });
const faqSchema = z.object({ question: z.string(), answer: z.string() });
const server = new McpServer({ name: "dazzle-mcp", version: "0.2.0" });

server.tool("dazzle_generate_landing", "Create a polished, responsive landing page from a complete creative brief. Use the style, layout, sections, copy, audience, and color controls to make the result specific rather than generic.", {
  brand: z.string().min(1).describe("Brand, company, product, or event name"),
  tagline: z.string().min(1).describe("Hero headline or central promise"),
  description: z.string().optional().describe("One-sentence value proposition"),
  eyebrow: z.string().optional(),
  audience: z.string().optional().describe("Who the page is for"),
  creativeDirection: z.string().optional().describe("Desired feeling, visual references, or art direction"),
  style: styleSchema.optional().describe("saas, editorial, bento, glass, brutalist, or luxury"),
  layout: layoutSchema.optional().describe("centered, split, or immersive"),
  theme: themeSchema.optional(),
  primaryColor: z.string().optional().describe("Custom accent color, preferably a hex value"),
  backgroundColor: z.string().optional(),
  effect3d: effectSchema.optional(),
  sections: z.array(sectionSchema).optional().describe(`Ordered sections. Supported: ${listSections().join(", ")}`),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
  features: z.array(featureSchema).optional(),
  stats: z.array(statSchema).optional(),
  faqs: z.array(faqSchema).optional(),
  testimonial: z.object({ quote: z.string(), name: z.string(), role: z.string() }).optional(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  duration: z.number().positive().optional(),
  fps: z.number().positive().optional()
}, async (args) => ({ content: [{ type: "text", text: generateLanding(args) }] }));

server.tool("dazzle_list_themes", "List available color moods and their tokens", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listThemes(), null, 2) }] }));
server.tool("dazzle_list_styles", "List visual style presets for generation", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listStyles()) }] }));
server.tool("dazzle_list_sections", "List all supported landing page sections", {}, async () => ({ content: [{ type: "text", text: JSON.stringify(listSections()) }] }));
server.tool("dazzle_preview_url", "Return a local preview URL for a generated HTML file", { file: z.string(), port: z.number().int().positive().optional() }, async ({ port = 3000, file }) => ({ content: [{ type: "text", text: `http://localhost:${port}/?file=${encodeURIComponent(file)}` }] }));
server.tool("dazzle_render_video", "Describe a video render request for an optional HyperFrames integration", { file: z.string(), output: z.string(), fps: z.number().default(30), width: z.number().default(1920), height: z.number().default(1080), duration: z.number().default(10) }, async (args) => ({ content: [{ type: "text", text: `Render requested for ${args.file} → ${args.output} (${args.width}x${args.height}, ${args.fps}fps, ${args.duration}s). Install HyperFrames and ffmpeg to execute renders.` }] }));

await server.connect(new StdioServerTransport());
