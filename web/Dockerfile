# =============================================================================
# Kwitch web frontend — production image
# Stage 1 builds the Vite bundle (VITE_* values are baked in at build time —
# pass them as --build-arg). Stage 2 serves the static files with nginx,
# which also reverse-proxies /usersig to the UserSig API so the whole app is
# served from ONE origin (no CORS, no second public hostname).
#
#   docker build -t kwitch-web \
#     --build-arg VITE_SDK_APP_ID=140xxxxxxx \
#     ./web
#   docker run -p 8080:8080 -e USERSIG_UPSTREAM=http://usersig:3001/usersig kwitch-web
#
# (Usually you don't run this by hand — `docker compose up` at the repo root
# wires everything together.)
# =============================================================================

FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_SDK_APP_ID
ARG VITE_USERSIG_MODE=server
# Empty = same-origin: the browser calls /usersig on the frontend's own
# origin and nginx proxies it to the API. Only set this when the API is
# deployed on a different host (split deployment).
ARG VITE_USERSIG_SERVER_URL=""
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
# Where nginx forwards /usersig requests. Override at runtime; the default
# targets a UserSig server on the same host (e.g. docker compose sets
# http://usersig:3001/usersig).
ENV USERSIG_UPSTREAM=http://127.0.0.1:3001/usersig
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
