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

# Production stage - Serve static files
FROM nginx:alpine

# Copy built files from build stage
COPY --from=base /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration
COPY --from=base /app/apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
