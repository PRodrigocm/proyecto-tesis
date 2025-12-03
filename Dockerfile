# ============================================
# Dockerfile PRODUCCIÓN - proyecto-tesis
# Next.js + Prisma 7 + PostgreSQL
# ============================================

# Stage 1: Dependencies (solo producción)
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Instalar solo dependencias de producción
RUN npm ci --legacy-peer-deps --omit=dev || npm install --legacy-peer-deps --omit=dev

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generar Prisma Client y build optimizado
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner (Producción optimizada)
FROM node:20-alpine AS runner
WORKDIR /app

# Instalar solo lo necesario para runtime
RUN apk add --no-cache libc6-compat openssl dumb-init

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos de producción
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

# Healthcheck para monitoreo
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Usar dumb-init para manejo correcto de señales
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
