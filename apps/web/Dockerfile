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

# Copy the built application
COPY --from=base /app/apps/web ./

# Copy node_modules from the build stage
COPY --from=base /app/node_modules ../node_modules
COPY --from=base /app/packages ../packages

# Expose port
EXPOSE 3000

# Start the preview server
CMD ["pnpm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
