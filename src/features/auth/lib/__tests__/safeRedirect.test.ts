import { describe, it, expect } from 'vitest'
import { safeRedirectPath } from '../safeRedirect'

const FALLBACK = '/home'

describe('safeRedirectPath', () => {
    it('keeps internal paths, including query and hash', () => {
        expect(safeRedirectPath('/suppliers', FALLBACK)).toBe('/suppliers')
        expect(safeRedirectPath('/invoices?attention=1#top', FALLBACK)).toBe(
            '/invoices?attention=1#top'
        )
    })

    it('falls back when there is nothing to redirect to', () => {
        expect(safeRedirectPath(null, FALLBACK)).toBe(FALLBACK)
        expect(safeRedirectPath(undefined, FALLBACK)).toBe(FALLBACK)
        expect(safeRedirectPath('', FALLBACK)).toBe(FALLBACK)
    })

    it.each([
        ['absolute URL', 'https://evil.example/login'],
        ['protocol-relative URL', '//evil.example'],
        ['backslash treated as slash', '/\\evil.example'],
        ['backslash later in the path', '/home\\..\\evil'],
        ['control character collapsing to //', '/\t/evil.example'],
        ['javascript scheme', 'javascript:alert(1)'],
        ['relative path', 'suppliers'],
    ])('rejects %s', (_label, candidate) => {
        expect(safeRedirectPath(candidate, FALLBACK)).toBe(FALLBACK)
    })
})
