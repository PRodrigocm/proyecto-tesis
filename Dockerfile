# ============================================
# Dockerfile para proyecto-tesis (Next.js + Prisma)
# Con git pull para actualizar el repositorio
# ============================================

# Argumentos de build
ARG GIT_REPO_URL=https://github.com/PRodrigocm/proyecto-tesis.git
ARG GIT_BRANCH=main

# Stage 1: Clone/Pull del repositorio
FROM node:20-alpine AS source
RUN apk add --no-cache git
WORKDIR /app

ARG GIT_REPO_URL
ARG GIT_BRANCH

# Clonar el repositorio (siempre obtiene la última versión)
RUN git clone --depth 1 --branch ${GIT_BRANCH} ${GIT_REPO_URL} .

# Mostrar el último commit para verificación
RUN echo "📦 Último commit:" && git log -1 --oneline

# Stage 2: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiar archivos de dependencias desde el repo clonado
COPY --from=source /app/package.json /app/package-lock.json* ./
COPY --from=source /app/prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Stage 3: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=deps /app/node_modules ./node_modules
# Copiar todo el código fuente desde el repo clonado
COPY --from=source /app .

# Variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Generar Prisma Client y construir la aplicación
RUN npx prisma generate
RUN npm run build

# Stage 4: Runner (Producción)
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios para producción
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copiar el build de Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar node_modules para Prisma Client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Comando para iniciar la aplicación
CMD ["node", "server.js"]
