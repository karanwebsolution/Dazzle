# Dazzle

> Landing pages. 3D. Video. One clear creative brief.

Dazzle creates **specific, polished, responsive landing pages** from the terminal or an MCP-connected assistant. It is not a random template picker: you control the story, style, layout, palette, sections, copy, CTA, audience, and motion.

## Quick start

```bash
pnpm install
pnpm --filter dazzle-cli build
node packages/cli/dist/index.js create
```

The interactive wizard asks for the brand, headline, value proposition, visual language, color mood, motion, sections, layout, accent color, and CTA. Preview the result with:

```bash
node packages/cli/dist/index.js preview landing.html
```

### Fully scripted generation

```bash
node packages/cli/dist/index.js create \
  --brand "Northstar" \
  --tagline "A clearer way forward" \
  --description "Strategy for ambitious teams that want to move with confidence." \
  --style editorial \
  --theme paper \
  --layout split \
  --effect gradient \
  --sections hero,logos,features,showcase,stats,testimonials,faq,cta,footer \
  --color '#e4572e' \
  --audience "founders and product teams" \
  --creative-direction "quiet luxury, warm editorial typography, confident and human" \
  --cta "Book a conversation" \
  --cta-href "https://example.com/contact" \
  --output northstar.html
```

Available styles: `saas`, `editorial`, `bento`, `glass`, `brutalist`, `luxury`.
Available themes: `midnight`, `aurora`, `sunset`, `paper`, `mono`.
Available motion: `particles`, `cube`, `wave`, `gradient`, `none`.

## Model providers in the CLI

The CLI includes a provider registry with OpenAI-compatible support for the major hosted model APIs. API keys are read from the provider's environment variable or can be stored in `~/.dazzle/config.json` with restrictive `0600` permissions. The key is never committed to the repository.

Supported presets and default base URLs:

| Provider | ID | Base URL | Environment variable |
|---|---|---|---|
| OpenAI | `openai` | `https://api.openai.com/v1` | `OPENAI_API_KEY` |
| Anthropic Claude | `anthropic` | `https://api.anthropic.com/v1` | `ANTHROPIC_API_KEY` |
| Google Gemini | `google` | `https://generativelanguage.googleapis.com/v1beta/openai` | `GEMINI_API_KEY` |
| OpenRouter | `openrouter` | `https://openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| Groq | `groq` | `https://api.groq.com/openai/v1` | `GROQ_API_KEY` |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | `MISTRAL_API_KEY` |
| DeepSeek | `deepseek` | `https://api.deepseek.com/v1` | `DEEPSEEK_API_KEY` |
| xAI Grok | `xai` | `https://api.x.ai/v1` | `XAI_API_KEY` |
| Together AI | `together` | `https://api.together.xyz/v1` | `TOGETHER_API_KEY` |
| Fireworks AI | `fireworks` | `https://api.fireworks.ai/inference/v1` | `FIREWORKS_API_KEY` |
| Cerebras | `cerebras` | `https://api.cerebras.ai/v1` | `CEREBRAS_API_KEY` |
| Perplexity | `perplexity` | `https://api.perplexity.ai` | `PERPLEXITY_API_KEY` |
| Cohere | `cohere` | `https://api.cohere.ai/compatibility/v1` | `COHERE_API_KEY` |
| Deep Infra | `deepinfra` | `https://api.deepinfra.com/v1/openai` | `DEEPINFRA_API_KEY` |
| SambaNova | `sambanova` | `https://api.sambanova.ai/v1` | `SAMBANOVA_API_KEY` |
| Moonshot Kimi | `moonshot` | `https://api.moonshot.ai/v1` | `MOONSHOT_API_KEY` |
| Qwen / Alibaba | `qwen` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `DASHSCOPE_API_KEY` |
| NVIDIA NIM | `nvidia` | `https://integrate.api.nvidia.com/v1` | `NVIDIA_API_KEY` |

List providers and their default models:

```bash
node packages/cli/dist/index.js providers list
```

Configure a provider interactively. The key is hidden while typing:

```bash
node packages/cli/dist/index.js providers add openrouter
```

Or use an environment variable, which is preferred for CI and shared machines:

```bash
export OPENAI_API_KEY="your-key"
node packages/cli/dist/index.js providers add openai --model gpt-4o-mini
```

You can override a provider's model and base URL for a self-hosted or compatible gateway:

```bash
node packages/cli/dist/index.js providers add my-provider \
  --api-key "$MY_PROVIDER_KEY" \
  --model "my-model" \
  --base-url "https://llm.example.com/v1"
```

For a custom provider ID, first add it to `packages/cli/src/providers.ts`; the built-in command intentionally rejects unknown presets so a typo cannot silently send a key to the wrong endpoint.

Send a prompt through the active provider:

```bash
node packages/cli/dist/index.js ai \
  --provider openrouter \
  --model anthropic/claude-3.5-sonnet \
  --prompt "Act as Dazzle's senior design director. Explain the best landing-page direction for an AI research product aimed at product leaders."
```

Provider management commands:

```bash
dazzle providers list
dazzle providers add <provider>
dazzle providers use <provider>
dazzle providers remove <provider>
dazzle ai --prompt "Write a premium hero section for a coffee brand."
```

Anthropic uses its native Messages API; the other presets use the common OpenAI-compatible `/chat/completions` contract. The provider layer is separate from the deterministic Dazzle renderer, so model output can help with strategy and copy while generated HTML remains validated by Dazzle's composition contract.

## MCP setup — local desktop first

Dazzle's primary workflow is local on a desktop with Claude Code, Cursor, or another stdio-capable MCP client. Local mode does **not** use OAuth, does not need Render, and exposes the complete **54-tool catalog**: the primary orchestrator, design specialists, typography/icon decisions, media planning, Chromium/FFmpeg diagnostics, validation, and compatibility tools.

In local stdio mode, only the MCP client configured on that computer can use Dazzle. If you run local HTTP for testing, Dazzle binds to `127.0.0.1` and remains local to that computer; it is not exposed to the LAN.

Build once:

```bash
pnpm install
pnpm build
```

Point Claude Code, Cursor, or another local MCP client at `packages/mcp/dist/server.js`:

```json
{
  "mcpServers": {
    "dazzle": {
      "command": "node",
      "args": ["/absolute/path/to/dazzle/packages/mcp/dist/server.js"]
    }
  }
}
```

The `dazzle_generate_landing` tool accepts a complete brief: brand, tagline, description, audience, creative direction, style, layout, theme, custom colors, effect, ordered sections, custom features/stats/FAQs/testimonial, CTA labels/links, and composition settings.

Local stdio mode exposes the complete 54-tool catalog so desktop users can inspect and use every capability. Render and Railway are configured to expose the same 54-tool catalog, protected by `MCP_API_KEY`; OAuth is disabled by default.

See the complete operating playbook in [`SKILLS.md`](SKILLS.md). It defines 46 reusable creative skills and the mandatory render → inspect → revise workflow.

## AI Design Director and redesign mode

Dazzle can now think through a page before generating it. Its internal design director turns a product brief into a structured design strategy covering:

- audience intent, awareness, trust barriers, and visitor psychology
- visual style, theme, layout, typography, palette, radius, and density
- primary conversion goal, CTA treatment, friction reducers, and proof placement
- motion level, choreography, reduced-motion fallback, and 3D effect choice
- where an image, video, CSS art, or Three.js moment is useful—and where it would be noise
- must-have, should-have, and optional sections with a reason for each

The production `dazzle` tool performs the next step: it makes those decisions, renders the page, attaches screenshots, and returns the complete managed build manifest. The old `dazzle_redesign_landing` route is hidden in production; if explicitly enabled for debugging, it delegates to the same orchestrator instead of using a legacy one-shot HTML path.

### Claude prompt for contextual redesign

```text
Use Dazzle's design director to redesign this landing page from scratch. First analyze the audience, intent, trust barriers, cognitive load, CTA psychology, typography, palette, cards, motion, graphics, image/video/Three.js opportunities, and the sections that should be removed or added. Then generate the final responsive HTML. Product: an AI research workspace called Atlas. Audience: busy product leaders. Goal: start a free trial. Tone: calm, premium, intelligent, human, and memorable. Make it conversational and animated without harming accessibility or readability.
```

For production, call `dazzle`. Use the legacy names only in diagnostics mode.

### Dazzle Orchestrator: one LLM boundary

The recommended production entrypoint is now `dazzle_build`. The connected LLM has one job: understand the user's natural-language plan, fill the structured brief, inspect returned screenshots/frames, and write the final critique. Dazzle owns the rest:

```text
user plan → one LLM brief translation → dazzle_build
          → strategy normalization
          → HTML generation
          → composition validation
          → Chromium render
          → target capture (redesign mode)
          → FFmpeg/ffprobe and frame artifacts
          → audit manifest
          → LLM visual review
```

Call `dazzle` or `dazzle_build` instead of manually asking the model to select specialist tools. The specialist tools remain available for diagnostics and debugging, but they are internal capabilities of the Dazzle engine—not separate agents or a requirement for the user to orchestrate.

The `dazzle_capabilities` tool exposes this ownership contract to any connected client.

### Automatic routing for normal messages

You do **not** need to send a long system instruction. The MCP server now publishes initialization instructions and a clearly named primary tool, `dazzle`. Its description matches ordinary requests such as:

- “Use Dazzle to make a landing page for my startup.”
- “Redesign this website and make it more premium.”
- “Make this page beautiful, animated, and conversion-focused.”
- “Turn this idea into a real responsive website.”

Claude should call `dazzle` automatically, map the request into the brief, receive the rendered screenshots, and critique or revise them. Local desktop, Render, and Railway modes expose the full catalog. Keep the primary `dazzle` tool as the normal entrypoint:

```bash
DAZZLE_SHOW_ALL_TOOLS=true DAZZLE_EXPOSE_LEGACY_TOOLS=true MCP_PUBLIC=true MCP_ENABLE_OAUTH=true node packages/mcp/dist/server.js
```

This keeps the production connector simple while preserving the full internal capability set.

### Visual verification before submission

Dazzle's server, not the connected chat model, owns the expensive local tooling:

1. `dazzle_render_screenshot` captures the actual URL or HTML with headless Chromium.
2. `dazzle_ffmpeg_probe` inspects media metadata.
3. `dazzle_ffmpeg_extract_frames` extracts representative video frames.
4. `dazzle_visual_audit` creates a pre-submit page audit and points the model to the rendered asset.
5. `dazzle_validate_composition` checks the deterministic timeline contract.

Claude/Gemini then use their vision and design judgment to inspect the screenshot or extracted frames. FFmpeg itself does not understand whether a page is beautiful; it supplies real rendered frames so the model can critique what was actually built instead of trusting source HTML. Remotion and HyperFrames are supported as frame-accurate planning/export targets, not as substitutes for visual inspection.

For an existing website, pass its HTTPS URL as `targetUrl` to the primary `dazzle` tool. Dazzle fetches the target HTML, extracts the title, meta description, H1/H2/H3 headings, and visible copy into `target-snapshot.json`, captures the target screenshot, then generates and attaches the redesign screenshot at the same viewport. This prevents a redesign from losing the original page's real product details while still forcing a visual quality review.

## Optional public MCP deployment: Railway

Railway is a secondary HTTP hosting option. The repository includes [`railway.json`](railway.json), which uses the same Dockerfile as Render so Chromium and FFmpeg are installed consistently.

1. Create a Railway project from `karanwebsolution/Dazzle`.
2. Railway detects `railway.json` and builds `Dockerfile`.
3. Add these variables:

```text
MCP_TRANSPORT=http
MCP_PUBLIC=true
MCP_ENABLE_OAUTH=true
DAZZLE_SHOW_ALL_TOOLS=true
DAZZLE_EXPOSE_LEGACY_TOOLS=true
CHROMIUM_PATH=/usr/bin/chromium
MCP_API_KEY=<strong-secret>
```

4. Generate a public domain and verify `/health`.
5. Connect Claude to `https://YOUR-RAILWAY-DOMAIN/mcp`.

Railway and Render are deployment alternatives, not requirements for local Claude Code or CLI use. Test Railway in this order:

```bash
curl -fsS https://YOUR-RAILWAY-DOMAIN/health
curl -fsS -H "x-api-key: YOUR_MCP_API_KEY" https://YOUR-RAILWAY-DOMAIN/mcp
```

The health response must show `authentication: "api-key"`, `oauth: false`, `runtime.chromium: "/usr/bin/chromium"`, and `runtime.ffmpeg: true`. A tools-list request made through an MCP client with the same `x-api-key` should return 54 tools.

## Optional public MCP deployment: Render

Render is a secondary option for mobile or remote Claude users. It is not required for the main desktop workflow. The Render Free plan can sleep after inactivity and may cause a cold-start timeout; use a paid always-on plan for reliable long-running MCP sessions. Public HTTPS connectors use OAuth, and the Dazzle sign-in page still requires the private `MCP_API_KEY` before issuing a token.

This repository includes [`render.yaml`](render.yaml), so you can deploy the MCP server directly from the Dazzle repo:

For a phone-only walkthrough with every Render and Claude mobile screen step, see [`MOBILE-RENDER-SETUP.md`](MOBILE-RENDER-SETUP.md).

1. Open **Render → New → Blueprint**.
2. Select `karanwebsolution/Dazzle` and the `main` branch.
3. Render will read `render.yaml` and build [`Dockerfile`](Dockerfile). The image explicitly installs FFmpeg, ffprobe, and headless Chromium before starting the HTTP MCP server, so visual audits do not depend on whatever happens to be installed in a generic Node runtime.
4. Set a strong value for the `MCP_API_KEY` secret when Render asks for it.

After deployment, verify the runtime before reconnecting Claude:

```text
https://YOUR-SERVICE.onrender.com/health
```

The response must contain a non-null `runtime.chromium` (normally `/usr/bin/chromium`) and `runtime.ffmpeg: true`. If Chromium is `null`, the existing Render service is still the old native Node service; create/redeploy from the Docker Blueprint rather than only restarting the old service.

Render's free web service can sleep after inactivity. The first request after sleep may take long enough for a mobile Claude connector to show a timeout; retry once after the service wakes. OAuth access is still gated by `MCP_API_KEY`; the key is not shared with anonymous users.

After deployment, your public endpoints are:

```text
Health: https://YOUR-SERVICE.onrender.com/health
MCP:    https://YOUR-SERVICE.onrender.com/mcp
```

The public server uses Streamable HTTP with OAuth 2.1 + PKCE for HTTPS connectors. The OAuth sign-in page requires `MCP_API_KEY`. Local stdio and local HTTP mode do not require or use OAuth because OAuth is enabled only when `RENDER=true` or `MCP_PUBLIC=true`. The Render service automatically listens on Render's `PORT`.

For Claude web/mobile, open **Settings → Connectors → Add custom connector**, use the public `/mcp` URL, complete the Dazzle OAuth sign-in page, and enter the private `MCP_API_KEY`. Local Claude Code/Cursor uses stdio and will not show this sign-in flow.

OAuth endpoints are enabled only on public deployments when `MCP_ENABLE_OAUTH=true`. Local stdio/local HTTP mode does not expose them. The API-key header remains supported for clients that do not implement OAuth.

### Finding `MCP_API_KEY` in Render

Open **Render Dashboard → dazzle-mcp service → Environment**. Under **Environment Variables**, find `MCP_API_KEY` and use the eye/reveal control if Render offers it. If the value is not revealable, create a new strong value, save it, and choose **Save, rebuild, and deploy**. Never commit this secret to GitHub or paste it into public messages.

### Dazzle icon

The server advertises the branded icon during MCP initialization and serves it at `/icon.svg` (also `/favicon.svg`):

```text
https://YOUR-SERVICE.onrender.com/icon.svg
```

After redeploying, remove and re-add the custom connector in Claude so Claude refreshes the connector metadata and displays the Dazzle icon. The source artwork is [`packages/mcp/src/dazzle.svg`](packages/mcp/src/dazzle.svg).

To run the public mode locally:

```bash
MCP_TRANSPORT=http MCP_API_KEY=dev-secret pnpm --filter dazzle-mcp start
curl http://localhost:3000/health
```

## Composition contract

Every generated page includes composition metadata on `#root`: `data-composition-id`, dimensions, duration, and FPS. Animated elements are `.clip` nodes with `data-start` and `data-duration`. Timelines are seekable through `window.__timelines` and `window.__seek(seconds)`; no wall-clock animation is used.

## Packages

- **dazzle-core** — configurable design system, HTML generator, themes, sections, and validator.
- **dazzle-cli** — interactive wizard plus scripted generation and preview commands.
- **dazzle-mcp** — rich MCP schema for assistants and creative workflows.

## Development

```bash
pnpm lint
pnpm test
pnpm build
```

Video rendering remains an optional integration: install a compatible HyperFrames engine and FFmpeg, then connect them to the `render` command for your environment.

## License

MIT
