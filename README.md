# Dazzle

> Landing pages. 3D. Video. One command.

Dazzle is an open-source TypeScript monorepo for generating accessible, self-contained landing-page compositions with seekable animation timelines and optional 3D effects.

## Quick start

```bash
pnpm install
pnpm --filter dazzle-cli build
node packages/cli/dist/index.js init demo
node packages/cli/dist/index.js preview demo/landing.html
```

Generate directly:

```bash
dazzle create --brand "Acme" --tagline "Build what is next" --effect cube --output landing.html
dazzle lint landing.html
dazzle themes
```

## Packages

- **dazzle-core** — HTML composition generator, themes, and validation.
- **dazzle-cli** — `init`, `create`, `preview`, `render`, `lint`, and `themes` commands.
- **dazzle-mcp** — MCP tools for generation, theme discovery, preview URLs, and render requests.

## MCP setup

Build the server and point your MCP client at `packages/mcp/dist/server.js`:

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

## Composition contract

Every generated page has a `data-composition-id`, dimensions, duration, and FPS on `#root`. Animated elements are `.clip` nodes with `data-start` and `data-duration`. Timelines are paused and exposed as `window.__timelines`; call `window.__seek(seconds)` to seek.

Video rendering is intentionally an optional integration: install a compatible HyperFrames engine and FFmpeg, then wire them into the `render` command for your environment.

## Development

```bash
pnpm lint
pnpm test
pnpm build
```

## License

MIT
