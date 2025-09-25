FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Assuming the monorepo root is the context directory, adjust paths for package.json and lock files accordingly
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY frontend/package*.json ./frontend/
COPY widget/package*.json ./widget/

# Install dependencies in the root to setup workspaces
RUN \
    if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/package-lock.json ./package-lock.json
COPY ./widget ./widget
COPY ./frontend ./frontend
COPY --from=deps /app/widget/node_modules ./widget/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules

# Build the Next.js app in the frontend directory
WORKDIR /app/frontend
RUN \
    if [ -f ../yarn.lock ]; then yarn run build; \
    elif [ -f ../package-lock.json ]; then npm run build; \
    elif [ -f ../pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

FROM base AS development

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./

COPY frontend/package*.json ./frontend/  

COPY widget/package*.json ./widget/  

RUN npm install

COPY ./frontend ./frontend
COPY ./widget ./widget



# used to by pass Next.js paching lock file
ENV NEXT_IGNORE_INCORRECT_LOCKFILE=true 
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

WORKDIR /app/frontend

CMD ["npm", "run", "dev", "--", "-p", "8080"]

# Production image, copy all the files and run next
FROM base AS production
WORKDIR /app

# used to by pass Next.js paching lock file 
ENV NEXT_IGNORE_INCORRECT_LOCKFILE=true 
ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/standalone/frontend ./
COPY --from=builder --chown=nextjs:nodejs /app/frontend/.next/static ./.next/static

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/frontend/public ./public

# Set the correct permission for prerender cache
RUN chown nextjs:nodejs .next

USER nextjs

EXPOSE 8080

ENV PORT 8080

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD HOSTNAME="0.0.0.0" node server.js
