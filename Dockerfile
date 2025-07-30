# Multi-stage build for optimized production image

# Build stage
FROM node:18-alpine AS builder

# Install dumb-init for signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeapp -u 1001 -G nodeapp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Install dumb-init
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeapp -u 1001 -G nodeapp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Change ownership to app user
RUN chown -R nodeapp:nodeapp /app

# Switch to non-root user
USER nodeapp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/app.js"]