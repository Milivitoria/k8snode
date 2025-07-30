# Build stage
FROM node:18-alpine AS builder

# Create app directory
WORKDIR /usr/src/app

# Copy package files first for better layer caching
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeapp -u 1001

# Create app directory
WORKDIR /usr/src/app

# Change ownership to nodeapp user
RUN chown -R nodeapp:nodeapp /usr/src/app

# Switch to non-root user
USER nodeapp

# Copy package.json and package-lock.json
COPY --chown=nodeapp:nodeapp package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nodeapp:nodeapp /usr/src/app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the application
CMD ["node", "dist/app.js"]