# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts tailwind.config.ts postcss.config.cjs ./
COPY public ./public
COPY src ./src

ARG VITE_SITE_URL=https://tecsafe.com.br
ARG VITE_COMPANY_NAME="Tecsafe Segurança Eletrônica"
ARG VITE_WHATSAPP_NUMBER=5511981846322
ARG VITE_WHATSAPP_DISPLAY="(11) 98184-6322"
ARG VITE_INSTAGRAM_URL=https://instagram.com/tecsafeseguranca
ARG VITE_CONTACT_EMAIL=contato@tecsafe.com.br

ENV VITE_SITE_URL=${VITE_SITE_URL} \
    VITE_COMPANY_NAME=${VITE_COMPANY_NAME} \
    VITE_WHATSAPP_NUMBER=${VITE_WHATSAPP_NUMBER} \
    VITE_WHATSAPP_DISPLAY=${VITE_WHATSAPP_DISPLAY} \
    VITE_INSTAGRAM_URL=${VITE_INSTAGRAM_URL} \
    VITE_CONTACT_EMAIL=${VITE_CONTACT_EMAIL}

RUN npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY --chown=nginx:nginx docker/security_headers.conf /etc/nginx/snippets/security_headers.conf
COPY --chown=nginx:nginx docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder --chown=nginx:nginx /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1

USER nginx
