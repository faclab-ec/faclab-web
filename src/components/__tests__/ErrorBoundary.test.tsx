import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import ErrorBoundary from '../ErrorBoundary'

const { reportError } = vi.hoisted(() => ({ reportError: vi.fn() }))
vi.mock('@shared/lib/telemetry', () => ({ reportError }))

let broken = true
const Screen = () => {
    if (broken) {
        throw new TypeError('sale is undefined')
    }
    return <p>Venta V-001-000123</p>
}

describe('ErrorBoundary', () => {
    beforeEach(() => {
        broken = true
        reportError.mockReset()
        // React y el boundary escriben el error en la consola
        vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => vi.restoreAllMocks())

    it('muestra el aviso e informa el error con el stack de componentes', () => {
        render(
            <ErrorBoundary>
                <Screen />
            </ErrorBoundary>
        )

        expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal')
        expect(reportError).toHaveBeenCalledTimes(1)
        const [error, context] = reportError.mock.calls[0]
        expect(error).toEqual(new TypeError('sale is undefined'))
        expect(context.source).toBe('boundary')
        expect(context.componentStack).toContain('Screen')
    })

    it('Reintentar vuelve a mostrar la pantalla', () => {
        render(
            <ErrorBoundary>
                <Screen />
            </ErrorBoundary>
        )
        broken = false

        fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

        expect(screen.getByText('Venta V-001-000123')).toBeInTheDocument()
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
})
