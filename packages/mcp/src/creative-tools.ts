import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { designDirector, generateLanding, lintComposition, type DesignStrategy } from "dazzle-core";

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

type Brief = { brand: string; product: string; audience?: string; goal?: string; tone?: string; existingHtml?: string; brief?: string };
const output = (value: unknown) => ({ content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] });
async function pipelineOutput(result: any): Promise<{ content: ({ type: "text"; text: string } | { type: "image"; data: string; mimeType: string })[] }> {
  const content: ({ type: "text"; text: string } | { type: "image"; data: string; mimeType: string })[] = [{ type: "text", text: JSON.stringify(result, null, 2) }];
  for (const [label, path] of [["generated", result.artifacts.generatedScreenshot], ["target", result.artifacts.targetScreenshot]] as const) {
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
    dazzle_conversion_audit: s.conversion,
    dazzle_human_psychology: s.psychology,
    dazzle_content_audit: { hierarchy: ["one promise", "three benefits", "specific proof", "objection handling", "single next action"], avoid: ["generic claims", "feature dumping", "multiple competing CTAs", "unearned superlatives"] },
    dazzle_seo_audit: { titleRule: "one clear promise under 60 characters", descriptionRule: "benefit plus audience plus action under 160 characters", headings: "one H1, logical H2 sections", performance: ["lazy-load below-fold media", "reserve media dimensions", "avoid blocking third-party scripts"] },
    dazzle_accessibility_audit: { requirements: ["visible focus states", "keyboard navigation", "semantic headings", "alt text for informative imagery", "contrast-safe accent colors", "prefers-reduced-motion fallback", "no information conveyed by color alone"] },
    dazzle_responsive_audit: { breakpoints: ["mobile: single-column reading flow", "tablet: preserve hierarchy and reduce art scale", "desktop: use intentional whitespace and composition"], checks: ["CTA remains visible", "headline does not orphan", "cards do not become tiny", "3D never blocks copy"] },
    dazzle_motion_audit: s.motion,
    dazzle_choose_style: s.design.style,
    dazzle_choose_theme: s.design.theme,
    dazzle_choose_palette: s.design.palette,
    dazzle_choose_typography: s.design.typography,
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
    dazzle_design_tokens: { colors: s.design.palette, typography: s.design.typography, radius: s.design.radius, motion: s.motion.level, spacing: s.design.density },
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

async function screenshot(target: string, outputPath: string, width: number, height: number): Promise<string> {
  await mkdir(outputPath.substring(0, outputPath.lastIndexOf("/")), { recursive: true });
  const url = /^https?:\/\//.test(target) ? target : `file://${target}`;
  await exec("chromium", ["--headless", "--no-sandbox", "--disable-gpu", `--window-size=${width},${height}`, `--screenshot=${outputPath}`, url], { timeout: 120_000 });
  return outputPath;
}
async function ffprobe(input: string): Promise<unknown> { const result = await exec("ffprobe", ["-v", "error", "-show_format", "-show_streams", "-of", "json", input], { timeout: 60_000 }); return JSON.parse(result.stdout); }

async function executeDazzlePipeline(args: Brief & { operation: "create" | "redesign"; targetUrl?: string; outputDir: string; width: number; height: number }): Promise<unknown> {
  const dir = args.outputDir;
  await mkdir(dir, { recursive: true });
  const plan = strategy(args);
  const html = generateLanding(plan.landing);
  const htmlPath = `${dir}/landing.html`;
  const strategyPath = `${dir}/strategy.json`;
  await writeFile(htmlPath, html);
  await writeFile(strategyPath, `${JSON.stringify(plan, null, 2)}\n`);
  const compositionErrors = lintComposition(html);
  const generatedScreenshot = await screenshot(htmlPath, `${dir}/generated.png`, args.width, args.height);
  let targetScreenshot: string | undefined;
  if (args.targetUrl) targetScreenshot = await screenshot(args.targetUrl, `${dir}/target.png`, args.width, args.height);
  return { mode: args.operation, managedBy: "dazzle-orchestrator", llmRole: "translate the user's natural-language plan into this structured input and judge the returned rendered artifacts", stages: ["brief normalized", "contextual strategy selected", "deterministic HTML generated", "composition validated", "Chromium screenshot rendered", ...(targetScreenshot ? ["target screenshot captured for redesign comparison"] : []), "ready for visual review"], strategy: plan, artifacts: { html: htmlPath, strategy: strategyPath, generatedScreenshot, targetScreenshot }, validation: { compositionErrors, valid: compositionErrors.length === 0, visualReviewRequired: true, reviewInstruction: "Inspect generated.png (and target.png for redesign) with the connected vision model. Do not approve from source HTML alone." } };
}

export function registerCreativeTools(server: McpServer): void {
  server.tool("dazzle_build", "The primary Dazzle entrypoint. The connected LLM translates the user's natural-language plan into structured fields; Dazzle then manages strategy, page generation, rendering, comparison capture, composition validation, and audit artifacts. It attaches the actual rendered PNGs so the model can inspect them. Use this instead of manually orchestrating specialist tools.", { operation: z.enum(["create", "redesign"]).default("create"), brand: z.string().min(1), product: z.string().min(1), audience: z.string().optional(), goal: z.string().optional(), tone: z.string().optional(), brief: z.string().optional(), targetUrl: z.string().url().optional(), outputDir: z.string().default("/tmp/dazzle-build"), width: z.number().int().positive().default(1440), height: z.number().int().positive().default(1000) }, async (args) => pipelineOutput(await executeDazzlePipeline(args)));
  server.tool("dazzle_capabilities", "Return the Dazzle-managed pipeline contract and explain what the connected LLM should and should not do.", {}, async () => output({ owner: "Dazzle", llm: "one connected model only", llmDoes: ["understand natural language", "fill the build brief", "inspect returned screenshots/frames", "write final critique"], dazzleDoes: ["strategy normalization", "HTML generation", "design tokens", "composition validation", "Chromium screenshots", "FFmpeg/ffprobe inspection", "frame extraction", "responsive/accessibility/motion audit contracts", "artifact and manifest creation"], primaryTool: "dazzle_build", specialistTools: "available for Dazzle-managed diagnostics; do not ask the user or model to manually chain them unless debugging" }));
  const names: [string, string][] = [
    ["dazzle_analyze_brief", "Analyze the creative brief before any generation."], ["dazzle_profile_audience", "Profile audience intent, awareness, and trust barriers."], ["dazzle_map_visitor_journey", "Map the human visitor journey and friction points."], ["dazzle_conversion_audit", "Design the CTA, proof, and friction-reduction system."], ["dazzle_human_psychology", "Apply ethical human psychology and cognitive principles."], ["dazzle_content_audit", "Audit page content hierarchy and copy risks."], ["dazzle_seo_audit", "Return practical SEO and performance requirements."], ["dazzle_accessibility_audit", "Audit accessibility and reduced-motion requirements."], ["dazzle_responsive_audit", "Plan mobile, tablet, and desktop behavior."], ["dazzle_motion_audit", "Choose motion level and choreography without distraction."],
    ["dazzle_choose_style", "Choose a visual style from context."], ["dazzle_choose_theme", "Choose a color mood from context."], ["dazzle_choose_palette", "Choose a palette and contrast direction."], ["dazzle_choose_typography", "Choose a typography system and hierarchy."], ["dazzle_choose_layout", "Choose layout, density, radius, and composition."], ["dazzle_choose_sections", "Choose necessary sections and explain why."], ["dazzle_choose_cta", "Choose the primary CTA and treatment."], ["dazzle_choose_cards", "Choose card geometry and behavior."], ["dazzle_choose_hero_media", "Choose CSS art, image, video, or Three.js for the hero."], ["dazzle_choose_image_moments", "Choose where imagery supports comprehension."], ["dazzle_choose_video_moments", "Choose where a video loop earns its weight."], ["dazzle_choose_three_scene", "Plan a performant Three.js moment."], ["dazzle_choose_navigation", "Design navigation and information scent."], ["dazzle_choose_social_proof", "Choose proof signals and their placement."], ["dazzle_choose_pricing", "Decide whether pricing belongs and how to frame it."], ["dazzle_choose_faq", "Design objection-handling FAQ content."], ["dazzle_design_tokens", "Return a coherent design-token contract."], ["dazzle_write_page_copy", "Create a copy direction that is clear and human."], ["dazzle_generate_css_art", "Plan a lightweight CSS-art visual."], ["dazzle_generate_three_scene", "Plan an optional Three.js scene with performance constraints."], ["dazzle_generate_remotion_plan", "Create a Remotion-compatible motion storyboard."], ["dazzle_generate_hyperframes_plan", "Create a HyperFrames-compatible seekable timeline plan."], ["dazzle_redesign_plan", "Compare an existing page brief with a stronger redesign direction."], ["dazzle_human_review_score", "Return a human-review rubric for rendered frames."]
  ];
  for (const [name, description] of names) server.tool(name, description, briefSchema, async (args) => output(specialist(name, args)));

  server.tool("dazzle_render_screenshot", "Render a URL or local HTML file with headless Chromium before submission.", { target: z.string(), output: z.string().default("/tmp/dazzle-preview.png"), width: z.number().int().positive().default(1440), height: z.number().int().positive().default(1000) }, async ({ target, output: outputPath, width, height }) => output({ image: await screenshot(target, outputPath, width, height), instruction: "Inspect this rendered image visually before approving the design." }));
  server.tool("dazzle_ffmpeg_probe", "Inspect a video or image asset with ffprobe.", { input: z.string() }, async ({ input }) => output(await ffprobe(input)));
  server.tool("dazzle_ffmpeg_extract_frames", "Extract representative frames from a video with FFmpeg for visual review.", { input: z.string(), outputDir: z.string().default("/tmp/dazzle-frames"), fps: z.number().positive().default(1) }, async ({ input, outputDir, fps }) => { await mkdir(outputDir, { recursive: true }); await exec("ffmpeg", ["-y", "-i", input, "-vf", `fps=${fps}`, `${outputDir}/frame-%03d.png`], { timeout: 120_000 }); return output({ outputDir, instruction: "Inspect the extracted frames and compare them with the intended brief." }); });
  server.tool("dazzle_ffmpeg_render_preview", "Render a deterministic HTML/video preview through FFmpeg when a source video is supplied.", { input: z.string(), output: z.string().default("/tmp/dazzle-preview.mp4"), fps: z.number().int().positive().default(30), width: z.number().int().positive().default(1280), height: z.number().int().positive().default(720) }, async ({ input, output: outputPath, fps, width, height }) => { await exec("ffmpeg", ["-y", "-i", input, "-vf", `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`, "-r", String(fps), "-pix_fmt", "yuv420p", outputPath], { timeout: 180_000 }); return output({ output: outputPath, metadata: await ffprobe(outputPath) }); });
  server.tool("dazzle_visual_audit", "Render a target website or generated page, extract media frames when possible, and return a pre-submit audit checklist.", { target: z.string(), outputDir: z.string().default("/tmp/dazzle-audit"), width: z.number().int().positive().default(1440), height: z.number().int().positive().default(1000) }, async ({ target, outputDir, width, height }) => { await mkdir(outputDir, { recursive: true }); const image = await screenshot(target, `${outputDir}/page.png`, width, height); const html = target.startsWith("http") ? "remote" : await readFile(target, "utf8").catch(() => ""); return output({ image, source: html === "remote" ? target : "local html", checks: ["hero promise readable", "CTA visible without hunting", "contrast and focus states", "no layout overflow", "motion supports—not competes with—copy", "mobile version checked separately"], next: "Use the image with a vision-capable model and run dazzle_redesign_plan for any failed checks." }); });
  server.tool("dazzle_validate_composition", "Validate Dazzle composition metadata before export.", { html: z.string() }, async ({ html }) => output({ errors: lintComposition(html), valid: lintComposition(html).length === 0 }));
  server.tool("dazzle_generate_from_strategy", "Generate the standard Dazzle HTML after a strategy has been reviewed.", { brand: z.string(), tagline: z.string(), description: z.string().optional(), style: z.string().optional(), theme: z.string().optional(), audience: z.string().optional(), creativeDirection: z.string().optional() }, async (args) => output({ html: generateLanding(args as Parameters<typeof generateLanding>[0]) }));
}
