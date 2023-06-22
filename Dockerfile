FROM node:16-alpine as build
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
COPY .env ./.env
RUN npm ci

FROM node:16-alpine as prod
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY . .
CMD ["npm", "run", "start"]
EXPOSE 3000
