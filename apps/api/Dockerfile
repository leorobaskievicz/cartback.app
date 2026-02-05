FROM node:20-alpine AS base

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

# Set working directory
WORKDIR /app

# Copy root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy all workspace packages
COPY packages ./packages
COPY apps/api ./apps/api

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build shared package
RUN pnpm --filter @cartback/shared build

# Build API
WORKDIR /app/apps/api
RUN node --import tsx ace.js build --ignore-ts-errors

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy workspace structure for module resolution
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages ./packages

# Copy the built application
COPY --from=base /app/apps/api/build ./apps/api/build

WORKDIR /app/apps/api/build

# Set NODE_PATH for module resolution
ENV NODE_PATH=/app/node_modules

# Expose port
EXPOSE 3333

# Start the server
CMD ["node", "bin/server.js"]
