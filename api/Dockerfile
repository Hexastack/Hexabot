FROM node:20-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable

WORKDIR /app

FROM base AS deps

WORKDIR /app

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml .npmrc ./
COPY api/package.json api/package.json
COPY frontend/package.json frontend/package.json
COPY widget/package.json widget/package.json

RUN pnpm install --filter @hexabot/api... --prod=false

FROM deps AS build

COPY api ./api

RUN pnpm --filter @hexabot/api run build

FROM base AS development

ENV NODE_ENV=development

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml .npmrc ./
COPY --from=deps /app/node_modules ./node_modules
COPY api ./api

EXPOSE 3000

CMD ["pnpm", "--filter", "@hexabot/api", "run", "start:debug"]

FROM base AS production-deps

WORKDIR /app

COPY package.json pnpm-workspace.yaml turbo.json pnpm-lock.yaml .npmrc ./
COPY api/package.json api/package.json
COPY frontend/package.json frontend/package.json
COPY widget/package.json widget/package.json

RUN pnpm install --filter @hexabot/api... --prod

FROM base AS production

ENV NODE_ENV=production

COPY --from=production-deps /app/node_modules ./node_modules
COPY --from=build /app/api/dist ./api/dist
COPY api/package.json ./api/package.json
COPY api/assets ./api/assets
COPY api/documentation ./api/documentation

EXPOSE 3000

CMD ["node", "api/dist/main"]
