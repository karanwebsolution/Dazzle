FROM node:22-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg chromium ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile && pnpm build

ENV MCP_TRANSPORT=http
EXPOSE 10000
CMD ["node", "packages/mcp/dist/server.js"]
