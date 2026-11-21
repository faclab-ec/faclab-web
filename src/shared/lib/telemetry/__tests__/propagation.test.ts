import { describe, expect, it } from 'vitest'
import { traceHeaderTargets, urlPrefix } from '../propagation'

describe('traceHeaderTargets', () => {
    const targets = traceHeaderTargets([
        'http://localhost:3000',
        'http://localhost:3173/',
        'https://api.example.test/api/admin',
    ])
    const propagates = (url: string) => targets.some((t) => t.test(url))

    it('propaga solo a los orígenes del core y la facturación', () => {
        expect(propagates('http://localhost:3000/api/pos/sales/quick')).toBe(
            true
        )
        expect(propagates('http://localhost:3173/api/certificates')).toBe(true)
        expect(propagates('https://api.example.test/api/auth/me')).toBe(true)
    })

    it('no propaga a otro puerto, otro dominio ni un dominio que empieza igual', () => {
        expect(propagates('http://localhost:4318/v1/traces')).toBe(false)
        expect(propagates('https://fonts.googleapis.com/css')).toBe(false)
        expect(propagates('https://api.example.test.evil.test/x')).toBe(false)
        expect(propagates('http://localhost:30001/api')).toBe(false)
    })

    it('ignora una URL mal formada', () => {
        expect(traceHeaderTargets(['http://[nope'])).toEqual([])
    })
})

describe('urlPrefix', () => {
    it('coincide con la URL y lo que cuelga de ella', () => {
        const otlp = urlPrefix('http://localhost:5173/otlp/')
        expect(otlp.test('http://localhost:5173/otlp/v1/traces')).toBe(true)
        expect(otlp.test('http://localhost:5173/otlp')).toBe(true)
        expect(otlp.test('http://localhost:5173/otlpx')).toBe(false)
    })
})
