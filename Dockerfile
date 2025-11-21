# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first (better cache)
COPY package*.json ./

RUN npm ci --quiet

# Copy prisma schema
COPY prisma ./prisma/

RUN npx prisma generate

# Copy source code (invalidates cache only if code changes)
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install curl for healthcheck (lighter than wget)
RUN apk add --no-cache curl

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production --quiet && npm cache clean --force

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

# Create entrypoint script
COPY --chmod=755 --chown=nodejs:nodejs <<EOF /app/entrypoint.sh
#!/bin/sh
set -e
echo "Running migrations..."
npx prisma migrate deploy
echo "Starting application..."
exec node dist/main
EOF

USER nodejs

EXPOSE 3333

ENTRYPOINT ["/app/entrypoint.sh"]
