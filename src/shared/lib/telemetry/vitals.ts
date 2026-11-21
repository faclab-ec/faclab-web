import type { Histogram, Meter } from '@opentelemetry/api'
import type { Metric } from 'web-vitals'
import { ATTR_UI_ROUTE, currentRoute, routeAt } from './routes'

/**
 * Web vitals como histogramas por ruta (OBSERVABILITY.md §6.3). Los límites de
 * los buckets rodean los umbrales de Google (LCP 2,5 s y 4 s; INP 200 y
 * 500 ms; CLS 0,1 y 0,25) para leer el p75 con precisión.
 */
const VITALS = {
    LCP: {
        name: 'faclab.web_vitals.lcp',
        unit: 'ms',
        description: 'Largest Contentful Paint de la carga de la aplicación',
        buckets: [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 7500, 10000],
    },
    INP: {
        name: 'faclab.web_vitals.inp',
        unit: 'ms',
        description: 'Interaction to Next Paint: la interacción más lenta',
        buckets: [50, 100, 150, 200, 300, 400, 500, 750, 1000, 2000],
    },
    CLS: {
        name: 'faclab.web_vitals.cls',
        unit: '1',
        description:
            'Cumulative Layout Shift: la mayor ventana de desplazamientos',
        buckets: [0.01, 0.05, 0.1, 0.15, 0.25, 0.5, 1],
    },
} as const

type VitalName = keyof typeof VITALS

const shift = (entry: PerformanceEntry) =>
    (entry as PerformanceEntry & { value?: number }).value ?? 0

/**
 * Instante al que se atribuye el vital: el pintado de LCP, el inicio de la
 * interacción de INP y el mayor desplazamiento de CLS.
 */
export function vitalTime(metric: Metric): number | undefined {
    const { entries } = metric
    if (entries.length === 0) {
        return undefined
    }
    if (metric.name === 'CLS') {
        return entries.reduce((max, entry) =>
            shift(entry) > shift(max) ? entry : max
        ).startTime
    }
    if (metric.name === 'INP') {
        return entries[0].startTime
    }
    return entries[entries.length - 1].startTime
}

export function vitalRoute(metric: Metric): string {
    const time = vitalTime(metric)
    return time === undefined ? currentRoute() : routeAt(time)
}

/** Crea los histogramas y devuelve la función que registra cada vital */
export function createVitalRecorder(meter: Meter): (metric: Metric) => void {
    const histograms = {} as Record<VitalName, Histogram>
    for (const [key, vital] of Object.entries(VITALS)) {
        histograms[key as VitalName] = meter.createHistogram(vital.name, {
            unit: vital.unit,
            description: vital.description,
            advice: { explicitBucketBoundaries: [...vital.buckets] },
        })
    }

    return (metric) => {
        const histogram = histograms[metric.name as VitalName]
        if (!histogram) {
            return
        }
        histogram.record(metric.value, {
            [ATTR_UI_ROUTE]: vitalRoute(metric),
            'faclab.web_vitals.rating': metric.rating,
        })
    }
}
