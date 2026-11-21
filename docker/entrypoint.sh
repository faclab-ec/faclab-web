#!/bin/sh
# Escribe /config.js con las URLs de API y la telemetría de este entorno y
# arranca Caddy, así la misma imagen sirve en cualquier entorno sin
# reconstruirla.
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

# Telemetría del navegador (S7.3). Apagada si no se pide: es el rollback.
otel_enabled=${OTEL_ENABLED:-false}
case "$otel_enabled" in
    true | false) ;;
    *) fail "OTEL_ENABLED must be true or false" ;;
esac

# /otlp en el mismo origen (el proxy de entrada lo lleva al Collector) o una
# URL http(s); mismos caracteres prohibidos que las URLs de API
otlp_url=${OTLP_URL:-/otlp}
case "$otlp_url" in
    //*) fail "OTLP_URL must be a path like /otlp or an http:// or https:// URL" ;;
    /?* | http://?* | https://?*) ;;
    *) fail "OTLP_URL must be a path like /otlp or an http:// or https:// URL" ;;
esac
case "$otlp_url" in
    *[[:space:]\"\\\<\>]*) fail "OTLP_URL has characters that aren't allowed in a URL" ;;
esac
otlp_url=${otlp_url%/}

otel_sampling_rate=${OTEL_SAMPLING_RATE:-1}
awk -v rate="$otel_sampling_rate" \
    'BEGIN { exit !(rate ~ /^(0(\.[0-9]+)?|1(\.0+)?)$/) }' ||
    fail "OTEL_SAMPLING_RATE must be a number between 0 and 1"

environment=${ENVIRONMENT:-production}
case "$environment" in
    local | staging | production) ;;
    *) fail "ENVIRONMENT must be local, staging or production" ;;
esac

printf 'window.__FACLAB_CONFIG__ = {"apiBaseUrl":"%s","invoicingApiUrl":"%s","otelEnabled":%s,"otlpUrl":"%s","otelSamplingRate":%s,"environment":"%s"}\n' \
    "$api_base_url" "$invoicing_api_url" "$otel_enabled" "$otlp_url" \
    "$otel_sampling_rate" "$environment" >"$CONFIG_FILE"
echo "faclab-web: API_BASE_URL=$api_base_url INVOICING_API_URL=$invoicing_api_url"
echo "faclab-web: OTEL_ENABLED=$otel_enabled OTLP_URL=$otlp_url OTEL_SAMPLING_RATE=$otel_sampling_rate ENVIRONMENT=$environment"

exec "$@"
