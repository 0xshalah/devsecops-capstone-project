# syntax=docker/dockerfile:1.7
# Build context: repository root.

# ---------- Stage 1: build the React bundle ----------
FROM node:20-alpine AS builder
WORKDIR /build
# Empty = same-origin "/api" calls, proxied by nginx to the backend service.
ARG REACT_APP_BACKEND_URL=""
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL} \
    ENABLE_HEALTH_CHECK=false \
    GENERATE_SOURCEMAP=false \
    CI=true
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile --network-timeout 600000
COPY frontend/ ./
RUN yarn build

# ---------- Stage 2: unprivileged nginx ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
LABEL org.opencontainers.image.title="tollgate-frontend" \
      org.opencontainers.image.description="Tollgate console and landing page (static, nginx)" \
      org.opencontainers.image.source="https://github.com/0xshalah/devsecops-capstone-project"
# Upstream used by the /api reverse proxy (rendered by the nginx envsubst entrypoint).
ENV BACKEND_UPSTREAM=http://backend:8001
COPY docker/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=builder --chown=101:101 /build/build /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
