import { describe, expect, it } from 'vitest'
import {
    InMemorySpanExporter,
    SimpleSpanProcessor,
    WebTracerProvider,
} from '@opentelemetry/sdk-trace-web'
import { RedactUrlProcessor, redactQueryString, redactUrl } from '../redaction'

describe('redactUrl', () => {
    it('quita los valores del query string y el fragmento', () => {
        expect(
            redactUrl(
                'http://localhost:3000/api/pos/customers?search=Juan%20P%C3%A9rez&limit=20#x'
            )
        ).toBe(
            'http://localhost:3000/api/pos/customers?search=REDACTED&limit=REDACTED'
        )
        expect(redactUrl('/pos?quote=12')).toBe('/pos?quote=REDACTED')
        expect(redactUrl('/api/products/barcode?code')).toBe(
            '/api/products/barcode?code=REDACTED'
        )
    })

    it('deja igual una URL sin query string', () => {
        expect(redactUrl('http://localhost:3000/api/admin/sales/12')).toBe(
            'http://localhost:3000/api/admin/sales/12'
        )
        expect(redactUrl('http://localhost:3000/a?')).toBe(
            'http://localhost:3000/a'
        )
    })

    it('redacta un query string suelto', () => {
        expect(redactQueryString('taxId=0912345678&&page=2')).toBe(
            'taxId=REDACTED&page=REDACTED'
        )
    })
})

describe('RedactUrlProcessor', () => {
    it('redacta las URLs del span antes de exportarlo', async () => {
        const exporter = new InMemorySpanExporter()
        const provider = new WebTracerProvider({
            spanProcessors: [
                new RedactUrlProcessor(),
                new SimpleSpanProcessor(exporter),
            ],
        })
        const span = provider.getTracer('test').startSpan('GET', {
            attributes: {
                'url.full':
                    'http://localhost:3000/api/admin/customers?search=Ana',
                'http.url': 'http://localhost:3000/x?taxId=0912345678',
                'url.query': 'barcode=7861234567890',
                'http.request.method': 'GET',
            },
        })
        span.end()
        await provider.forceFlush()

        const [exported] = exporter.getFinishedSpans()
        expect(exported.attributes).toEqual({
            'url.full':
                'http://localhost:3000/api/admin/customers?search=REDACTED',
            'http.url': 'http://localhost:3000/x?taxId=REDACTED',
            'url.query': 'barcode=REDACTED',
            'http.request.method': 'GET',
        })
    })
})
