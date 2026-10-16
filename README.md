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

## Deploy a public MCP on Render

This repository includes [`render.yaml`](render.yaml), so you can deploy the MCP server directly from the Dazzle repo:

1. Open **Render → New → Blueprint**.
2. Select `karanwebsolution/Dazzle` and the `main` branch.
3. Render will read `render.yaml`, install dependencies, build the monorepo, and start the HTTP MCP server.
4. Set a strong value for the `MCP_API_KEY` secret when Render asks for it.

After deployment, your public endpoints are:

```text
Health: https://YOUR-SERVICE.onrender.com/health
MCP:    https://YOUR-SERVICE.onrender.com/mcp
```

The public server uses Streamable HTTP and accepts either `Authorization: Bearer YOUR_MCP_API_KEY` or `x-api-key: YOUR_MCP_API_KEY`. Configure your MCP client with the MCP URL and bearer token. The Render service automatically listens on Render's `PORT`; local stdio behavior remains unchanged for Claude Code and Cursor command-based configs.

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
