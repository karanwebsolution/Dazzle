import { z } from "zod";

export const sectionSchema = z.enum(["hero", "logos", "features", "stats", "showcase", "pricing", "process", "testimonials", "faq", "cta", "footer"]);
export const effectSchema = z.enum(["particles", "cube", "wave", "gradient", "none"]);
export const themeSchema = z.enum(["midnight", "aurora", "sunset", "paper", "mono"]);
export const styleSchema = z.enum(["saas", "editorial", "bento", "glass", "brutalist", "luxury"]);
export const layoutSchema = z.enum(["centered", "split", "immersive"]);
export const fontSchema = z.enum(["sora", "manrope", "space-grotesk", "instrument-serif", "fraunces", "dm-sans"]);
export const iconStyleSchema = z.enum(["line", "solid", "geometric", "editorial", "minimal"]);
export const visualVariantSchema = z.enum(["soft-tech", "editorial-grid", "neo-brutal", "quiet-luxury", "organic-flow", "mono-lab"]);
export type Section = z.infer<typeof sectionSchema>;
export type Effect3D = z.infer<typeof effectSchema>;
export type ThemeName = z.infer<typeof themeSchema>;
export type StyleName = z.infer<typeof styleSchema>;
export type LayoutName = z.infer<typeof layoutSchema>;
export type FontPreset = z.infer<typeof fontSchema>;
export type IconStyle = z.infer<typeof iconStyleSchema>;
export type VisualVariant = z.infer<typeof visualVariantSchema>;

export interface Feature { title: string; description: string; icon?: string; }
export interface Stat { value: string; label: string; }
export interface Faq { question: string; answer: string; }
export interface LandingOptions {
  brand: string;
  tagline: string;
  description?: string;
  eyebrow?: string;
  primaryColor?: string;
  backgroundColor?: string;
  theme?: ThemeName;
  style?: StyleName;
  layout?: LayoutName;
  fontPreset?: FontPreset;
  iconStyle?: IconStyle;
  visualVariant?: VisualVariant;
  sections?: Section[];
  effect3d?: Effect3D;
  creativeDirection?: string;
  audience?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  features?: Feature[];
  stats?: Stat[];
  faqs?: Faq[];
  testimonial?: { quote: string; name: string; role: string; };
  width?: number;
  height?: number;
  duration?: number;
  fps?: number;
}
export interface Theme { name: ThemeName; background: string; foreground: string; muted: string; accent: string; surface: string; }
export const themes: Record<ThemeName, Theme> = {
  midnight: { name: "midnight", background: "#08090f", foreground: "#f8fafc", muted: "#a1a1aa", accent: "#8b5cf6", surface: "#151522" },
  aurora: { name: "aurora", background: "#041b1a", foreground: "#ecfeff", muted: "#99f6e4", accent: "#2dd4bf", surface: "#0b2b2a" },
  sunset: { name: "sunset", background: "#1c0b16", foreground: "#fff7ed", muted: "#fdba74", accent: "#fb7185", surface: "#351426" },
  paper: { name: "paper", background: "#f5f2eb", foreground: "#1d1d1b", muted: "#68655f", accent: "#e4572e", surface: "#ffffff" },
  mono: { name: "mono", background: "#f7f7f5", foreground: "#111111", muted: "#666666", accent: "#111111", surface: "#ffffff" }
};

const esc = (s: string): string => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c] ?? c));
const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "landing";
const clip = (content: string, start: number, duration: number, cls = ""): string => `<div class="clip ${cls}" data-start="${start}" data-duration="${duration}">${content}</div>`;
const fontProfiles: Record<FontPreset, { display: string; body: string; url: string }> = {
  sora: { display: "Sora", body: "Sora", url: "Sora:wght@400;500;600;700;800" },
  manrope: { display: "Manrope", body: "Manrope", url: "Manrope:wght@400;500;600;700;800" },
  "space-grotesk": { display: "Space Grotesk", body: "Space Grotesk", url: "Space+Grotesk:wght@400;500;600;700" },
  "instrument-serif": { display: "Instrument Serif", body: "DM Sans", url: "Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700" },
  fraunces: { display: "Fraunces", body: "Manrope", url: "Fraunces:opsz,wght@9..144,400..700&family=Manrope:wght@400;500;600;700" },
  "dm-sans": { display: "DM Sans", body: "DM Sans", url: "DM+Sans:opsz,wght@9..40,400..700" }
};
function iconSvg(name: string | undefined, style: IconStyle): string {
  const paths: Record<string, string> = { spark: "<path d=\"m12 2 1.8 7.2L21 12l-7.2 1.8L12 21l-1.8-7.2L3 12l7.2-2.8L12 2Z\"/>", arrow: "<path d=\"M5 19 19 5M8 5h11v11\"/>", orbit: "<circle cx=\"12\" cy=\"12\" r=\"8\"/><circle cx=\"12\" cy=\"12\" r=\"2\"/><path d=\"M4 12a8 8 0 0 1 14-5\"/>" , shield: "<path d=\"m12 3 7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z\"/>", bolt: "<path d=\"m13 2-9 12h7l-1 8 9-12h-7l1-8Z\"/>" };
  const path = (name ? paths[name] : undefined) ?? paths.spark;
  const fill = style === "solid" ? "currentColor" : "none";
  return `<svg class="icon-svg icon-${style}" viewBox="0 0 24 24" aria-hidden="true" fill="${fill}" stroke="currentColor" stroke-width="${style === "geometric" ? 2.5 : 1.7}" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
}

function defaults(input: LandingOptions) {
  const features = input.features?.length ? input.features : [
    { title: "Clarity over clutter", description: "A focused system that turns your strongest idea into an unmistakable first impression.", icon: "spark" },
    { title: "Made to convert", description: "Every section has a job: build trust, answer objections, and make the next step obvious.", icon: "arrow" },
    { title: "Beautiful by default", description: "Premium typography, intentional spacing, and motion that supports your story instead of distracting from it.", icon: "orbit" }
  ];
  return {
    ...input,
    description: input.description ?? "A considered digital experience for teams who care about the details.",
    eyebrow: input.eyebrow ?? (input.audience ? `Built for ${input.audience}` : "A better way forward"),
    theme: input.theme ?? "midnight", style: input.style ?? "saas", layout: input.layout ?? "split",
    fontPreset: input.fontPreset ?? (input.style === "editorial" || input.style === "luxury" ? "instrument-serif" : input.style === "brutalist" ? "space-grotesk" : "sora"),
    iconStyle: input.iconStyle ?? (input.style === "editorial" || input.style === "luxury" ? "editorial" : input.style === "brutalist" ? "geometric" : "line"),
    visualVariant: input.visualVariant ?? (input.style === "editorial" ? "editorial-grid" : input.style === "luxury" ? "quiet-luxury" : input.style === "brutalist" ? "neo-brutal" : input.style === "glass" ? "organic-flow" : "soft-tech"),
    sections: input.sections ?? ["hero", "features", "showcase", "stats", "testimonials", "faq", "cta", "footer"],
    effect3d: input.effect3d ?? "gradient", ctaLabel: input.ctaLabel ?? "Start a conversation", ctaHref: input.ctaHref ?? "#cta",
    secondaryCtaLabel: input.secondaryCtaLabel ?? "See how it works", secondaryCtaHref: input.secondaryCtaHref ?? "#features",
    features, stats: input.stats ?? [{ value: "4.9/5", label: "customer love" }, { value: "2.4×", label: "faster to launch" }, { value: "24/7", label: "always on" }],
    faqs: input.faqs ?? [{ question: "How does it work?", answer: "Tell Dazzle what you are building, who it is for, and the feeling you want. The generator turns that direction into a complete, responsive page." }, { question: "Can I customize the result?", answer: "Yes. Every meaningful choice is configurable through the CLI or MCP: style, palette, sections, copy, CTAs, effects, and composition settings." }],
    testimonial: input.testimonial ?? { quote: "It feels like having a small design team inside the terminal.", name: "Maya Chen", role: "Founder, Northstar" },
    width: input.width ?? 1920, height: input.height ?? 1080, duration: input.duration ?? 10, fps: input.fps ?? 30
  };
}

function effectScript(effect: Effect3D, accent: string, background: string): string {
  if (effect === "none") return "";
  if (effect === "gradient") return `<script>window.__timelines=window.__timelines||[];window.__timelines.push({seek(t){document.documentElement.style.setProperty('--hue',String(t*3))}});</script>`;
  if (effect === "particles") return `<script>window.__timelines=window.__timelines||[];const dots=Array.from({length:42},(_,i)=>{const d=document.createElement('i');d.className='particle';d.style.setProperty('--i',String(i));d.style.left=((i*37)%100)+'%';d.style.top=((i*61)%100)+'%';document.body.append(d);return d});window.__timelines.push({seek(t){dots.forEach((d,i)=>d.style.transform='translate3d(0,'+Math.sin(t*.5+i)*12+'px,0)')}});</script>`;
  const geometry = effect === "cube" ? "new THREE.BoxGeometry(2.4,2.4,2.4)" : "new THREE.PlaneGeometry(8,5,24,16)";
  const motion = effect === "cube" ? "mesh.rotation.x=t*.25;mesh.rotation.y=t*.5" : "mesh.rotation.z=Math.sin(t)*.04";
  return `<script type="module">import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';const canvas=document.createElement('canvas');canvas.className='orb-canvas';document.body.append(canvas);const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setSize(420,420);const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.z=6;const mesh=new THREE.Mesh(${geometry},new THREE.MeshBasicMaterial({color:${JSON.stringify(accent)},wireframe:true,transparent:true,opacity:.38}));scene.add(mesh);window.__timelines=window.__timelines||[];window.__timelines.push({seek(t){${motion};renderer.render(scene,camera)}});window.__timelines[0]?.seek(0);</script>`;
}

function sectionHtml(section: Section, p: ReturnType<typeof defaults>, accent: string): string {
  const featureCards = p.features.map((f) => `<article class="feature-card"><span class="feature-icon">${iconSvg(f.icon, p.iconStyle)}</span><h3>${esc(f.title)}</h3><p>${esc(f.description)}</p></article>`).join("");
  const statCards = p.stats.map((s) => `<div class="stat"><strong>${esc(s.value)}</strong><span>${esc(s.label)}</span></div>`).join("");
  const faqCards = p.faqs.map((f) => `<details><summary>${esc(f.question)}<span>＋</span></summary><p>${esc(f.answer)}</p></details>`).join("");
  const map: Record<Section, string> = {
    hero: `<section class="hero ${p.layout}"><div class="hero-copy"><p class="eyebrow">${esc(p.eyebrow)}</p><h1>${esc(p.brand)} <em>${esc(p.tagline)}</em></h1><p class="lede">${esc(p.description)}</p><div class="actions"><a class="button" href="${esc(p.ctaHref)}">${esc(p.ctaLabel)} <span>↗</span></a><a class="text-link" href="${esc(p.secondaryCtaHref)}">${esc(p.secondaryCtaLabel)} <span>↓</span></a></div><p class="microcopy">No hard sell · Just a good first step</p></div><div class="hero-art"><div class="halo"></div><div class="art-card"><span class="art-kicker">THE NEXT MOVE</span><strong>${esc(p.brand)}</strong><span class="art-line"></span><span class="art-small">${esc(p.audience ?? "For ambitious teams")}</span></div></div></section>`,
    logos: `<section class="logo-strip"><span>TRUSTED BY PEOPLE BUILDING</span><div><b>northstar</b><b>orbit</b><b>morrow</b><b>plainform</b><b>kinetic</b></div></section>`,
    features: `<section id="features" class="section"><div class="section-heading"><p class="eyebrow">A sharper standard</p><h2>Good design gets<br><em>out of the way.</em></h2><p>Everything your audience needs to believe, understand, and act — arranged with intention.</p></div><div class="feature-grid">${featureCards}</div></section>`,
    stats: `<section class="stats">${statCards}</section>`,
    showcase: `<section class="showcase"><div class="showcase-window"><div class="window-bar"><i></i><i></i><i></i><span>${esc(p.brand.toLowerCase())}.world</span></div><div class="showcase-content"><p class="eyebrow">${esc(p.eyebrow)}</p><h3>${esc(p.tagline)}</h3><div class="showcase-pill">Made for momentum <span>→</span></div></div></div><div class="showcase-caption"><span>01 / THE EXPERIENCE</span><p>${esc(p.creativeDirection ?? "A visual language with enough calm to build trust and enough energy to be remembered.")}</p></div></section>`,
    pricing: `<section class="section pricing"><div class="section-heading"><p class="eyebrow">Simple, not simplistic</p><h2>Choose your<br><em>next chapter.</em></h2></div><div class="price-card"><span class="art-kicker">THE ESSENTIAL START</span><h3>Build with clarity.</h3><p>Everything you need to make a confident first move, without the unnecessary noise.</p><a class="button" href="${esc(p.ctaHref)}">${esc(p.ctaLabel)} <span>↗</span></a></div></section>`,
    process: `<section class="section process"><div class="section-heading"><p class="eyebrow">A simple process</p><h2>From thought<br>to <em>traction.</em></h2></div><div class="process-list"><div><strong>01</strong><h3>Bring the spark</h3><p>Start with a direction, not a blank canvas.</p></div><div><strong>02</strong><h3>Shape the story</h3><p>Turn your value into a narrative people can feel.</p></div><div><strong>03</strong><h3>Make the move</h3><p>Give your audience a next step they want to take.</p></div></div></section>`,
    testimonials: `<section class="quote-section"><p class="quote-mark">“</p><blockquote>${esc(p.testimonial.quote)}</blockquote><div class="person"><span class="avatar">${esc(p.testimonial.name.slice(0, 1))}</span><span><strong>${esc(p.testimonial.name)}</strong><small>${esc(p.testimonial.role)}</small></span></div></section>`,
    faq: `<section class="section faq"><div class="section-heading"><p class="eyebrow">The fine print</p><h2>Questions,<br><em>answered.</em></h2></div><div class="faq-list">${faqCards}</div></section>`,
    cta: `<section id="cta" class="final-cta"><p class="eyebrow">Your move</p><h2>Make something<br><em>worth remembering.</em></h2><p>${esc(p.description)}</p><a class="button" href="${esc(p.ctaHref)}">${esc(p.ctaLabel)} <span>↗</span></a></section>`,
    footer: `<footer><strong>${esc(p.brand)}</strong><span>${esc(p.tagline)}</span><span>Built with Dazzle</span></footer>`
  };
  return map[section];
}

export interface DesignStrategy {
  summary: string;
  audience: { primary: string; intent: string; awareness: "low" | "medium" | "high"; trustBarriers: string[] };
  design: { style: StyleName; theme: ThemeName; layout: LayoutName; typography: string; fontPreset: FontPreset; iconStyle: IconStyle; visualVariant: VisualVariant; palette: string[]; radius: string; density: "airy" | "balanced" | "dense" };
  iconography: { style: IconStyle; placements: string[]; rule: string };
  conversion: { primaryGoal: string; cta: string; ctaTreatment: string; trustSignals: string[]; frictionReducers: string[] };
  motion: { level: "subtle" | "expressive" | "cinematic"; effect: Effect3D; choreography: string[]; reduceMotionFallback: string };
  media: { heroVisual: "css-art" | "image" | "video" | "three-js"; imageMoments: string[]; videoMoments: string[]; avoid: string[] };
  sections: { name: Section; reason: string; priority: "must" | "should" | "optional" }[];
  psychology: { principle: string; application: string }[];
  landing: LandingOptions;
}

function chooseStrategy(input: { brand: string; product: string; audience?: string; goal?: string; tone?: string; existingHtml?: string }): DesignStrategy {
  const text = `${input.product} ${input.audience ?? ""} ${input.goal ?? ""} ${input.tone ?? ""}`.toLowerCase();
  const isTechnical = /ai|saas|developer|api|software|tool|tech|data/.test(text);
  const isPremium = /luxury|premium|fashion|jewel|architect|hotel|beauty|coffee/.test(text);
  const isCreative = /agency|studio|portfolio|artist|creative|brand/.test(text);
  const isTrustHeavy = /health|finance|legal|security|enterprise|education/.test(text);
  const style: StyleName = isPremium ? "luxury" : isCreative ? "editorial" : isTechnical ? "saas" : "bento";
  const theme: ThemeName = isPremium ? "paper" : isCreative ? "midnight" : /green|wellness|nature/.test(text) ? "aurora" : "midnight";
  const layout: LayoutName = isCreative || isPremium ? "immersive" : "split";
  const effect: Effect3D = isPremium || isCreative ? "gradient" : isTechnical ? "cube" : "particles";
  const fontPreset: FontPreset = isPremium || isCreative ? "instrument-serif" : isTechnical ? "space-grotesk" : "sora";
  const iconStyle: IconStyle = isPremium || isCreative ? "editorial" : isTechnical ? "geometric" : "line";
  const visualVariant: VisualVariant = isPremium ? "quiet-luxury" : isCreative ? "editorial-grid" : isTechnical ? "soft-tech" : "organic-flow";
  const primary = input.audience ?? (isTechnical ? "product teams and technical decision makers" : "people actively looking for a better way");
  const sections: { name: Section; reason: string; priority: "must" | "should" | "optional" }[] = [
    { name: "hero", reason: "State the promise and make the next action obvious in the first screen.", priority: "must" },
    { name: "features", reason: "Translate the promise into three memorable benefits.", priority: "must" },
    { name: "showcase", reason: "Let visitors see the experience instead of only reading claims.", priority: isCreative || isTechnical ? "must" : "should" },
    { name: "stats", reason: "Give the scanning visitor proof points they can process quickly.", priority: isTrustHeavy ? "must" : "should" },
    { name: "testimonials", reason: "Borrow trust from a believable peer voice.", priority: isTrustHeavy ? "must" : "should" },
    { name: "faq", reason: "Resolve objections close to the decision point.", priority: "should" },
    { name: "cta", reason: "Repeat one focused conversion action after the argument is complete.", priority: "must" },
    { name: "footer", reason: "Provide orientation and a calm exit path.", priority: "should" }
  ];
  const cta = input.goal?.toLowerCase().includes("demo") ? "Book a demo" : input.goal?.toLowerCase().includes("sale") ? "Shop now" : input.goal?.toLowerCase().includes("signup") ? "Start free" : "See what is possible";
  const landing: LandingOptions = { brand: input.brand, tagline: input.product, description: `A clearer, more compelling way for ${primary}.`, audience: primary, creativeDirection: input.tone ?? "confident, human, premium, and focused", style, theme, layout, fontPreset, iconStyle, visualVariant, effect3d: effect, sections: sections.filter((x) => x.priority !== "optional").map((x) => x.name), ctaLabel: cta };
  return { summary: `A ${style} ${layout} experience for ${primary}, designed to ${input.goal ?? "make the value immediately clear"}.`, audience: { primary, intent: input.goal ?? "understand the value and take the next step", awareness: isTrustHeavy ? "medium" : "low", trustBarriers: isTrustHeavy ? ["credibility", "risk", "proof of outcome"] : ["attention", "clarity", "choice overload"] }, design: { style, theme, layout, typography: isPremium ? "high-contrast editorial serif with restrained sans utility text" : isCreative ? "expressive display type paired with quiet body copy" : "confident geometric sans with generous hierarchy", fontPreset, iconStyle, visualVariant, palette: [themes[theme].background, themes[theme].foreground, themes[theme].accent, themes[theme].muted], radius: style === "luxury" ? "soft-square" : "friendly-pill", density: isPremium || isCreative ? "airy" : "balanced" }, iconography: { style: iconStyle, placements: ["benefit cards only", "process steps when they improve scanning", "primary CTA only when the icon clarifies the action"], rule: "Use one consistent icon geometry; icons clarify categories or actions and never replace the copy." }, conversion: { primaryGoal: input.goal ?? "earn a qualified next step", cta, ctaTreatment: "one high-contrast primary button, one low-pressure text link, repeat only after proof", trustSignals: isTrustHeavy ? ["specific outcomes", "customer proof", "clear process", "transparent FAQ"] : ["social proof", "specific benefits", "visible product moment"], frictionReducers: ["plain-language promise", "short sections", "one primary CTA", "answer objections before asking"] }, motion: { level: isCreative || isPremium ? "cinematic" : "subtle", effect, choreography: ["hero enters with staggered copy", "benefit cards reveal on scroll", "CTA receives a restrained hover lift", "motion never competes with the reading order"], reduceMotionFallback: "show all content at rest with no opacity-dependent information" }, media: { heroVisual: isCreative || isPremium ? "three-js" : isTechnical ? "image" : "css-art", imageMoments: ["product or outcome proof near the first benefit section"], videoMoments: isCreative ? ["short silent loop in the showcase section"] : [], avoid: ["generic stock people", "autoplay audio", "decorative media that delays the promise"] }, sections, psychology: [{ principle: "cognitive fluency", application: "Use one promise, one dominant CTA, and short scannable blocks." }, { principle: "progressive disclosure", application: "Lead with outcome, then benefits, proof, objections, and action." }, { principle: "social proof", application: "Place specific evidence near the moment of doubt, not only in the footer." }, { principle: "choice architecture", application: "Make the primary path obvious without hiding a respectful secondary path." }], landing };
}

/** Produce a reasoned design strategy before generating or redesigning a landing page. */
export function designDirector(input: { brand: string; product: string; audience?: string; goal?: string; tone?: string; existingHtml?: string }): DesignStrategy { return chooseStrategy(input); }
/** Redesign an existing page brief while preserving its brand and improving hierarchy, conversion, and visual direction. */
export function redesignLanding(input: { brand: string; product: string; audience?: string; goal?: string; tone?: string; existingHtml?: string }): { strategy: DesignStrategy; html: string } { const strategy = designDirector(input); return { strategy, html: generateLanding(strategy.landing) }; }

function styleOverrides(style: StyleName): string {
  const overrides: Record<StyleName, string> = {
    saas: "body{letter-spacing:-.01em}.feature-card,.showcase-window,.price-card{border-radius:1rem}",
    editorial: "body{font-family:Georgia,'Times New Roman',serif}.eyebrow,.art-kicker,.logo-strip>span,.stat span,.showcase-caption span{font-family:ui-sans-serif,system-ui}.hero h1,h2,.final-cta h2{font-weight:500}.feature-card{background:transparent;border-width:0;border-top:1px solid var(--accent);border-radius:0}.button{border-radius:.25rem}",
    bento: ".feature-grid{grid-template-columns:repeat(6,1fr)}.feature-card{grid-column:span 2;border-radius:1.7rem;box-shadow:0 18px 50px #0002}.feature-card:nth-child(2){transform:translateY(2rem)}.showcase-window{border-radius:1.7rem}",
    glass: "body:before{opacity:.75}.feature-card,.showcase-window,.price-card,.art-card{backdrop-filter:blur(22px);background:color-mix(in srgb,var(--surface) 45%,transparent);border-color:color-mix(in srgb,var(--fg) 25%,transparent);box-shadow:inset 0 1px #fff3,0 24px 70px #0003}",
    brutalist: "body{font-family:Arial,Helvetica,sans-serif}.hero h1,h2,.final-cta h2{font-weight:950;letter-spacing:-.1em}.feature-card,.showcase-window,.price-card,.art-card{border:3px solid var(--fg);border-radius:0;box-shadow:8px 8px 0 var(--accent)}.button{border-radius:0;border:2px solid var(--fg);box-shadow:5px 5px 0 var(--fg)}",
    luxury: "body{font-family:Georgia,'Times New Roman',serif}.hero h1,h2,.final-cta h2{font-weight:400}.eyebrow,.art-kicker{letter-spacing:.3em}.feature-card,.showcase-window,.price-card{border-color:color-mix(in srgb,var(--accent) 35%,transparent);border-radius:.35rem}.button{border-radius:.3rem}"
  };
  return overrides[style];
}

function variantOverrides(variant: VisualVariant): string {
  const variants: Record<VisualVariant, string> = {
    "soft-tech": ".hero-art{transform:rotate(-3deg)}.art-card{border-radius:2.4rem}.feature-card{border-radius:1.4rem}.showcase-content{background:radial-gradient(circle at 78% 18%,color-mix(in srgb,var(--accent) 34%,transparent),transparent 30%),linear-gradient(135deg,var(--surface),transparent)}",
    "editorial-grid": ".hero{grid-template-columns:1.35fr .65fr}.hero-copy{max-width:780px}.hero-art{align-self:stretch;border-left:1px solid color-mix(in srgb,var(--fg) 20%,transparent)}.feature-grid{grid-template-columns:repeat(12,1fr);gap:0}.feature-card{grid-column:span 4;border-width:1px 0 0;border-radius:0;background:transparent;min-height:280px}.feature-card:nth-child(2){transform:translateY(3rem)}.feature-card:nth-child(3){transform:translateY(6rem)}",
    "neo-brutal": ".hero h1{font-weight:800}.hero-art{transform:rotate(2deg)}.art-card,.feature-card,.showcase-window{box-shadow:12px 12px 0 var(--accent)}.feature-card{border-radius:0}.button{box-shadow:6px 6px 0 var(--fg)}",
    "quiet-luxury": ".hero{min-height:88vh}.hero-art{filter:grayscale(.15)}.hero-art:after{content:'';position:absolute;inset:12% 4%;border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);border-radius:50%;transform:rotate(-18deg)}.feature-card{background:transparent;border-width:0 0 1px;border-radius:0;padding-left:0}.button{letter-spacing:.04em;text-transform:uppercase;font-size:.7rem}",
    "organic-flow": ".hero-art{transform:rotate(4deg)}.halo{border-radius:42% 58% 63% 37%}.art-card{border-radius:42% 58% 38% 62%}.feature-card{border-radius:2rem 1rem 2rem 1rem}",
    "mono-lab": ":root{--accent:#111827}.hero-art{filter:grayscale(1)}.feature-card,.showcase-window,.price-card{border-radius:.25rem}.button{border-radius:.35rem;text-transform:uppercase;letter-spacing:.08em;font-size:.72rem}"
  };
  return variants[variant];
}

/** Generate a complete, deterministic and highly configurable landing page. */
export function generateLanding(input: LandingOptions): string {
  const p = defaults(input); const theme = themes[p.theme]; const accent = p.primaryColor ?? theme.accent; const background = p.backgroundColor ?? theme.background;
  const sections = p.sections.map((s, i) => clip(sectionHtml(s, p, accent), i * 1.4, 1.4, `section-wrap section-${s}`)).join("\n");
  const effect = effectScript(p.effect3d, accent, background);
  const font = fontProfiles[p.fontPreset]; const variantCss = variantOverrides(p.visualVariant);
  const compositionId = `dazzle-${slug(`${p.brand}-${p.tagline}`)}`;
  const style = `<style>:root{--accent:${accent};--bg:${background};--fg:${theme.foreground};--muted:${theme.muted};--surface:${theme.surface};--font-display:${font.display},Georgia,serif;--font-body:${font.body},ui-sans-serif,system-ui,sans-serif;--hue:0deg}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font-body);overflow-x:hidden;filter:hue-rotate(var(--hue));transition:filter .3s}body:before{content:"";position:fixed;inset:0;background:radial-gradient(circle at 8% 0%,color-mix(in srgb,var(--accent) 20%,transparent),transparent 32%),radial-gradient(circle at 92% 46%,color-mix(in srgb,var(--accent) 12%,transparent),transparent 28%);pointer-events:none;z-index:-1}main{max-width:1180px;margin:auto;padding:0 5vw}.clip{will-change:transform,opacity}.section-wrap{padding:9rem 0}.hero{min-height:92vh;display:grid;grid-template-columns:1.1fr .9fr;gap:5vw;align-items:center;padding:7rem 0 5rem}.hero.centered{display:block;text-align:center}.hero.centered .hero-copy{max-width:900px;margin:auto}.hero.centered .actions{justify-content:center}.hero h1{font-family:var(--font-display);font-size:clamp(3.4rem,8.5vw,8.2rem);line-height:.91;letter-spacing:-.085em;margin:1rem 0 1.7rem;max-width:850px}.hero h1 em,h2 em,.final-cta em{color:var(--accent);font-style:normal}.eyebrow,.art-kicker{color:var(--accent);text-transform:uppercase;letter-spacing:.2em;font-size:.68rem;font-weight:800}.lede{font-size:clamp(1.1rem,2vw,1.35rem);line-height:1.55;color:var(--muted);max-width:540px}.actions{display:flex;flex-wrap:wrap;align-items:center;gap:1.5rem;margin-top:2.2rem}.button{display:inline-flex;gap:1.4rem;align-items:center;background:var(--accent);color:${theme.name === "paper" || theme.name === "mono" ? "#fff" : "#09090b"};text-decoration:none;font-weight:800;padding:1rem 1.25rem;border-radius:999px;transition:transform .2s,box-shadow .2s}.button:hover{transform:translateY(-3px);box-shadow:0 14px 35px color-mix(in srgb,var(--accent) 35%,transparent)}.text-link{color:var(--fg);text-decoration:none;font-weight:700}.text-link span{color:var(--accent);margin-left:.4rem}.microcopy{color:var(--muted);font-size:.72rem;margin-top:1.2rem}.hero-art{min-height:480px;display:grid;place-items:center;position:relative}.halo{position:absolute;width:330px;height:330px;border-radius:50%;background:var(--accent);opacity:.16;filter:blur(65px)}.art-card{width:min(80%,330px);aspect-ratio:.78;background:linear-gradient(145deg,color-mix(in srgb,var(--surface) 88%,transparent),color-mix(in srgb,var(--accent) 14%,transparent));border:1px solid color-mix(in srgb,var(--fg) 18%,transparent);border-radius:1.5rem;padding:2rem;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:0 30px 100px #0005;transform:rotate(5deg)}.art-card strong{font-size:3rem;line-height:.9;letter-spacing:-.08em;margin:.6rem 0}.art-line{width:65%;height:1px;background:var(--accent);margin:1rem 0}.art-small{color:var(--muted);font-size:.75rem}.logo-strip{padding:3rem 0;border-top:1px solid color-mix(in srgb,var(--fg) 15%,transparent);border-bottom:1px solid color-mix(in srgb,var(--fg) 15%,transparent);color:var(--muted)}.logo-strip>span{font-size:.65rem;letter-spacing:.16em}.logo-strip div{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;margin-top:1.4rem}.logo-strip b{font-size:1.2rem;color:var(--fg);opacity:.65}.section-heading{max-width:650px;margin-bottom:3.5rem}.section-heading h2,.final-cta h2{font-family:var(--font-display);font-size:clamp(2.8rem,6vw,5.8rem);line-height:.94;letter-spacing:-.075em;margin:.8rem 0 1.3rem}.section-heading>p:last-child{color:var(--muted);max-width:460px}.feature-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.feature-card{background:color-mix(in srgb,var(--surface) 76%,transparent);border:1px solid color-mix(in srgb,var(--fg) 12%,transparent);border-radius:1.1rem;padding:1.6rem;min-height:250px;display:flex;flex-direction:column;justify-content:space-between}.feature-card:hover{border-color:var(--accent)}.feature-icon{font-size:1.4rem;color:var(--accent)}.feature-card h3{font-size:1.3rem;margin:2rem 0 .5rem}.feature-card p{color:var(--muted);margin:0}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:color-mix(in srgb,var(--fg) 15%,transparent);border:1px solid color-mix(in srgb,var(--fg) 15%,transparent)}.stat{background:var(--bg);padding:2rem}.stat strong{display:block;font-size:clamp(2.5rem,5vw,4.5rem);letter-spacing:-.08em;color:var(--accent)}.stat span{color:var(--muted);font-size:.8rem;text-transform:uppercase;letter-spacing:.12em}.showcase-window{border:1px solid color-mix(in srgb,var(--fg) 16%,transparent);border-radius:1rem;overflow:hidden;background:var(--surface);min-height:470px;box-shadow:0 35px 80px #0003}.window-bar{height:42px;padding:0 1rem;display:flex;align-items:center;gap:.4rem;border-bottom:1px solid color-mix(in srgb,var(--fg) 10%,transparent);color:var(--muted);font-size:.7rem}.window-bar i{width:7px;height:7px;border-radius:50%;background:var(--accent);opacity:.7}.window-bar span{margin:auto}.showcase-content{padding:10% 8%;background:radial-gradient(circle at 80% 20%,color-mix(in srgb,var(--accent) 26%,transparent),transparent 35%);min-height:428px}.showcase-content h3{font-size:clamp(2.8rem,7vw,7rem);max-width:760px;line-height:.9;letter-spacing:-.08em;margin:1rem 0}.showcase-pill{display:inline-flex;gap:1rem;border:1px solid color-mix(in srgb,var(--accent) 50%,transparent);border-radius:99px;padding:.7rem 1rem;color:var(--muted)}.showcase-pill span{color:var(--accent)}.showcase-caption{display:flex;justify-content:space-between;gap:2rem;margin-top:1.5rem;color:var(--muted)}.showcase-caption span{font-size:.68rem;letter-spacing:.16em}.showcase-caption p{max-width:420px;margin:0}.price-card{max-width:520px;background:var(--accent);color:#09090b;border-radius:1.3rem;padding:2.5rem}.price-card .art-kicker{color:#09090b}.price-card h3{font-size:2.5rem;letter-spacing:-.06em;margin:3rem 0 .5rem}.price-card p{max-width:340px}.price-card .button{background:#09090b;color:var(--accent)}.process-list{display:grid;grid-template-columns:repeat(3,1fr);gap:2rem}.process-list>div{border-top:1px solid color-mix(in srgb,var(--fg) 20%,transparent);padding-top:1.2rem}.process-list strong{color:var(--accent)}.process-list h3{font-size:1.4rem}.process-list p{color:var(--muted)}.quote-section{max-width:900px;padding:7rem 0}.quote-mark{font-size:6rem;line-height:.5;color:var(--accent);margin:0}.quote-section blockquote{font-size:clamp(2rem,5vw,4.5rem);line-height:1;letter-spacing:-.07em;margin:1rem 0 2rem}.person{display:flex;align-items:center;gap:.8rem}.avatar{display:grid;place-items:center;width:40px;height:40px;border-radius:50%;background:var(--accent);color:#09090b;font-weight:800}.person strong,.person small{display:block}.person small{color:var(--muted);margin-top:.2rem}.faq{display:grid;grid-template-columns:.75fr 1.25fr;gap:8vw}.faq-list details{border-top:1px solid color-mix(in srgb,var(--fg) 18%,transparent);padding:1.3rem 0}.faq-list details:last-child{border-bottom:1px solid color-mix(in srgb,var(--fg) 18%,transparent)}summary{display:flex;justify-content:space-between;cursor:pointer;font-weight:700;list-style:none}summary::-webkit-details-marker{display:none}summary span{color:var(--accent)}details p{color:var(--muted);max-width:600px}.final-cta{padding:10rem 0;text-align:center;border-top:1px solid color-mix(in srgb,var(--fg) 15%,transparent)}.final-cta h2{max-width:900px;margin:1rem auto 1.5rem}.final-cta p:not(.eyebrow){color:var(--muted);max-width:460px;margin:0 auto}.final-cta .button{margin-top:2rem}footer{max-width:1180px;margin:auto;padding:2rem 5vw 3rem;display:flex;gap:1.5rem;justify-content:space-between;flex-wrap:wrap;color:var(--muted);font-size:.8rem}footer strong{color:var(--fg)}.orb-canvas{position:fixed;right:5vw;top:15vh;opacity:.5;pointer-events:none;z-index:-1}.particle{position:fixed;width:3px;height:3px;border-radius:50%;background:var(--accent);opacity:.35;pointer-events:none;z-index:-1}@media(max-width:760px){main{padding:0 1.2rem}.hero{grid-template-columns:1fr;min-height:auto;padding:7rem 0 4rem}.hero-art{min-height:300px}.hero h1{font-family:var(--font-display);font-size:clamp(3rem,15vw,5rem)}.section-wrap{padding:6rem 0}.feature-grid,.process-list,.stats,.faq{grid-template-columns:1fr}.stats{background:transparent;border:0;gap:.7rem}.stat{border:1px solid color-mix(in srgb,var(--fg) 15%,transparent);border-radius:.8rem}.showcase-caption{display:block}.showcase-caption p{margin-top:1rem}.logo-strip div{justify-content:flex-start;gap:1.5rem}.faq{gap:2rem}.orb-canvas{width:260px;right:-80px;top:8vh}}${styleOverrides(p.style)}${variantCss}</style>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="${esc(p.description)}"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=${font.url}&display=swap" rel="stylesheet"><title>${esc(p.brand)} — ${esc(p.tagline)}</title><script src="https://cdn.tailwindcss.com"></script>${style}</head><body data-style="${p.style}" data-layout="${p.layout}" data-variant="${p.visualVariant}" data-font="${p.fontPreset}" data-icon-style="${p.iconStyle}"><div id="root" data-composition-id="${compositionId}" data-width="${p.width}" data-height="${p.height}" data-duration="${p.duration}" data-fps="${p.fps}"><main>${sections}</main></div>${effect}<script>window.__timelines=window.__timelines||[];window.__seek=function(t){window.__timelines.forEach(x=>x.seek(t))};document.querySelectorAll('.clip').forEach(el=>{const start=Number(el.dataset.start),duration=Number(el.dataset.duration);window.__timelines.push({seek(t){const p=Math.max(0,Math.min(1,(t-start)/duration));el.style.opacity=p;el.style.transform='translateY('+(1-p)*18+'px)'}})});window.__seek(999);</script></body></html>`;
}

/** Validate composition metadata, clip markers, and seekable motion constraints. */
export function lintComposition(html: string): string[] {
  const errors: string[] = [];
  if (!html.includes("data-composition-id")) errors.push("Missing data-composition-id");
  if (!html.includes("data-width") || !html.includes("data-height")) errors.push("Missing composition dimensions");
  if (!html.includes("data-duration") || !html.includes("data-fps")) errors.push("Missing composition timing metadata");
  const clips = [...html.matchAll(/class="[^"]*\bclip\b[^"]*"[^>]*>/g)];
  clips.forEach((match) => { if (!match[0].includes("data-start") || !match[0].includes("data-duration")) errors.push("Every clip requires data-start and data-duration"); });
  if (!html.includes("window.__timelines")) errors.push("Missing seekable timeline registry");
  if (html.includes("setInterval(") || html.includes("Date.now()")) errors.push("Wall-clock motion is not allowed");
  return [...new Set(errors)];
}

/** Return all built-in theme presets. */
export function listThemes(): Theme[] { return Object.values(themes); }
/** Return all built-in visual style presets. */
export function listStyles(): StyleName[] { return styleSchema.options; }
/** Return all supported page sections. */
export function listSections(): Section[] { return sectionSchema.options; }
