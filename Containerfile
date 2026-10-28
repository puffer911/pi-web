FROM node:22.19.0-bookworm-slim AS dependencies

WORKDIR /app
COPY package.json package-lock.json ./
COPY bin/prepare-terminal.js ./bin/prepare-terminal.js
RUN npm ci

FROM dependencies AS builder

ARG NEXT_PUBLIC_BASE_PATH=/pi-web
ENV NEXT_PUBLIC_BASE_PATH=${NEXT_PUBLIC_BASE_PATH}
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:22.19.0-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_PUBLIC_BASE_PATH=/pi-web
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=30141
ENV PI_WEB_HOSTNAME=127.0.0.1
ENV PI_WEB_NO_OPEN=1
ENV PI_WEB_SKIP_VERSION_CHECK=1

COPY --from=builder /app/package.json /app/package-lock.json /app/next.config.ts ./
COPY --from=builder /app/lib/app-path.ts /app/lib/app-path.js ./lib/
COPY --from=builder /app/bin ./bin
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

USER 0:0
EXPOSE 30141

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:" + process.env.PORT + "/pi-web/").then((r) => process.exit(r.status >= 200 && r.status < 400 ? 0 : 1)).catch(() => process.exit(1))'

ENTRYPOINT ["node", "bin/pi-web.js"]
CMD ["--no-open", "--hostname", "127.0.0.1", "--port", "30141"]
