// Los navegadores descartan los caracteres de control al interpretar una URL,
// así que `/\t/evil.com` terminaría siendo `//evil.com`.
const hasControlChar = (value: string): boolean =>
    [...value].some((char) => {
        const code = char.charCodeAt(0)
        return code < 0x20 || code === 0x7f
    })

/**
 * `redirectUrl` llega por query string, así que lo controla quien arma el
 * enlace. Solo se aceptan rutas internas: una barra inicial, sin `//` ni `\`
 * (los navegadores tratan `\` como `/`, y `/\evil.com` saldría del sitio).
 */
export const safeRedirectPath = (
    candidate: string | null | undefined,
    fallback: string
): string => {
    if (!candidate) return fallback

    const isInternalPath =
        candidate.startsWith('/') &&
        !candidate.startsWith('//') &&
        !candidate.includes('\\') &&
        !hasControlChar(candidate)

    return isInternalPath ? candidate : fallback
}
