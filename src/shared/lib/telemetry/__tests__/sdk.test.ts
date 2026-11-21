import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { SpanStatusCode } from '@opentelemetry/api'
import {
    DataPointType,
    MetricReader,
    type HistogramMetricData,
} from '@opentelemetry/sdk-metrics'
import { InMemorySpanExporter } from '@opentelemetry/sdk-trace-web'
import type { Metric } from 'web-vitals'
import { ApiError } from '@/utils/errors/ApiError'
import { resetRoutes, setRoute } from '../routes'
import { startSdk, type TelemetrySdk } from '../sdk'

class TestMetricReader extends MetricReader {
    protected onForceFlush(): Promise<void> {
        return Promise.resolve()
    }

    protected onShutdown(): Promise<void> {
        return Promise.resolve()
    }
}

const entry = (startTime: number, value?: number) =>
    ({ startTime, value } as unknown as PerformanceEntry)

const vital = (
    name: Metric['name'],
    value: number,
    entries: PerformanceEntry[],
    rating: Metric['rating'] = 'good'
) => ({ name, value, rating, entries } as unknown as Metric)

describe('startSdk', () => {
    let spans: InMemorySpanExporter
    let reader: TestMetricReader
    let sdk: TelemetrySdk

    const start = (samplingRate = 1) =>
        startSdk({
            otlpUrl: '/otlp',
            samplingRate,
            environment: 'staging',
            version: '2.0.1',
            apiUrls: ['http://localhost:3000'],
            spanExporter: spans,
            metricReader: reader,
            instrument: false,
        })

    const histogram = async (name: string) => {
        const { resourceMetrics } = await reader.collect()
        const metric = resourceMetrics.scopeMetrics
            .flatMap((scope) => scope.metrics)
            .find((m) => m.descriptor.name === name) as HistogramMetricData
        expect(metric.dataPointType).toBe(DataPointType.HISTOGRAM)
        return metric
    }

    beforeEach(() => {
        spans = new InMemorySpanExporter()
        reader = new TestMetricReader()
        sdk = start()
    })

    afterEach(async () => {
        await sdk.shutdown()
        resetRoutes()
    })

    it('un error de interfaz es un span ui.error con ruta, versión y entorno', async () => {
        sdk.reportError(
            new TypeError('x is undefined'),
            { source: 'boundary', componentStack: '\n at SaleDetail' },
            '/sales/:id'
        )
        await sdk.forceFlush()

        const [span] = spans.getFinishedSpans()
        expect(span.name).toBe('ui.error')
        expect(span.status.code).toBe(SpanStatusCode.ERROR)
        expect(span.attributes).toEqual({
            'faclab.ui.route': '/sales/:id',
            'faclab.error.source': 'boundary',
            'faclab.react.component_stack': 'at SaleDetail',
            'error.type': 'TypeError',
        })
        expect(span.events[0].name).toBe('exception')
        expect(span.events[0].attributes).toMatchObject({
            'exception.type': 'TypeError',
            'exception.message': 'x is undefined',
        })
        expect(span.resource.attributes).toMatchObject({
            'service.name': 'faclab-web',
            'service.namespace': 'faclab',
            'service.version': '2.0.1',
            'deployment.environment.name': 'staging',
        })
    })

    it('de un ApiError envía el código y el id de solicitud, no el mensaje', async () => {
        sdk.reportError(
            new ApiError({
                code: 'INSUFFICIENT_STOCK',
                message: 'Not enough stock for Tablero MDF',
                status: 400,
                requestId: 'c0ffee00-0000-4000-8000-000000000002',
            }),
            { source: 'unhandledrejection' },
            '/pos'
        )
        await sdk.forceFlush()

        const [span] = spans.getFinishedSpans()
        expect(span.attributes).toMatchObject({
            'faclab.error.code': 'INSUFFICIENT_STOCK',
            'http.request.id': 'c0ffee00-0000-4000-8000-000000000002',
        })
        expect(span.events[0].attributes?.['exception.message']).toBe(
            'INSUFFICIENT_STOCK'
        )
        expect(JSON.stringify(span.events)).not.toContain('Tablero')
    })

    it('respeta la fracción de muestreo', async () => {
        await sdk.shutdown()
        spans = new InMemorySpanExporter()
        reader = new TestMetricReader()
        sdk = start(0)

        sdk.reportError(new Error('no muestreado'), { source: 'window' }, '/')
        await sdk.forceFlush()

        expect(spans.getFinishedSpans()).toHaveLength(0)
    })

    it('cada vital va a su histograma con la ruta donde ocurrió', async () => {
        setRoute('/home', 0)
        setRoute('/pos', 40)
        setRoute('/sales/:id', 100)

        sdk.recordVital(vital('LCP', 1800, [entry(3), entry(12)]))
        sdk.recordVital(
            vital('INP', 240, [entry(50), entry(52)], 'needs-improvement')
        )
        sdk.recordVital(
            vital(
                'CLS',
                0.21,
                [entry(45, 0.01), entry(120, 0.2)],
                'needs-improvement'
            )
        )

        const lcp = await histogram('faclab.web_vitals.lcp')
        expect(lcp.descriptor.unit).toBe('ms')
        expect(lcp.dataPoints[0].attributes).toEqual({
            'faclab.ui.route': '/home',
            'faclab.web_vitals.rating': 'good',
        })
        expect(lcp.dataPoints[0].value.sum).toBe(1800)
        expect(lcp.dataPoints[0].value.buckets.boundaries).toContain(2500)

        const inp = await histogram('faclab.web_vitals.inp')
        expect(inp.dataPoints[0].attributes['faclab.ui.route']).toBe('/pos')

        const cls = await histogram('faclab.web_vitals.cls')
        expect(cls.dataPoints[0].attributes['faclab.ui.route']).toBe(
            '/sales/:id'
        )
    })

    it('un vital sin entradas usa la ruta actual', async () => {
        setRoute('/home', 0)
        setRoute('/pos', 10)

        sdk.recordVital(vital('CLS', 0, []))

        const cls = await histogram('faclab.web_vitals.cls')
        expect(cls.dataPoints[0].attributes['faclab.ui.route']).toBe('/pos')
    })
})
