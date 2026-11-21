# syntax=docker/dockerfile:1
# Build context is the REPO ROOT:  docker build -f apps/web/Dockerfile .
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY packages/db/package.json packages/db/
COPY packages/sportmonks/package.json packages/sportmonks/
COPY services/worker/package.json services/worker/
RUN npm ci

FROM deps AS build
COPY . .
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so they must be build args.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_TURNSTILE_SITEKEY
ARG NEXT_PUBLIC_APP_STORE_URL
ARG NEXT_PUBLIC_PLAY_STORE_URL
ARG NEXT_PUBLIC_ADSENSE_CLIENT
ARG NEXT_PUBLIC_AD_SLOT_BANNER
ARG NEXT_PUBLIC_AD_SLOT_RECT
ARG NEXT_PUBLIC_AD_SLOT_INFEED
ARG NEXT_PUBLIC_AD_SLOT_ARTICLE
ARG NEXT_PUBLIC_AD_SLOT_ANCHOR
ARG NEXT_PUBLIC_ADS_PREVIEW
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID NEXT_PUBLIC_TURNSTILE_SITEKEY=$NEXT_PUBLIC_TURNSTILE_SITEKEY \
    NEXT_PUBLIC_APP_STORE_URL=$NEXT_PUBLIC_APP_STORE_URL NEXT_PUBLIC_PLAY_STORE_URL=$NEXT_PUBLIC_PLAY_STORE_URL \
    NEXT_PUBLIC_ADSENSE_CLIENT=$NEXT_PUBLIC_ADSENSE_CLIENT \
    NEXT_PUBLIC_AD_SLOT_BANNER=$NEXT_PUBLIC_AD_SLOT_BANNER \
    NEXT_PUBLIC_AD_SLOT_RECT=$NEXT_PUBLIC_AD_SLOT_RECT \
    NEXT_PUBLIC_AD_SLOT_INFEED=$NEXT_PUBLIC_AD_SLOT_INFEED \
    NEXT_PUBLIC_AD_SLOT_ARTICLE=$NEXT_PUBLIC_AD_SLOT_ARTICLE \
    NEXT_PUBLIC_AD_SLOT_ANCHOR=$NEXT_PUBLIC_AD_SLOT_ANCHOR \
    NEXT_PUBLIC_ADS_PREVIEW=$NEXT_PUBLIC_ADS_PREVIEW \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @apex/web

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
HEALTHCHECK --interval=20s --timeout=5s --start-period=20s --retries=3 CMD wget -qO- "http://127.0.0.1:3000/api/health?probe=live" >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]
