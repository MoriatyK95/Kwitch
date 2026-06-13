# =============================================================================
# Kwitch web frontend — production image
# =============================================================================

FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_LIVEKIT_URL
ARG VITE_TOKEN_SERVER_URL=""
ENV VITE_LIVEKIT_URL=$VITE_LIVEKIT_URL \
    VITE_TOKEN_SERVER_URL=$VITE_TOKEN_SERVER_URL

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS runtime
ENV API_UPSTREAM=http://127.0.0.1:3001
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/client /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
