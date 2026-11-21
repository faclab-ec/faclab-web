/**
 * SDK de OpenTelemetry del navegador (S7.3). Se carga en un chunk aparte, solo
 * con la telemetría encendida (`index.ts`), para no pesar en la carga inicial.
 */
import { SpanStatusCode, type Span as ApiSpan } from '@opentelemetry/api'
import {
    AggregationTemporalityPreference,
    OTLPMetricExporter,
} from '@opentelemetry/exporter-metrics-otlp-http'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load'
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch'
import { XMLHttpRequestInstrumentation } from '@opentelemetry/instrumentation-xml-http-request'
import { resourceFromAttributes } from '@opentelemetry/resources'
import {
    MeterProvider,
    PeriodicExportingMetricReader,
    type IMetricReader,
} from '@opentelemetry/sdk-metrics'
import {
    BatchSpanProcessor,
    ParentBasedSampler,
    TraceIdRatioBasedSampler,
    WebTracerProvider,
    type SpanExporter,
} from '@opentelemetry/sdk-trace-web'
import {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions'
import { onCLS, onINP, onLCP, type Metric } from 'web-vitals'
import { describeError, type ErrorContext } from './errors'
import { traceHeaderTargets, urlPrefix } from './propagation'
import { RedactUrlProcessor } from './redaction'
import { ATTR_UI_ROUTE, currentRoute } from './routes'
import { createVitalRecorder } from './vitals'

const SERVICE_NAME = 'faclab-web'
const METRICS_INTERVAL_MS = 60_000

export type SdkOptions = {
    otlpUrl: string
    samplingRate: number
    environment: string
    version: string
    /** URLs del core y la facturación: las únicas que reciben `traceparent` */
    apiUrls: string[]
    /** Pruebas: exportador en memoria en lugar de OTLP */
    spanExporter?: SpanExporter
    /** Pruebas: lector de métricas en memoria en lugar del periódico */
    metricReader?: IMetricReader
    /** Pruebas: false no instrumenta XHR/fetch ni mide los vitals */
    instrument?: boolean
}

export type TelemetrySdk = {
    reportError(error: unknown, context: ErrorContext, route: string): void
    recordVital(metric: Metric): void
    forceFlush(): Promise<void>
    shutdown(): Promise<void>
}

const absolute = (url: string) =>
    new URL(url, window.location.origin).href.replace(/\/+$/, '')

export function startSdk(options: SdkOptions): TelemetrySdk {
    const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: SERVICE_NAME,
        // Todavía incubadoras en semantic-conventions: OBSERVABILITY.md §3
        'service.namespace': 'faclab',
        [ATTR_SERVICE_VERSION]: options.version,
        'deployment.environment.name': options.environment,
    })
    const otlpUrl = absolute(options.otlpUrl)

    const tracerProvider = new WebTracerProvider({
        resource,
        // Como el core (§5.3): el core y la facturación siguen esta decisión
        sampler: new ParentBasedSampler({
            root: new TraceIdRatioBasedSampler(options.samplingRate),
        }),
        spanProcessors: [
            new RedactUrlProcessor(),
            new BatchSpanProcessor(
                options.spanExporter ??
                    new OTLPTraceExporter({ url: `${otlpUrl}/v1/traces` }),
                // Cola y lotes acotados: un navegador no satura /otlp
                { maxQueueSize: 512, maxExportBatchSize: 64 }
            ),
        ],
    })
    const tracer = tracerProvider.getTracer(SERVICE_NAME, options.version)

    const meterProvider = new MeterProvider({
        resource,
        readers: [
            options.metricReader ??
                new PeriodicExportingMetricReader({
                    // Delta: cada navegador es una serie sin id de instancia;
                    // acumuladas, las de dos navegadores se pisarían
                    exporter: new OTLPMetricExporter({
                        url: `${otlpUrl}/v1/metrics`,
                        temporalityPreference:
                            AggregationTemporalityPreference.DELTA,
                    }),
                    exportIntervalMillis: METRICS_INTERVAL_MS,
                }),
        ],
    })
    const recordVitalMetric = createVitalRecorder(
        meterProvider.getMeter(SERVICE_NAME, options.version)
    )

    const recordVital = (metric: Metric) => {
        recordVitalMetric(metric)
        // Los vitals se informan casi siempre al ocultar la página: se envían
        // antes de que el navegador la descarte
        if (document.visibilityState === 'hidden') {
            void meterProvider.forceFlush()
        }
    }

    const reportError = (
        error: unknown,
        context: ErrorContext,
        route: string
    ) => {
        const { exception, attributes } = describeError(error, context)
        const span = tracer.startSpan('ui.error', {
            attributes: { ...attributes, [ATTR_UI_ROUTE]: route },
        })
        span.recordException(exception)
        span.setStatus({ code: SpanStatusCode.ERROR })
        span.end()
    }

    if (options.instrument ?? true) {
        // Propagador W3C y contexto globales: los usan fetch y XHR
        tracerProvider.register()
        const withRoute = (span: ApiSpan) => {
            span.setAttribute(ATTR_UI_ROUTE, currentRoute())
        }
        const network = {
            propagateTraceHeaderCorsUrls: traceHeaderTargets(options.apiUrls),
            // El exportador envía con fetch: sin esto cada envío se trazaría
            ignoreUrls: [urlPrefix(otlpUrl)],
            applyCustomAttributesOnSpan: withRoute,
        }
        registerInstrumentations({
            tracerProvider,
            instrumentations: [
                new DocumentLoadInstrumentation({
                    applyCustomAttributesOnSpan: {
                        documentLoad: withRoute,
                        documentFetch: withRoute,
                    },
                }),
                new XMLHttpRequestInstrumentation(network),
                new FetchInstrumentation(network),
            ],
        })
        onLCP(recordVital)
        onINP(recordVital)
        onCLS(recordVital)
    }

    return {
        reportError,
        recordVital,
        forceFlush: async () => {
            await Promise.all([
                tracerProvider.forceFlush(),
                meterProvider.forceFlush(),
            ])
        },
        shutdown: async () => {
            await Promise.all([
                tracerProvider.shutdown(),
                meterProvider.shutdown(),
            ])
        },
    }
}
