# World of Claw - World Engine
# Runs continuous tick simulation

FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.6.2 --activate

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services/world-engine ./services/world-engine
COPY drizzle ./drizzle
COPY seed ./seed

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build world-engine
RUN pnpm build -w @claw-world/world-engine 2>/dev/null || \
    pnpm build -r --filter @claw-world/world-engine 2>/dev/null || \
    echo "Building individual packages..."

# Build simulation package
RUN ls services/world-engine/src/

# Environment
ENV NODE_ENV=production
ENV TICK_INTERVAL_MS=5000

# Run continuous tick simulation
CMD ["sh", "-c", "node --import services/world-engine/src/run-continuous.ts"]
