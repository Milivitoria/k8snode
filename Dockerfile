# Multi-stage build for production optimization
FROM node:18-alpine AS base
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# Copy pre-built application
COPY dist ./dist

# Production stage
FROM node:18-alpine AS production

# Create non-root user
RUN addgroup -g 1001 -S nodeapp && \
    adduser -S nodeapp -u 1001

WORKDIR /app

# Copy dependencies and built application from base stage
COPY --from=base --chown=nodeapp:nodeapp /app/node_modules ./node_modules
COPY --from=base --chown=nodeapp:nodeapp /app/dist ./dist
COPY --chown=nodeapp:nodeapp package*.json ./

# Security: Use non-root user
USER nodeapp

# Health check using node.js instead of external tools
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Expose port
EXPOSE 3000

# Start the application (Node.js handles signals properly in containers)
CMD ["node", "dist/app.js"]