import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TelemetryConfig } from '@/configs/app.config'
import { resetRoutes, setRoute } from '../routes'
import { reportError, startTelemetry, stopTelemetry } from '../index'

const { startSdk } = vi.hoisted(() => ({ startSdk: vi.fn() }))
vi.mock('../sdk', () => ({ startSdk }))

const ON: TelemetryConfig = {
    enabled: true,
    otlpUrl: '/otlp',
    samplingRate: 1,
    environment: 'local',
}

// Vitest (jsdom) vuelve excepción no capturada un evento `error` sin oyentes:
// uno vacío lo evita cuando la telemetría está apagada
const fireWindowError = (error: unknown, message = '') => {
    const listener = () => {}
    window.addEventListener('error', listener)
    window.dispatchEvent(new ErrorEvent('error', { error, message }))
    window.removeEventListener('error', listener)
}

const fireRejection = (reason: unknown) =>
    window.dispatchEvent(
        Object.assign(new Event('unhandledrejection'), { reason })
    )

describe('telemetry', () => {
    let reporter: ReturnType<typeof vi.fn>

    beforeEach(() => {
        reporter = vi.fn()
        startSdk.mockReset()
        startSdk.mockReturnValue({ reportError: reporter })
    })

    afterEach(() => {
        stopTelemetry()
        resetRoutes()
    })

    it('apagada no carga el SDK ni informa nada', async () => {
        await startTelemetry({ ...ON, enabled: false })

        reportError(new Error('boom'), { source: 'boundary' })
        fireWindowError(new Error('boom'))

        expect(startSdk).not.toHaveBeenCalled()
        expect(reporter).not.toHaveBeenCalled()
    })

    it('carga el SDK con la versión y las URLs de las APIs', async () => {
        await startTelemetry(ON)

        expect(startSdk).toHaveBeenCalledWith(
            expect.objectContaining({
                otlpUrl: '/otlp',
                samplingRate: 1,
                environment: 'local',
                version: __APP_VERSION__,
                apiUrls: [expect.any(String), expect.any(String)],
            })
        )
    })

    it('guarda los errores que llegan mientras carga el SDK, con su ruta', async () => {
        setRoute('/pos', 0)
        const started = startTelemetry(ON)
        const error = new Error('antes del SDK')
        reportError(error, { source: 'boundary', componentStack: 'at X' })
        setRoute('/home', 1)

        await started

        expect(reporter).toHaveBeenCalledWith(
            error,
            { source: 'boundary', componentStack: 'at X' },
            '/pos'
        )
    })

    it('informa los errores no controlados de window', async () => {
        setRoute('/sales/:id', 0)
        await startTelemetry(ON)
        const error = new Error('no controlado')

        fireWindowError(error)
        fireRejection('rechazo')

        expect(reporter).toHaveBeenCalledWith(
            error,
            { source: 'window' },
            '/sales/:id'
        )
        expect(reporter).toHaveBeenCalledWith(
            'rechazo',
            { source: 'unhandledrejection' },
            '/sales/:id'
        )
    })

    it('sin Error en el evento usa su mensaje e ignora el ruido de ResizeObserver', async () => {
        await startTelemetry(ON)

        fireWindowError(
            null,
            'ResizeObserver loop completed with undelivered notifications.'
        )
        fireWindowError(null, 'Script error.')

        expect(reporter).toHaveBeenCalledTimes(1)
        expect(reporter.mock.calls[0][0]).toEqual(new Error('Script error.'))
    })

    it('si el SDK falla al cargar se apaga sin romper la app', async () => {
        startSdk.mockImplementation(() => {
            throw new Error('chunk perdido')
        })

        await expect(startTelemetry(ON)).resolves.toBeUndefined()
        fireWindowError(new Error('después'))

        expect(reporter).not.toHaveBeenCalled()
    })

    it('arranca una sola vez', async () => {
        await startTelemetry(ON)
        await startTelemetry(ON)

        expect(startSdk).toHaveBeenCalledTimes(1)
    })
})
