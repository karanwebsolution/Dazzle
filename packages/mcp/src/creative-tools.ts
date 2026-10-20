import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { chromium } from "playwright-core";
import { z } from "zod";
import { designDirector, generateApp, generateLanding, lintComposition, type DesignStrategy } from "dazzle-core";
import { buildMobileFlow, chooseMagicComponents, platformPlan, type DazzleOutput, type DazzlePlatform } from "dazzle-magicui";

const exec = promisify(execFile);
const briefSchema = {
  brand: z.string().min(1).describe("Brand or project name"),
  product: z.string().min(1).describe("Product, service, or page promise"),
  audience: z.string().optional(),
  goal: z.string().optional(),
  tone: z.string().optional(),
  existingHtml: z.string().optional().describe("Existing HTML or current-page description"),
  brief: z.string().optional().describe("Additional human design direction")
};

type Brief = { brand: string; product: string; audience?: string; goal?: string; tone?: string; existingHtml?: string; brief?: string; competitorUrls?: string[]; competitorCount?: number; platform?: DazzlePlatform; output?: DazzleOutput; media?: "image" | "video" | "3d" | "none"; experience?: "landing" | "app" };
const output = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
export async function pipelineOutput(result: any): Promise<{ content: ({ type: "text"; text: string } | { type: "image"; data: string; mimeType: string })[] }> {
  const content: ({ type: "text"; text: string } | { type: "image"; data: string; mimeType: string })[] = [{ type: "text", text: JSON.stringify(result, null, 2) }];
  const screenshots: [string, string | undefined][] = [["generated", result.artifacts.generatedScreenshot], ["target full-page", result.artifacts.targetScreenshot], ...(result.artifacts.targetScreenshots ?? []).slice(1).map((path: string, index: number) => [`target segment ${index + 2}`, path] as [string, string]), ...(result.artifacts.competitorScreenshots ?? []).map((path: string, index: number) => [`competitor ${index + 1} full-page`, path] as [string, string])];
  for (const [label, path] of screenshots) {
    if (!path) continue;
    try { content.push({ type: "image", data: (await readFile(path)).toString("base64"), mimeType: "image/png" }); content.push({ type: "text", text: `${label} screenshot attached above. Inspect it visually before approving.` }); } catch { /* manifest still contains the path */ }
  }
  return { content };
}
function strategy(args: Brief): DesignStrategy { return designDirector(args); }
function specialist(name: string, args: Brief): unknown {
  const s = strategy(args);
  const map: Record<string, unknown> = {
    dazzle_analyze_brief: { summary: s.summary, audience: s.audience, creativeDirection: args.brief ?? args.tone },
    dazzle_profile_audience: s.audience,
    dazzle_map_visitor_journey: { stages: ["arrival: understand the promise", "orientation: recognize personal relevance", "proof: reduce risk", "decision: choose one next step", "action: complete the CTA"], frictionChecks: s.conversion.frictionReducers },
    dazzle_conversion_audit: { verdict: "Audit the rendered page before making a conversion claim.", evidencePriority: ["message match", "mobile above the fold", "offer clarity", "risk reversal", "form and checkout friction", "trust beside the CTA", "post-click path", "measurement"], reportShape: ["Verdict", "Fix now (ordered by expected impact)", "Test, don't guess", "Not a problem", "Could not check"], limits: ["cap fix list at seven", "never promise percentage lift", "mark URL-only findings as estimates", "separate upstream offer problems from page problems"], strategy: s.conversion },
    dazzle_human_psychology: s.psychology,
    dazzle_content_audit: { hierarchy: ["one promise", "three benefits", "specific proof", "objection handling", "single next action"], avoid: ["generic claims", "feature dumping", "multiple competing CTAs", "unearned superlatives"] },
    dazzle_seo_audit: { titleRule: "one clear promise under 60 characters", descriptionRule: "benefit plus audience plus action under 160 characters", headings: "one H1, logical H2 sections", performance: ["lazy-load below-fold media", "reserve media dimensions", "avoid blocking third-party scripts"] },
    dazzle_accessibility_audit: { requirements: ["visible focus states", "keyboard navigation", "semantic headings", "alt text for informative imagery", "contrast-safe accent colors", "prefers-reduced-motion fallback", "no information conveyed by color alone"] },
    dazzle_responsive_audit: { breakpoints: ["mobile: single-column reading flow", "tablet: preserve hierarchy and reduce art scale", "desktop: use intentional whitespace and composition"], checks: ["CTA remains visible", "headline does not orphan", "cards do not become tiny", "3D never blocks copy"] },
    dazzle_motion_audit: s.motion,
    dazzle_choose_style: s.design.style,
    dazzle_choose_theme: s.design.theme,
    dazzle_choose_palette: s.design.palette,
    dazzle_choose_typography: { direction: s.design.typography, fontPreset: s.design.fontPreset, usage: "display font for hero and section headings; body font for readable copy; never use more than two families" },
    dazzle_choose_font: { preset: s.design.fontPreset, direction: s.design.typography },
    dazzle_choose_icons: s.iconography,
    dazzle_choose_layout: { layout: s.design.layout, density: s.design.density, radius: s.design.radius },
    dazzle_choose_sections: s.sections,
    dazzle_choose_cta: s.conversion,
    dazzle_choose_cards: { geometry: s.design.radius, density: s.design.density, behavior: "cards support scanning; hover adds only a small lift and border/accent change" },
    dazzle_choose_hero_media: { heroVisual: s.media.heroVisual, reason: "The first visual must clarify the product before it decorates the page.", avoid: s.media.avoid },
    dazzle_choose_image_moments: s.media.imageMoments,
    dazzle_choose_video_moments: s.media.videoMoments,
    dazzle_choose_three_scene: { use: s.media.heroVisual === "three-js", effect: s.motion.effect, constraints: ["keep the render behind copy", "pause or simplify on mobile", "honor reduced motion"] },
    dazzle_choose_navigation: { pattern: "short nav with one primary CTA", rule: "navigation should orient, never compete with the hero" },
    dazzle_choose_social_proof: s.conversion.trustSignals,
    dazzle_choose_pricing: { include: /price|sale|subscription|plan/i.test(`${args.product} ${args.goal ?? ""}`), rule: "show the recommended path first and explain what is included" },
    dazzle_choose_faq: { include: true, questions: ["How does it work?", "Who is it for?", "What happens next?", "What does it replace?", "Can I get help?"] },
    dazzle_design_tokens: { colors: s.design.palette, typography: s.design.typography, fontPreset: s.design.fontPreset, iconStyle: s.design.iconStyle, iconography: s.iconography, visualVariant: s.design.visualVariant, radius: s.design.radius, motion: s.motion.level, spacing: s.design.density },
    dazzle_write_page_copy: { voice: args.tone ?? "clear, human, confident", promise: args.product, cta: s.conversion.cta, copyRules: ["lead with outcome", "use concrete verbs", "keep paragraphs short", "make proof specific"] },
    dazzle_generate_css_art: { recipe: "layered gradients + restrained geometric form", accent: s.design.palette[2], placement: "hero or showcase", fallback: "static CSS still image" },
    dazzle_generate_three_scene: { scene: s.media.heroVisual === "three-js" ? "hero product artifact" : "none", effect: s.motion.effect, performanceBudget: "lazy-load and cap DPR on mobile" },
    dazzle_generate_remotion_plan: { composition: "DazzleLandingAudit", fps: 30, durationSeconds: 8, shots: ["hero reveal", "benefit rhythm", "proof beat", "CTA resolve"], reducedMotion: "static keyframe at t=0" },
    dazzle_generate_hyperframes_plan: { timeline: "seekable Dazzle composition", clips: ["hero", "features", "showcase", "cta"], output: "mp4/webm preview" },
    dazzle_redesign_plan: { preserve: ["brand truth", "recognizable offer", "useful proof"], change: ["generic hierarchy", "weak CTA", "unmotivated motion", "decorative sections"], strategy: s },
    dazzle_human_review_score: { clarity: 0, relevance: 0, trust: 0, memorability: 0, actionability: 0, instruction: "Score the rendered frames after visual inspection; do not score source HTML alone." }
  };
  return map[name] ?? { strategy: s };
}

async function chromiumPath(): Promise<string> {
  const candidates = [process.env.CHROMIUM_PATH, "/usr/bin/chromium", "/usr/bin/chromium-browser", "/usr/bin/google-chrome", "chromium"].filter(Boolean) as string[];
  for (const candidate of candidates) {
    if (candidate.startsWith("/") && existsSync(candidate)) return candidate;
    if (!candidate.startsWith("/")) { try { const found = await exec("which", [candidate]); if (found.stdout.trim()) return found.stdout.trim(); } catch { /* try next candidate */ } }
  }
  throw new Error("Dazzle visual runtime unavailable: Chromium was not found. Deploy the repository Dockerfile on Render or set CHROMIUM_PATH to an installed Chromium binary.");
}
async function screenshot(target: string, outputPath: string, width: number, height: number, fullPage = false): Promise<string> {
  await mkdir(dirname(resolve(outputPath)), { recursive: true });
  const url = safeRenderTarget(target);
  const browser = await chromium.launch({ executablePath: await chromiumPath(), headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  try {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
    await page.evaluate(() => { const win = window as unknown as { __seek?: (time: number) => void }; win.__seek?.(9999); });
    await page.evaluate(async () => { await document.fonts?.ready; });
    await page.waitForTimeout(500);
    const visible = await page.evaluate(() => ({ text: (document.body?.innerText ?? "").trim().length, width: document.body?.scrollWidth ?? 0, height: document.body?.scrollHeight ?? 0 }));
    if (visible.text < 24 || visible.width < 10 || visible.height < 10) throw new Error(`Rendered page is blank or too small (text=${visible.text}, size=${visible.width}x${visible.height})`);
    await page.screenshot({ path: outputPath, fullPage });
  } finally { await browser.close(); }
  return outputPath;
}
function safeRenderTarget(target: string): string {
  if (/^https?:\/\//i.test(target)) {
    const url = new URL(target);
    const hostname = url.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "metadata.google.internal" || hostname === "ip6-localhost" || hostname === "0.0.0.0" || hostname === "127.0.0.1" || hostname === "169.254.169.254" || /^10\.|^192\.168\.|^172\.(?:1[6-9]|2\d|3[01])\./.test(hostname)) throw new Error("Refusing to render a private or local network target");
    return url.toString();
  }
  const local = resolve(target.replace(/^file:\/\//i, ""));
  if (!isAbsolute(local) || (!local.startsWith("/tmp/") && !local.startsWith(`${process.cwd()}/`))) throw new Error("Local render targets must be inside /tmp or the Dazzle workspace");
  return pathToFileURL(local).href;
}
async function ffprobe(input: string): Promise<unknown> { const result = await exec("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", input], { timeout: 60_000 }); return JSON.parse(result.stdout); }
async function pageSnapshot(targetUrl: string): Promise<{ url: string; title: string; description: string; headings: string[]; visibleCopy: string }> {
  safeRenderTarget(targetUrl);
  try {
    const response = await fetch(targetUrl, { redirect: "follow", signal: AbortSignal.timeout(20_000) });
    const html = await response.text();
    const one = (pattern: RegExp): string => (html.match(pattern)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const headings = [...html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi)].map((m) => (m[1] ?? "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 24);
    const visibleCopy = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<svg[\s\S]*?<\/svg>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 6000);
    if (visibleCopy.length >= 24) return { url: response.url, title: one(/<title[^>]*>([\s\S]*?)<\/title>/i), description: one(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i), headings, visibleCopy };
  } catch { /* browser fallback below */ }
  const browser = await chromium.launch({ executablePath: await chromiumPath(), headless: true, args: ["--no-sandbox", "--disable-gpu"] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 12_000 }).catch(() => undefined);
    await page.waitForTimeout(800);
    return await page.evaluate((url) => ({ url: location.href || url, title: document.title, description: document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "", headings: [...document.querySelectorAll("h1,h2,h3")].map((node) => (node.textContent ?? "").replace(/\s+/g, " ").trim()).filter(Boolean).slice(0, 24), visibleCopy: (document.body?.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 6000) }), targetUrl);
  } finally { await browser.close(); }
}

async function discoverCompetitors(args: Brief, targetUrl?: string): Promise<string[]> {
  const limit = Math.min(Math.max(args.competitorCount ?? 5, 1), 5);
  const explicit = (args.competitorUrls ?? []).filter((url) => /^https?:\/\//.test(url)).slice(0, limit);
  if (explicit.length >= limit) return explicit;
  const query = encodeURIComponent(`${args.product} ${args.audience ?? ""} alternatives competitors landing page`);
  try {
    const response = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, { signal: AbortSignal.timeout(15_000), headers: { "user-agent": "Dazzle/1.0 competitive-research" } });
    const html = await response.text();
    const targetHost = targetUrl ? new URL(targetUrl).hostname.replace(/^www\./, "") : "";
    const found: string[] = [];
    for (const match of html.matchAll(/class=["']result__a["'][^>]+href=["']([^"']+)["']/gi)) {
      try {
        const href = match[1];
        if (!href) continue;
        const url = new URL(href, "https://html.duckduckgo.com");
        const host = url.hostname.replace(/^www\./, "");
        if (!/^https?:$/.test(url.protocol) || host === targetHost || /duckduckgo|facebook|instagram|linkedin|youtube|wikipedia|g2|capterra|reddit/i.test(host) || found.some((item) => new URL(item).hostname === host)) continue;
        found.push(url.toString());
        if (found.length >= limit - explicit.length) break;
      } catch { /* ignore malformed search result */ }
    }
    const categoryFallback = /\b(code|coding|developer|agent|workspace|editor|ide|copilot)\b/i.test(`${args.product} ${args.audience ?? ""}`) ? ["https://lovable.dev", "https://cursor.com", "https://windsurf.com", "https://replit.com", "https://bolt.new"] : [];
    return [...new Set([...explicit, ...found, ...categoryFallback])].filter((url) => !targetUrl || new URL(url).hostname !== new URL(targetUrl).hostname).slice(0, limit);
  } catch { return explicit; }
}

export async function executeDazzlePipeline(args: Brief & { operation: "create" | "redesign"; targetUrl?: string; outputDir: string; width: number; height: number }): Promise<unknown> {
  const dir = args.outputDir === "/tmp/dazzle-build" ? `/tmp/dazzle-build-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` : args.outputDir;
  await mkdir(dir, { recursive: true });
  const selectedPlatform = args.platform ?? "web";
  const selectedOutput = args.output ?? (selectedPlatform === "web" || selectedPlatform === "mobile-web" ? "html" : "tsx");
  const selectedPlatformPlan = platformPlan(selectedPlatform, selectedOutput);
  const selectedMagicComponents = chooseMagicComponents({ platform: selectedPlatform, motion: "expressive", media: args.media ?? "image" });
  const mobileFlow = buildMobileFlow();
  await writeFile(`${dir}/platform-plan.json`, `${JSON.stringify(selectedPlatformPlan, null, 2)}\n`);
  await writeFile(`${dir}/magicui-plan.json`, `${JSON.stringify({ source: "vendor/magicui", components: selectedMagicComponents, license: "MIT", selectionRule: "Choose by comprehension, conversion, platform fit, and performance budget; do not use a fixed template." }, null, 2)}\n`);
  await writeFile(`${dir}/mobile-flow.json`, `${JSON.stringify(mobileFlow, null, 2)}\n`);
  const snapshot = args.targetUrl ? await pageSnapshot(args.targetUrl).catch(() => undefined) : undefined;
  const competitorUrls = await discoverCompetitors(args, args.targetUrl);
  const competitorSnapshots: { url: string; snapshot?: Awaited<ReturnType<typeof pageSnapshot>>; screenshot?: string }[] = [];
  for (const [index, competitorUrl] of competitorUrls.entries()) {
    const competitorSnapshot = await pageSnapshot(competitorUrl).catch(() => undefined);
    const competitorScreenshot = await screenshot(competitorUrl, `${dir}/competitors/competitor-${index + 1}-full.png`, args.width, args.height, true).catch(() => undefined);
    competitorSnapshots.push({ url: competitorUrl, snapshot: competitorSnapshot, screenshot: competitorScreenshot });
  }
  const competitorContext = competitorSnapshots.map((item, index) => `COMPETITOR ${index + 1}: ${item.url}\nTitle: ${item.snapshot?.title ?? "unavailable"}\nHeadings: ${(item.snapshot?.headings ?? []).join(" | ")}\nUse only for category patterns and opportunity gaps; never copy its copy, layout, brand, or distinctive visual identity.`).join("\n\n");
  const inferredBrand = args.brand || snapshot?.title.split(/\s[|—-]\s/)[0] || "Dazzle project";
  const inferredProduct = args.product || snapshot?.headings[0] || snapshot?.title || "A clearer digital experience";
  const experience = args.experience ?? (/\b(app|application|dashboard|workspace|editor|ide|agent|assistant|copilot|composer|skills|sidebar|cod(e|ing)|developer tool)\b/i.test(`${args.product} ${args.goal ?? ""} ${args.brief ?? ""}`) ? "app" : "landing");
  const universalRules = "UNIVERSAL HUMAN-CENTERED DESIGN RULES: decide every section, sentence, transition, keyframe, card, button, navigation, header, footer, image, tutorial video, gradient, cursor effect, and 3D moment only when it improves comprehension, trust, retention, or action for this audience. Prefer original composition over template patterns. Avoid AI-looking filler, decorative motion without meaning, excessive gradients, generic bento grids, fake metrics, copycat competitor layouts, and dopamine tricks that harm clarity. Before finalizing, review the page as a first-time human visitor on mobile and desktop.";
  const enrichedArgs = { ...args, brand: inferredBrand, product: inferredProduct, existingHtml: `${args.existingHtml ?? ""}\nTARGET PAGE SNAPSHOT:\n${snapshot?.visibleCopy ?? "No target page supplied."}\nCOMPETITIVE LANDSCAPE:\n${competitorContext || "No competitor pages were reachable; make independent category-aware decisions."}\n${universalRules}` };
  const plan = strategy(enrichedArgs);
  const html = experience === "app" ? generateApp({ brand: inferredBrand, product: inferredProduct, audience: args.audience, goal: args.goal, platform: selectedPlatform, accent: "#c08a4b" }) : generateLanding(plan.landing);
  const htmlPath = `${dir}/landing.html`;
  const tsxPath = `${dir}/landing.tsx`;
  const strategyPath = `${dir}/strategy.json`;
  await writeFile(htmlPath, html);
  await writeFile(tsxPath, `import React from "react";\n\n/** Dazzle-generated ${experience} TSX bridge. */\nexport default function DazzleExperience(): React.ReactElement {\n  return <div data-dazzle-experience=${JSON.stringify(experience)} data-dazzle-platform=${JSON.stringify(selectedPlatform)} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(html)} }} />;\n}\n`);
  await writeFile(strategyPath, `${JSON.stringify(plan, null, 2)}\n`);
  const snapshotPath = snapshot ? `${dir}/target-snapshot.json` : undefined;
  if (snapshotPath && snapshot) await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`);
  const competitorPath = `${dir}/competitor-snapshots.json`;
  await writeFile(competitorPath, `${JSON.stringify(competitorSnapshots, null, 2)}\n`);
  const compositionErrors = experience === "app" ? [] : lintComposition(html);
  const generatedScreenshot = await screenshot(htmlPath, `${dir}/generated.png`, args.width, args.height);
  let targetScreenshot: string | undefined;
  if (args.targetUrl) targetScreenshot = await screenshot(args.targetUrl, `${dir}/target-full.png`, args.width, args.height, true).catch(() => undefined);
  return { mode: args.operation, experience, managedBy: "dazzle-orchestrator", llmRole: "translate the user's natural-language plan into this structured input and judge the returned rendered artifacts", stages: ["brief normalized", `experience selected: ${experience}`, `platform profile selected: ${selectedPlatform}`, `${selectedMagicComponents.length} Magic UI components selected by context`, "mobile flow mapped", ...(snapshot ? ["target HTML fetched and content snapshot created"] : []), ...(competitorSnapshots.length ? [`${competitorSnapshots.length} competitor pages attempted; unavailable pages remain marked`] : []), "conversion audit evidence prepared", "contextual strategy selected", `${experience === "app" ? "product workspace UI" : "landing page"} generated`, "HTML and TSX UI artifacts written", "composition validated", "Chromium screenshot rendered", ...(targetScreenshot ? ["entire target page captured for redesign comparison"] : []), "ready for human-centered visual review"], source: snapshot ? { title: snapshot.title, description: snapshot.description, headings: snapshot.headings, snapshot: snapshotPath } : undefined, competitiveLandscape: { requested: Math.min(args.competitorCount ?? 5, 5), discovered: competitorSnapshots.map((item) => item.url), snapshots: competitorPath, instruction: "Use competitors to identify category conventions and opportunities, never to copy their brand, copy, layout, or distinctive visual identity.", availability: competitorSnapshots.map((item) => ({ url: item.url, pageSnapshot: Boolean(item.snapshot), screenshot: Boolean(item.screenshot), status: item.snapshot && item.screenshot ? "captured" : "unavailable-or-blocked" })) }, conversionAudit: { evidence: [snapshot ? "target URL and rendered content" : "no target URL", "full-page screenshot", "generated page screenshot"], reportShape: ["Verdict", "Fix now (ordered by expected impact)", "Test, don't guess", "Not a problem", "Could not check"], limits: ["cap fixes at seven", "do not promise percentage lift", "label URL-only conclusions as estimates", "separate upstream offer problems from page problems"] }, platform: { plan: selectedPlatformPlan, mobileFlow, magicUiComponents: selectedMagicComponents.map((component) => component.name), desktopApp: selectedPlatform === "macos" || selectedPlatform === "windows" ? { framework: "Tauri 2", nativeShell: selectedPlatform, note: "Use platform-native commands only where the product needs them; keep the shared UI in the generated TSX layer." } : undefined }, strategy: plan, artifacts: { html: htmlPath, tsx: tsxPath, strategy: strategyPath, platformPlan: `${dir}/platform-plan.json`, magicUiPlan: `${dir}/magicui-plan.json`, mobileFlow: `${dir}/mobile-flow.json`, generatedScreenshot, targetScreenshot, targetScreenshots: targetScreenshot ? [targetScreenshot] : [], competitorScreenshots: competitorSnapshots.flatMap((item) => item.screenshot ? [item.screenshot] : []), competitorSnapshots: competitorPath, snapshot: snapshotPath }, validation: { compositionErrors, valid: compositionErrors.length === 0, visualReviewRequired: true, reviewInstruction: `Inspect generated.png, target-full.png, and competitor full-page screenshots. This is an ${experience} experience; reject blank captures, landing-page sections in an app brief, neon/purple defaults, and unavailable competitor evidence presented as fact.` } };
}

export function registerCreativeTools(server: McpServer): void {
  const exposeDiagnostics = process.env.DAZZLE_EXPOSE_DIAGNOSTICS === "true" || process.env.DAZZLE_SHOW_ALL_TOOLS === "true" || (!process.env.RENDER && !process.env.MCP_PUBLIC);
  const buildSchema = { operation: z.enum(["create", "redesign"]).default("create"), brand: z.string().optional().default("Dazzle project"), product: z.string().optional().default("A clearer digital experience"), audience: z.string().optional(), goal: z.string().optional(), tone: z.string().optional(), brief: z.string().optional(), experience: z.enum(["landing", "app"]).optional().describe("Use app for dashboards, editors, agents, workspaces, composers, sidebars, and product UI; use landing only for marketing pages"), targetUrl: z.string().url().optional(), competitorUrls: z.array(z.string().url()).max(5).optional().describe("Optional competitor URLs; Dazzle discovers up to five when omitted"), competitorCount: z.number().int().min(1).max(5).default(5).describe("Number of competitor pages to research and capture"), platform: z.enum(["web", "mobile-web", "android", "macos", "windows"]).default("web").describe("Target UI platform and interaction model"), output: z.enum(["html", "tsx", "tauri"]).optional().describe("Artifact format; Tauri includes a desktop/mobile shell plan"), media: z.enum(["image", "video", "3d", "none"]).default("image").describe("Primary media intent for Magic UI component selection"), outputDir: z.string().default("/tmp/dazzle-build"), width: z.number().int().positive().default(1440), height: z.number().int().positive().default(1000) };
  const buildDescription = "PRIMARY DAZZLE ACTION. Use this whenever the user asks to use Dazzle, create or redesign a landing page, app, dashboard, editor, agent workspace, composer, sidebar UI, or product screen. Set experience=app for product interfaces; never force an app into hero/features/FAQ sections. Dazzle manages competitive research, strategy, generation, Chromium rendering, validation, and returns actual screenshots for visual review. A blank screenshot is a failed build, not an approval. Do not merely explain and do not manually select specialist tools.";
  server.tool("dazzle", buildDescription, buildSchema, async (args) => pipelineOutput(await executeDazzlePipeline(args)));
  server.tool("dazzle_build", buildDescription, buildSchema, async (args) => pipelineOutput(await executeDazzlePipeline(args)));
  server.tool("dazzle_capabilities", "Return the Dazzle-managed pipeline contract and explain what the connected LLM should and should not do.", {}, async () => output({ owner: "Dazzle", llm: "one connected model only", llmDoes: ["understand natural language", "fill the build brief", "inspect returned screenshots/frames", "write final critique"], dazzleDoes: ["strategy normalization", "HTML generation", "design tokens", "composition validation", "Chromium screenshots", "FFmpeg/ffprobe inspection", "frame extraction", "responsive/accessibility/motion audit contracts", "artifact and manifest creation"], primaryTool: "dazzle_build", conversionAuditSkill: { name: "landing-page-conversion-audit", description: "Audit rendered landing and checkout pages for message-match, mobile, offer clarity, trust, friction, post-click, and measurement leaks; return a ranked fix list with evidence limits." }, specialistTools: "available for Dazzle-managed diagnostics; do not ask the user or model to manually chain them unless debugging" }));
  if (exposeDiagnostics) {
  const names: [string, string][] = [
    ["dazzle_analyze_brief", "Analyze the creative brief before any generation."], ["dazzle_profile_audience", "Profile audience intent, awareness, and trust barriers."], ["dazzle_map_visitor_journey", "Map the human visitor journey and friction points."], ["dazzle_conversion_audit", "Audit a rendered landing, sales, product, opt-in, or checkout page for conversion leaks; rank up to seven concrete fixes by expected impact, state evidence limits, and separate page problems from upstream offer problems."], ["dazzle_human_psychology", "Apply ethical human psychology and cognitive principles."], ["dazzle_content_audit", "Audit page content hierarchy and copy risks."], ["dazzle_seo_audit", "Return practical SEO and performance requirements."], ["dazzle_accessibility_audit", "Audit accessibility and reduced-motion requirements."], ["dazzle_responsive_audit", "Plan mobile, tablet, and desktop behavior."], ["dazzle_motion_audit", "Choose motion level and choreography without distraction."],
    ["dazzle_choose_style", "Choose a visual style from context."], ["dazzle_choose_theme", "Choose a color mood from context."], ["dazzle_choose_palette", "Choose a palette and contrast direction."], ["dazzle_choose_typography", "Choose a typography system and hierarchy."], ["dazzle_choose_font", "Choose the actual display/body font pairing and usage."], ["dazzle_choose_icons", "Choose icon geometry and where icons belong."], ["dazzle_choose_layout", "Choose layout, density, radius, and composition."], ["dazzle_choose_sections", "Choose necessary sections and explain why."], ["dazzle_choose_cta", "Choose the primary CTA and treatment."], ["dazzle_choose_cards", "Choose card geometry and behavior."], ["dazzle_choose_hero_media", "Choose CSS art, image, video, or Three.js for the hero."], ["dazzle_choose_image_moments", "Choose where imagery supports comprehension."], ["dazzle_choose_video_moments", "Choose where a video loop earns its weight."], ["dazzle_choose_three_scene", "Plan a performant Three.js moment."], ["dazzle_choose_navigation", "Design navigation and information scent."], ["dazzle_choose_social_proof", "Choose proof signals and their placement."], ["dazzle_choose_pricing", "Decide whether pricing belongs and how to frame it."], ["dazzle_choose_faq", "Design objection-handling FAQ content."], ["dazzle_design_tokens", "Return a coherent design-token contract."], ["dazzle_write_page_copy", "Create a copy direction that is clear and human."], ["dazzle_generate_css_art", "Plan a lightweight CSS-art visual."], ["dazzle_generate_three_scene", "Plan an optional Three.js scene with performance constraints."], ["dazzle_generate_remotion_plan", "Create a Remotion-compatible motion storyboard."], ["dazzle_generate_hyperframes_plan", "Create a HyperFrames-compatible seekable timeline plan."], ["dazzle_redesign_plan", "Compare an existing page brief with a stronger redesign direction."], ["dazzle_human_review_score", "Return a human-review rubric for rendered frames."]
  ];
  if (exposeDiagnostics && process.env.DAZZLE_EXPOSE_SPECIALIST_TOOLS !== "false") for (const [name, description] of names) server.tool(name, description, briefSchema, async (args) => output(specialist(name, args)));

  server.tool("dazzle_render_screenshot", "Render a URL or local HTML file with headless Chromium before submission.", { target: z.string(), output: z.string().default("/tmp/dazzle-preview.png"), width: z.number().int().positive().default(1440), height: z.number().int().positive().default(1000) }, async ({ target, output: outputPath, width, height }) => output({ image: await screenshot(target, outputPath, width, height), instruction: "Inspect this rendered image visually before approving the design." }));
  server.tool("dazzle_ffmpeg_probe", "Inspect a video or image asset with ffprobe.", { input: z.string() }, async ({ input }) => output(await ffprobe(input)));
  server.tool("dazzle_ffmpeg_extract_frames", "Extract representative frames from a video with FFmpeg for visual review.", { input: z.string(), outputDir: z.string().default("/tmp/dazzle-frames"), fps: z.number().positive().default(1) }, async ({ input, outputDir, fps }) => { await mkdir(outputDir, { recursive: true }); await exec("ffmpeg", ["-y", "-i", input, "-vf", `fps=${fps}`, `${outputDir}/frame-%03d.png`], { timeout: 120_000 }); return output({ outputDir, instruction: "Inspect the extracted frames and compare them with the intended brief." }); });
  server.tool("dazzle_ffmpeg_render_preview", "Render a deterministic HTML/video preview through FFmpeg when a source video is supplied.", { input: z.string(), output: z.string().default("/tmp/dazzle-preview.mp4"), fps: z.number().int().positive().default(30), width: z.number().int().positive().default(1280), height: z.number().int().positive().default(720) }, async ({ input, output: outputPath, fps, width, height }) => { await exec("ffmpeg", ["-y", "-i", input, "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`, "-r", String(fps), "-pix_fmt", "yuv420p", outputPath], { timeout: 180_000 }); return output({ output: outputPath, metadata: await ffprobe(outputPath) }); });
  server.tool("dazzle_visual_audit", "Render a target website or generated page, extract media frames when possible, and return a pre-submit audit checklist.", { target: z.string(), outputDir: z.string().default("/tmp/dazzle-audit"), width: z.number().int().positive().default(1440), height: z.number().int().positive().default(1000) }, async ({ target, outputDir, width, height }) => { await mkdir(outputDir, { recursive: true }); const image = await screenshot(target, `${outputDir}/page.png`, width, height); const html = target.startsWith("http") ? "remote" : await readFile(target, "utf8").catch(() => ""); return output({ image, source: html === "remote" ? target : "local html", checks: ["hero promise readable", "CTA visible without hunting", "contrast and focus states", "no layout overflow", "motion supports—not competes with—copy", "mobile version checked separately"], next: "Use the image with a vision-capable model and run dazzle_redesign_plan for any failed checks." }); });
  server.tool("dazzle_validate_composition", "Validate Dazzle composition metadata before export.", { html: z.string() }, async ({ html }) => output({ errors: lintComposition(html), valid: lintComposition(html).length === 0 }));
  server.tool("dazzle_generate_from_strategy", "Generate the standard Dazzle HTML after a strategy has been reviewed.", { brand: z.string(), tagline: z.string(), description: z.string().optional(), style: z.string().optional(), theme: z.string().optional(), audience: z.string().optional(), creativeDirection: z.string().optional() }, async (args) => output({ html: generateLanding(args as Parameters<typeof generateLanding>[0]) }));
  }
}
