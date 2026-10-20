FROM node:22-bookworm-slim

ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg chromium ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable
WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.json ./
COPY packages ./packages
COPY vendor ./vendor
COPY skills ./skills

RUN pnpm install --frozen-lockfile --prod=false && pnpm build

ENV NODE_ENV=production

ENV MCP_TRANSPORT=http
ENV MCP_PUBLIC=true
ENV PORT=10000
EXPOSE 10000
CMD ["node", "packages/mcp/dist/server.js"]
