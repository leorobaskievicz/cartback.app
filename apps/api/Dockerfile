FROM node:20-alpine

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

# Set NODE_PATH so Node can find modules from /app/node_modules
ENV NODE_PATH=/app/node_modules

# Expose port
EXPOSE 3333

# Start the server from the build directory
CMD ["node", "build/bin/server.js"]
