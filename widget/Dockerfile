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

RUN pnpm install --filter @hexabot/widget... --prod=false

FROM deps AS development

ARG REACT_APP_WIDGET_API_URL
ARG REACT_APP_WIDGET_CHANNEL

ENV NODE_ENV=development
ENV REACT_APP_WIDGET_API_URL=${REACT_APP_WIDGET_API_URL}
ENV REACT_APP_WIDGET_CHANNEL=${REACT_APP_WIDGET_CHANNEL}

COPY widget ./widget

WORKDIR /app/widget
EXPOSE 5173

CMD ["pnpm", "--filter", "@hexabot/widget", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

FROM deps AS builder

ARG REACT_APP_WIDGET_API_URL
ARG REACT_APP_WIDGET_CHANNEL

ENV NODE_ENV=production
ENV REACT_APP_WIDGET_API_URL=${REACT_APP_WIDGET_API_URL}
ENV REACT_APP_WIDGET_CHANNEL=${REACT_APP_WIDGET_CHANNEL}

COPY widget ./widget

RUN pnpm --filter @hexabot/widget... run build

FROM node:20-alpine AS production

ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"

RUN corepack enable && pnpm add -g http-server

WORKDIR /app

COPY --from=builder /app/widget/dist ./dist

EXPOSE 5173

CMD ["http-server", "dist", "-p", "5173", "-a", "0.0.0.0"]
