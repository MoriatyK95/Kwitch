# =============================================================================
# Kwitch web frontend — production image
# Stage 1 builds the Vite bundle (VITE_* values are baked in at build time —
# pass them as --build-arg). Stage 2 serves the static files with nginx,
# including the SPA fallback needed for deep links like /watch/:id.
#
#   docker build -t kwitch-web \
#     --build-arg VITE_SDK_APP_ID=140xxxxxxx \
#     --build-arg VITE_USERSIG_MODE=server \
#     --build-arg VITE_USERSIG_SERVER_URL=https://api.example.com \
#     ./web
#   docker run -p 8080:8080 kwitch-web
# =============================================================================

FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_SDK_APP_ID
ARG VITE_USERSIG_MODE=server
ARG VITE_USERSIG_SERVER_URL
# Intentionally NO VITE_SDK_SECRET_KEY arg: the secret key must never be baked
# into a production frontend image. Use server mode.
ENV VITE_SDK_APP_ID=$VITE_SDK_APP_ID \
    VITE_USERSIG_MODE=$VITE_USERSIG_MODE \
    VITE_USERSIG_SERVER_URL=$VITE_USERSIG_SERVER_URL

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
