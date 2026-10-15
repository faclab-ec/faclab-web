#!/bin/sh
# Escribe /config.js con las URLs de API de este entorno y arranca Caddy, así la
# misma imagen sirve en cualquier entorno sin reconstruirla.
set -eu

CONFIG_FILE=/srv/runtime/config.js

fail() {
    echo "faclab-web: $*" >&2
    exit 1
}

# Exige una URL http(s) sin espacios, comillas, barras invertidas ni < >, para
# que el literal JSON de config.js sea seguro, y le quita la barra final
normalize_url() {
    name=$1
    value=$2
    [ -n "$value" ] || fail "$name is required"
    case "$value" in
        http://?* | https://?*) ;;
        *) fail "$name must be an http:// or https:// URL" ;;
    esac
    case "$value" in
        *[[:space:]\"\\\<\>]*) fail "$name has characters that aren't allowed in a URL" ;;
    esac
    printf '%s' "${value%/}"
}

api_base_url=$(normalize_url API_BASE_URL "${API_BASE_URL:-}")
invoicing_api_url=$(normalize_url INVOICING_API_URL "${INVOICING_API_URL:-}")

printf 'window.__FACLAB_CONFIG__ = {"apiBaseUrl":"%s","invoicingApiUrl":"%s"}\n' \
    "$api_base_url" "$invoicing_api_url" >"$CONFIG_FILE"
echo "faclab-web: API_BASE_URL=$api_base_url INVOICING_API_URL=$invoicing_api_url"

exec "$@"
