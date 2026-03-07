FROM node:20-alpine AS builder
WORKDIR /app

# Copy root config
COPY package.json turbo.json tsconfig.base.json ./

# Copy shared package
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/shared/src packages/shared/src

# Copy server package
COPY packages/server/package.json packages/server/
COPY packages/server/tsconfig.json packages/server/
COPY packages/server/src packages/server/src

# Install deps and build
RUN npm install --ignore-scripts
RUN cd packages/shared && npx tsc
RUN cd packages/server && npx tsc

# Replace workspace symlink with actual built package
RUN rm -rf node_modules/@roblox-studio-mcp/shared && \
    mkdir -p node_modules/@roblox-studio-mcp/shared && \
    cp -r packages/shared/dist node_modules/@roblox-studio-mcp/shared/dist && \
    cp packages/shared/package.json node_modules/@roblox-studio-mcp/shared/package.json

# Production image
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
