# Use the official Bun image
FROM oven/bun:latest AS base
WORKDIR /usr/src/app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

# Set ENTRYPOINT to bun run for CLI usage
ENTRYPOINT ["bun", "run"] 