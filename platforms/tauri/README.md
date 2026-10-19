# Tauri 2 platform shell

Dazzle generates the portable UI layer and a platform plan; Tauri owns the native shell. This keeps the visual system shared while allowing native capabilities only when the product actually needs them.

## Bootstrap

```bash
pnpm create tauri-app
# Choose React + TypeScript, then copy the generated landing.tsx into src/
```

For an existing Dazzle build, use the generated `landing.tsx`, `platform-plan.json`, and `magicui-plan.json` from the output directory. Install the Magic UI runtime dependencies selected in `magicui-plan.json` only when you replace the TSX bridge with native React components.

## Targets

```bash
pnpm tauri android init
pnpm tauri android build
pnpm tauri build --target aarch64-apple-darwin
pnpm tauri build --target x86_64-pc-windows-msvc
```

The Android profile is touch-first and accounts for system bars, back navigation, safe areas, and reduced motion. macOS uses a resizable window and keyboard/trackpad interaction. Windows keeps visible focus, compact widths, and high-contrast behavior. Do not add platform-specific APIs to the shared visual component unless the product requirement needs them; put those behind a small Tauri command layer.

## Render and audit

Before shipping, serve the Tauri frontend through the same web build and run Dazzle's Chromium full-page capture at the profile viewport. Then run the FFmpeg/visual audit pipeline against the screenshot or exported screen recording. The audit should check the first-paint promise, CTA visibility, touch target size, safe-area spacing, keyboard focus, reduced-motion fallback, and the platform's expected navigation model.
