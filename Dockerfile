# syntax=docker/dockerfile:1.6
# AutoToDo — Next.js 14 standalone image
# Build context: project root (where package.json lives)
# Build:  docker build -t autotodo-app:latest .
# Run:    docker run --rm -p 3000:3000 --env-file .env.production autotodo-app:latest

# -------- Stage 1: deps --------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# -------- Stage 2: builder --------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time env: NEXT_PUBLIC_* must be present at build (they get inlined into JS bundles).
# Provide them via --build-arg or an .env.production file mounted into the build.
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# -------- Stage 3: runner --------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# Standalone output bundles only the deps Next.js actually uses
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# feedback.md wird zur Laufzeit von /api/admin/feedback gelesen (syncFeedbackMd),
# um den DB-Status an die in feedback.md dokumentierten Erledigungen anzugleichen.
COPY --from=builder --chown=nextjs:nodejs /app/feedback.md ./feedback.md

USER nextjs
EXPOSE 3000

# Healthcheck — Next.js standalone serves a 404 on / for unauthenticated users (200 expected on /)
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
