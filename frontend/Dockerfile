# syntax=docker/dockerfile:1
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_UNLEASH_URL=""
ARG VITE_UNLEASH_CLIENT_KEY=""
ENV VITE_UNLEASH_URL=$VITE_UNLEASH_URL
ENV VITE_UNLEASH_CLIENT_KEY=$VITE_UNLEASH_CLIENT_KEY
RUN npm run build

FROM nginx:1.27-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
