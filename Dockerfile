FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache git

COPY package.json bun.lockb* ./

RUN bun install --frozen-lockfile --production

COPY . .

EXPOSE 3000

CMD ["bun", "src/api/server.js"]
