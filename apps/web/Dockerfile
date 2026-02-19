FROM node:20-alpine AS base

# Build arguments (Railway will pass these from environment variables)
ARG VITE_API_URL
ARG CLOUDFLARE_ZONE_ID
ARG CLOUDFLARE_API_TOKEN

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

# Build web (with env vars available for Vite)
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm --filter @cartback/web build

# Purge Cloudflare cache after successful build
ENV CLOUDFLARE_ZONE_ID=$CLOUDFLARE_ZONE_ID
ENV CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
RUN node apps/web/scripts/purge-cloudflare.js || echo "Cloudflare purge skipped"

# Production stage - Serve static files
FROM nginx:alpine

# Copy built files from build stage
COPY --from=base /app/apps/web/dist /usr/share/nginx/html

# Copy nginx configuration template
COPY --from=base /app/apps/web/nginx.conf /etc/nginx/templates/default.conf.template

# Set default PORT (Railway will override this)
ENV PORT=80

# Expose port (Railway uses $PORT env var)
EXPOSE 80

# Start nginx - it will automatically substitute ${PORT} in templates
CMD ["nginx", "-g", "daemon off;"]
