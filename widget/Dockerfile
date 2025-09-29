# Base stage: Base image for all stages
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./


# Set the environment variables
ARG REACT_APP_WIDGET_API_URL
ARG REACT_APP_WIDGET_CHANNEL

ENV REACT_APP_WIDGET_API_URL=${REACT_APP_WIDGET_API_URL}
ENV REACT_APP_WIDGET_CHANNEL=${REACT_APP_WIDGET_CHANNEL}

# Installer stage: Installs dependencies
FROM base AS installer
COPY . .
RUN npm install

# Development stage: Installs development dependencies and serves the app
FROM installer AS development
ENV NODE_ENV=development
EXPOSE 5173
CMD ["npm", "run", "dev"]

# Builder stage: Builds the app
FROM installer AS builder
ENV NODE_ENV=production
RUN npm run build

# Production stage: Serves the  app
FROM base AS production
ENV NODE_ENV=production
COPY  --from=builder /app/dist /app/dist
RUN npm install -g serve
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]