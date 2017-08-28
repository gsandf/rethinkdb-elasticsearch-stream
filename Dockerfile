FROM node:latest

COPY . /app
WORKDIR /app

CMD ["yarn", "test"]
