FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies for the monorepo
FROM base AS deps
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY frontend/package*.json ./frontend/
COPY widget/package*.json ./widget/

RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Development image used by docker-compose dev workflows
FROM base AS development
ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/frontend/package*.json ./frontend/
COPY --from=deps /app/widget/node_modules ./widget/node_modules
COPY --from=deps /app/widget/package*.json ./widget/
COPY . .

WORKDIR /app/frontend
EXPOSE 8080
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

# Builder image for production bundles
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package*.json ./
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY --from=deps /app/widget/node_modules ./widget/node_modules
COPY . .

WORKDIR /app/frontend
RUN npm run build

# Production image served by nginx
FROM nginx:1.27-alpine AS production
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/public /usr/share/nginx/html
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
