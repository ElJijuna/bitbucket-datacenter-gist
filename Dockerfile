FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run ui:build

FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache git openssh-client ca-certificates openssl

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/src ./src
COPY --from=builder /app/ui/dist ./ui/dist
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["bun", "src/api/server.js"]
