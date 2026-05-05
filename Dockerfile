# ---- deps: production dependencies (with native module build tools) ----
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci --omit=dev

# ---- builder: full install + vite build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runner: lean production image ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/build        ./build
COPY package.json server.mjs ./
COPY scripts/    ./scripts/
COPY migrations/ ./migrations/

RUN mkdir -p /app/data

EXPOSE 3000
CMD ["sh", "-c", "node scripts/migrate.mjs && node server.mjs"]
