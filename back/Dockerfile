FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN apk update && apk add --no-cache python3 make g++
RUN npm install

COPY . .

# При использовании SQLite, база данных будет создана в VOLUME, если она не существует.
# Это позволит сохранять данные даже при пересоздании контейнера.
VOLUME /app/data

EXPOSE 3001

CMD ["npm", "start"]