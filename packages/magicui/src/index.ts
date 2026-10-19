import { magicComponents, findMagicComponent, type MagicComponent } from "./catalog.js";

export type DazzlePlatform = "web" | "mobile-web" | "android" | "macos" | "windows";
export type DazzleOutput = "html" | "tsx" | "tauri";

export interface PlatformPlan {
  platform: DazzlePlatform;
  output: DazzleOutput;
  shell: string;
  navigation: string;
  interactionModel: string;
  safeAreas: string[];
  nativeGuidance: string[];
  renderViewport: { width: number; height: number; deviceScaleFactor: number };
}

const plans: Record<DazzlePlatform, Omit<PlatformPlan, "platform" | "output">> = {
  web: { shell: "responsive-web", navigation: "desktop navigation with mobile collapse", interactionModel: "pointer, keyboard, touch", safeAreas: ["keyboard focus", "reduced motion", "responsive overflow"], nativeGuidance: ["use semantic HTML", "progressively enhance Motion effects", "keep the primary CTA visible on narrow screens"], renderViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 } },
  "mobile-web": { shell: "mobile-first web", navigation: "bottom action or compact top navigation chosen by task", interactionModel: "touch-first with pointer enhancement", safeAreas: ["safe-area insets", "44px minimum touch targets", "one-handed reach", "reduced motion", "slow network"], nativeGuidance: ["avoid hover-only meaning", "keep the first CTA in the initial viewport", "use full-width cards only when scanning benefits"], renderViewport: { width: 390, height: 844, deviceScaleFactor: 2 } },
  android: { shell: "Tauri Android WebView", navigation: "Android-friendly top app bar or bottom navigation", interactionModel: "touch, back gesture, keyboard", safeAreas: ["Android system bars", "back navigation", "large touch targets", "reduced motion"], nativeGuidance: ["avoid desktop hover assumptions", "use platform-neutral web components with Android spacing", "keep native integration behind Tauri commands"], renderViewport: { width: 412, height: 915, deviceScaleFactor: 2 } },
  macos: { shell: "Tauri macOS window", navigation: "macOS-style titlebar-aware sidebar or toolbar", interactionModel: "pointer, keyboard shortcuts, trackpad", safeAreas: ["window resizing", "keyboard focus", "light/dark system appearance", "reduced motion"], nativeGuidance: ["respect resizable windows", "keep controls calm and information-dense", "use Tauri commands only for native capabilities"], renderViewport: { width: 1440, height: 900, deviceScaleFactor: 1 } },
  windows: { shell: "Tauri Windows window", navigation: "compact command bar or sidebar", interactionModel: "pointer, keyboard, touch where available", safeAreas: ["window resizing", "keyboard focus", "high contrast", "reduced motion"], nativeGuidance: ["preserve visible focus", "support compact window widths", "keep native APIs behind Tauri commands"], renderViewport: { width: 1440, height: 900, deviceScaleFactor: 1 } }
};

export function platformPlan(platform: DazzlePlatform, output: DazzleOutput = platform === "web" || platform === "mobile-web" ? "html" : "tsx"): PlatformPlan { return { platform, output, ...plans[platform] }; }

export function chooseMagicComponents(input: { platform: DazzlePlatform; motion?: "subtle" | "expressive" | "cinematic"; media?: "image" | "video" | "3d" | "none" }): MagicComponent[] {
  const wanted = input.platform === "mobile-web" || input.platform === "android" ? ["iphone", "android", "blur-fade", "scroll-progress", "magic-card", "animated-list"] : input.platform === "macos" || input.platform === "windows" ? ["magic-card", "dock", "command-menu", "blur-fade", "animated-list"] : ["magic-card", "blur-fade", "marquee", "border-beam", "scroll-progress"];
  const media = input.media === "video" ? ["hero-video-dialog"] : input.media === "3d" ? ["floating-3d-particles", "globe"] : [];
  const names = [...wanted, ...media];
  return names.map(findMagicComponent).filter((component): component is MagicComponent => Boolean(component));
}

export function buildMobileFlow(): string[] { return ["launch or first paint", "understand the promise", "scan one primary action", "inspect proof or product moment", "resolve objections", "complete CTA", "confirm next step"]; }
