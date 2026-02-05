FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set working directory
WORKDIR /app

# Copy root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/web ./apps/web

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @cartback/shared build

# Build web
RUN pnpm --filter @cartback/web build

# Production stage
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy workspace structure for module resolution
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy the built application
COPY --from=base /app/apps/web ./apps/web

WORKDIR /app/apps/web

# Set NODE_PATH for module resolution
ENV NODE_PATH=/app/node_modules

# Expose port
EXPOSE 3000

# Start the preview server
CMD sh -c "pnpm run preview -- --host 0.0.0.0 --port ${PORT:-3000}"
