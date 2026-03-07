FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json turbo.json tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY packages/server ./packages/server
RUN npm install
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/server

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/packages/server/dist ./dist
COPY --from=builder /app/packages/server/package.json ./
COPY --from=builder /app/packages/shared/dist ./node_modules/@roblox-studio-mcp/shared/dist
COPY --from=builder /app/packages/shared/package.json ./node_modules/@roblox-studio-mcp/shared/
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
