FROM node:18-alpine AS builder

WORKDIR /app

COPY . .  

RUN npm update -g npm

RUN npm i --verbose --maxsockets 6

RUN npm run build


FROM node:18-alpine AS development

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/ .

ENV NODE_ENV=development

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "start:debug"]


FROM node:18-alpine AS production

WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/ .
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production

# Run npm prune to remove dev dependencies
RUN npm prune --production

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
