FROM node:18-alpine AS builder

WORKDIR /app

COPY . .  

FROM node:18-alpine AS installer

WORKDIR /app

COPY --from=builder /app/package*.json ./

COPY --from=builder /app/merge-extensions-deps.js ./

COPY --from=builder /app/src/extensions ./src/extensions

COPY --from=builder /app/patches ./patches

RUN npm update -g npm

RUN npm config set registry https://registry.npmjs.com/

RUN npm i --verbose --maxsockets 6

FROM node:18-alpine AS runner

WORKDIR /app

COPY --from=installer /app/ .

COPY . .

EXPOSE 3000

CMD [ "npm", "run" , "start:dev" ]
