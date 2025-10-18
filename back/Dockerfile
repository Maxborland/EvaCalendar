# Этап сборки (builder)
FROM node:lts-alpine AS builder

WORKDIR /app

# Установка системных зависимостей, необходимых для сборки
RUN apk update && \
    apk add --no-cache python3 make g++ ca-certificates && \
    update-ca-certificates && \
    rm -rf /var/cache/apk/*

COPY package*.json ./

# Установка только производственных зависимостей и очистка кеша npm
RUN npm ci --only=production && npm cache clean --force

COPY db.cjs knexfile.cjs index.js pm2.config.js babel.config.js scheduler.js ./
COPY config ./config
COPY controllers ./controllers
COPY middleware ./middleware
COPY migrations ./migrations
COPY services ./services
COPY utils ./utils
COPY routes ./routes


# Этап выполнения (runner)
FROM node:lts-alpine AS runner

WORKDIR /app

# Копируем необходимые артефакты из этапа сборки
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/db.cjs ./db.cjs
COPY --from=builder /app/knexfile.cjs ./knexfile.cjs
COPY --from=builder /app/index.js ./index.js
COPY --from=builder /app/scheduler.js ./scheduler.js

COPY --from=builder /app/config ./config
COPY --from=builder /app/controllers ./controllers
COPY --from=builder /app/middleware ./middleware
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/services ./services
COPY --from=builder /app/utils ./utils
COPY --from=builder /app/routes ./routes

VOLUME /app/data

EXPOSE 3001

CMD ["node", "index.js"]