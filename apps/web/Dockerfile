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

WORKDIR /app/apps/web

# Copy the built application
COPY --from=base /app/apps/web ./

# Copy root dependencies
COPY --from=base /app/node_modules /app/node_modules
COPY --from=base /app/packages /app/packages
COPY --from=base /app/package.json /app/package.json
COPY --from=base /app/pnpm-workspace.yaml /app/pnpm-workspace.yaml

# Expose port
EXPOSE 3000

# Start the preview server
CMD sh -c "pnpm run preview -- --host 0.0.0.0 --port ${PORT:-3000}"
