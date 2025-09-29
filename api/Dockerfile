FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

COPY patches ./patches

RUN npm ci

COPY . .

RUN npm run build

FROM node:20-alpine AS development

WORKDIR /app

COPY package*.json ./

COPY --from=builder /app/node_modules ./node_modules

COPY --from=builder /app/src/extensions ./src/extensions

COPY --from=builder /app/patches ./patches

COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "run", "start:debug"]

FROM node:20-alpine AS production

WORKDIR /app

COPY package*.json ./

COPY --from=builder /app/src/extensions ./src/extensions

COPY --from=builder /app/patches ./patches

RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
