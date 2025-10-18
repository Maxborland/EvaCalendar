# Этап сборки
FROM node:lts-alpine AS builder
RUN apk update && apk upgrade --no-cache

WORKDIR /app

COPY package*.json ./

# Используем npm ci для установки зависимостей и очищаем кеш
RUN npm ci && rm -rf /root/.npm
# Если devDependencies нужны для сборки, можно использовать:
# RUN npm install && npm cache clean --force

COPY . .

RUN npm run build

# Этап production-образа
FROM nginx:alpine-slim

# Подменяем конфигурацию Nginx для проксирования /api на back
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Копируем только собранные статические файлы из этапа builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]