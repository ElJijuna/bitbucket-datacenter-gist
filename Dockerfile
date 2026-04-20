FROM oven/bun:1-alpine AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run ui:build

FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache git openssh-client

COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile --production

COPY --from=builder /app/src ./src
COPY --from=builder /app/ui/dist ./ui/dist

EXPOSE 3000

CMD ["bun", "src/api/server.js"]
