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

## MCP setup

Build the server and point Claude Code, Cursor, or another MCP client at `packages/mcp/dist/server.js`:

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

The MCP server also exposes `dazzle_list_styles`, `dazzle_list_themes`, `dazzle_list_sections`, `dazzle_preview_url`, and `dazzle_render_video`.

## AI Design Director and redesign mode

Dazzle can now think through a page before generating it. The `dazzle_design_director` tool turns a product brief into a structured design strategy covering:

- audience intent, awareness, trust barriers, and visitor psychology
- visual style, theme, layout, typography, palette, radius, and density
- primary conversion goal, CTA treatment, friction reducers, and proof placement
- motion level, choreography, reduced-motion fallback, and 3D effect choice
- where an image, video, CSS art, or Three.js moment is useful—and where it would be noise
- must-have, should-have, and optional sections with a reason for each

The `dazzle_redesign_landing` tool performs the next step: it makes those decisions and returns a complete redesigned HTML page plus the strategy that explains it. Use it for an existing HTML page, a rough description, or a page that needs a more conversational, animated, professional, and conversion-aware direction.

### Claude prompt for contextual redesign

```text
Use Dazzle's design director to redesign this landing page from scratch. First analyze the audience, intent, trust barriers, cognitive load, CTA psychology, typography, palette, cards, motion, graphics, image/video/Three.js opportunities, and the sections that should be removed or added. Then generate the final responsive HTML. Product: an AI research workspace called Atlas. Audience: busy product leaders. Goal: start a free trial. Tone: calm, premium, intelligent, human, and memorable. Make it conversational and animated without harming accessibility or readability.
```

The assistant should call `dazzle_design_director` first when you want to inspect the reasoning, or `dazzle_redesign_landing` when you want strategy and generated HTML in one workflow.

## Deploy a public MCP on Render

This repository includes [`render.yaml`](render.yaml), so you can deploy the MCP server directly from the Dazzle repo:

For a phone-only walkthrough with every Render and Claude mobile screen step, see [`MOBILE-RENDER-SETUP.md`](MOBILE-RENDER-SETUP.md).

1. Open **Render → New → Blueprint**.
2. Select `karanwebsolution/Dazzle` and the `main` branch.
3. Render will read `render.yaml`, install dependencies, build the monorepo, and start the HTTP MCP server.
4. Set a strong value for the `MCP_API_KEY` secret when Render asks for it.

After deployment, your public endpoints are:

```text
Health: https://YOUR-SERVICE.onrender.com/health
MCP:    https://YOUR-SERVICE.onrender.com/mcp
```

The public server uses Streamable HTTP and supports OAuth 2.1 with PKCE. It publishes protected-resource metadata, authorization-server metadata, dynamic client registration, a mobile-friendly sign-in page, and token exchange endpoints. The Render service automatically listens on Render's `PORT`; local stdio behavior remains unchanged for Claude Code and Cursor command-based configs.

For Claude web on a phone, open **Settings → Connectors → Add custom connector**, use `https://YOUR-SERVICE.onrender.com/mcp`, continue with the detected OAuth option, and sign in on the Dazzle page using the `MCP_API_KEY` value from Render. Claude then returns to the connector and stores the access token. If Claude shows an old failed sign-in, remove the connector and add it again after the latest Render deploy finishes.

OAuth endpoints are available at `/.well-known/oauth-protected-resource`, `/.well-known/oauth-authorization-server`, `/oauth/register`, `/oauth/authorize`, and `/oauth/token`. The legacy API-key header (`Authorization: Bearer ...` or `x-api-key`) also remains supported for clients that do not implement OAuth.

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
