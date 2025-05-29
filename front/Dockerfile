# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL
# Создаем .env.production для Vite, чтобы VITE_API_URL была доступна во время сборки
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Этап production-образа
FROM nginx:alpine

# Подменяем конфигурацию Nginx для проксирования /api на back
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]