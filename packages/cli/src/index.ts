#!/usr/bin/env node
import { Command } from "commander";
import { confirm, isCancel, multiselect, outro, select, text } from "@clack/prompts";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { effectSchema, generateLanding, layoutSchema, lintComposition, listSections, listStyles, listThemes, sectionSchema, styleSchema, themeSchema, type Effect3D, type LandingOptions, type LayoutName, type Section, type StyleName, type ThemeName } from "dazzle-core";

const program = new Command();
program.name("dazzle").description("Build any beautiful landing page from a clear creative brief.").version("0.2.0");

function asSections(value: string | undefined): Section[] | undefined { return value ? value.split(",").map((x) => sectionSchema.parse(x.trim())) : undefined; }
function asOption<T extends string>(value: string | undefined, parser: { parse: (v: string) => T }): T | undefined { return value ? parser.parse(value) : undefined; }

async function interactiveBrief(): Promise<LandingOptions> {
  const brand = await text({ message: "What is the brand or product name?", placeholder: "Northstar", validate: (v) => v.length < 2 ? "Please enter a brand name" : undefined });
  if (isCancel(brand)) process.exit(0);
  const tagline = await text({ message: "What should the hero say?", placeholder: "A clearer way forward" });
  if (isCancel(tagline)) process.exit(0);
  const description = await text({ message: "Describe the offer in one sentence", placeholder: "A considered digital experience for ambitious teams" });
  if (isCancel(description)) process.exit(0);
  const style = await select({ message: "Choose a visual language", options: listStyles().map((value) => ({ value, label: value })) });
  if (isCancel(style)) process.exit(0);
  const theme = await select({ message: "Choose a color mood", options: listThemes().map((value) => ({ value: value.name, label: value.name })) });
  if (isCancel(theme)) process.exit(0);
  const effect = await select({ message: "Choose motion", options: effectSchema.options.map((value) => ({ value, label: value })) });
  if (isCancel(effect)) process.exit(0);
  const sections = await multiselect({ message: "Which sections should the page include?", options: listSections().filter((x) => x !== "footer").map((value) => ({ value, label: value })), initialValues: ["hero", "features", "showcase", "testimonials", "faq", "cta"] });
  if (isCancel(sections)) process.exit(0);
  const layout = await select({ message: "Choose the hero layout", options: layoutSchema.options.map((value) => ({ value, label: value })) });
  if (isCancel(layout)) process.exit(0);
  const customColor = await text({ message: "Accent color (optional hex)", placeholder: "Press Enter to use the theme color" });
  if (isCancel(customColor)) process.exit(0);
  const ctaLabel = await text({ message: "Primary CTA label", initialValue: "Start a conversation" });
  if (isCancel(ctaLabel)) process.exit(0);
  outro("Your brief is ready. Creating something beautiful...");
  return { brand, tagline, description, style: style as StyleName, theme: theme as ThemeName, effect3d: effect as Effect3D, sections: [...(sections as Section[]), "footer"], layout: layout as LayoutName, primaryColor: customColor || undefined, ctaLabel };
}

program.command("init").argument("[name]", "directory", ".").description("scaffold a beautiful starter page").action(async (name: string) => { const dir = resolve(name); await mkdir(dir, { recursive: true }); const file = resolve(dir, "landing.html"); await writeFile(file, generateLanding({ brand: name || "Dazzle", tagline: "Make something worth remembering.", style: "editorial", theme: "midnight", effect3d: "gradient" })); console.log(`Created ${file}`); });

program.command("create").description("create a tailored landing page from an interactive brief or flags")
  .option("-b, --brand <name>", "brand or product name")
  .option("-t, --tagline <text>", "hero headline")
  .option("-d, --description <text>", "one-sentence offer description")
  .option("-s, --style <style>", `visual style: ${listStyles().join(", ")}`)
  .option("--theme <theme>", `color mood: ${listThemes().map((x) => x.name).join(", ")}`)
  .option("--layout <layout>", "hero layout: centered, split, immersive")
  .option("-e, --effect <effect>", "motion effect")
  .option("--sections <list>", "comma-separated sections")
  .option("--color <hex>", "custom accent color")
  .option("--audience <text>", "who the page is for")
  .option("--creative-direction <text>", "visual/story direction")
  .option("--cta <label>", "primary CTA label")
  .option("--cta-href <url>", "primary CTA URL")
  .option("-o, --output <file>", "output file", "landing.html")
  .action(async (opts: Record<string, string | undefined>) => {
    const options = opts.brand && opts.tagline ? { brand: opts.brand, tagline: opts.tagline, description: opts.description, style: asOption(opts.style, styleSchema), theme: asOption(opts.theme, themeSchema), layout: asOption(opts.layout, layoutSchema), effect3d: asOption(opts.effect, effectSchema), sections: asSections(opts.sections), primaryColor: opts.color, audience: opts.audience, creativeDirection: opts.creativeDirection, ctaLabel: opts.cta, ctaHref: opts.ctaHref } satisfies LandingOptions : await interactiveBrief();
    const output = opts.output ?? "landing.html"; const file = resolve(output); await writeFile(file, generateLanding(options)); console.log(`Generated ${file}`);
  });

program.command("lint").argument("<file>").description("validate composition metadata and seekable motion").action(async (file: string) => { const errors = lintComposition(await readFile(resolve(file), "utf8")); if (errors.length) { console.error(errors.map((x) => `✗ ${x}`).join("\n")); process.exitCode = 1; } else console.log("✓ Composition is valid"); });
program.command("themes").action(() => listThemes().forEach((t) => console.log(`${t.name.padEnd(10)} ${t.accent}  ${t.background}`)));
program.command("styles").action(() => listStyles().forEach((s) => console.log(s)));
program.command("preview").argument("[file]", "HTML file", "landing.html").option("-p, --port <number>", "port", "3000").action(async (file: string, opts: { port: string }) => { const html = await readFile(resolve(file), "utf8"); const server = createServer((_, res) => { res.writeHead(200, { "content-type": "text/html" }); res.end(html); }); server.listen(Number(opts.port), () => console.log(`Preview: http://localhost:${opts.port}`)); });
program.command("render").argument("<file>").option("-o, --output <file>", "output", "out.mp4").description("render with HyperFrames when the optional engine is installed").action(() => { console.error("Rendering requires the optional @hyperframes/engine and ffmpeg integrations. See the README for setup."); process.exitCode = 1; });
await program.parseAsync();
