# syntax=docker/dockerfile:1

# Debian (glibc) con el mismo Node que CI: el lockfile trae para esa plataforma
# los binarios nativos de esbuild y Rollup que usa Vite
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .
RUN npm run build


# El binario oficial trae cap_net_bind_service, y con cap_drop: ALL no se puede
# ejecutar. Escuchamos en 8080, así que se la quitamos aquí: cambiarlo en la
# imagen final duplicaría el binario en otra capa
FROM caddy:2.11-alpine AS caddy

RUN setcap -r /usr/bin/caddy


# Mismo Alpine que caddy:2.11-alpine; mailcap da los tipos MIME a file_server
FROM alpine:3.23 AS production

RUN apk add --no-cache mailcap && \
    addgroup -S -g 10001 app && \
    adduser -S -D -H -h /srv -u 10001 -G app app && \
    mkdir -p /srv/runtime && \
    chown app:app /srv/runtime

COPY --from=caddy /usr/bin/caddy /usr/bin/caddy
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint.sh
# Propiedad de root: el usuario app no puede cambiar los estáticos
COPY --from=build /app/build /srv/app

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD ["wget", "-q", "-O", "/dev/null", "http://127.0.0.1:8080/health"]

# API_BASE_URL e INVOICING_API_URL son obligatorias: sin ellas no arranca
ENTRYPOINT ["entrypoint.sh"]
CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
