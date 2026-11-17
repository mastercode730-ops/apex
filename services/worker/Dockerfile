# syntax=docker/dockerfile:1
# Build context is the REPO ROOT:  docker build -f services/worker/Dockerfile .
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/sportmonks/package.json packages/sportmonks/
COPY services/worker/package.json services/worker/
# Install only the worker's production dependency tree (plus the workspace packages it links).
RUN npm ci --omit=dev -w @apex/worker --include-workspace-root
COPY packages packages
COPY services/worker services/worker
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- "http://127.0.0.1:4000/health" >/dev/null || exit 1
CMD ["npx", "tsx", "services/worker/src/index.ts"]
