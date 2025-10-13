FROM node:20-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml .npmrc ./
COPY api/package.json api/package.json
COPY frontend/package.json frontend/package.json
COPY widget/package.json widget/package.json

RUN pnpm install --filter @hexabot/frontend... --prod=false

FROM deps AS builder

COPY frontend ./frontend
COPY widget ./widget

RUN pnpm --filter @hexabot/frontend... run build

FROM base AS development

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY frontend ./frontend
COPY widget ./widget

WORKDIR /app/frontend
EXPOSE 8080

CMD ["pnpm", "--filter", "@hexabot/frontend", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8080"]

FROM nginx:1.27-alpine AS production

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/public /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
