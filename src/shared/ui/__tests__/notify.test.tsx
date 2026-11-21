import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { ApiError } from '@/utils/errors/ApiError'
import { notifyError } from '../notify'

const { push } = vi.hoisted(() => ({ push: vi.fn() }))
vi.mock('@/components/ui/toast', () => ({ default: { push } }))

const pushed = () =>
    push.mock.calls[0][0] as ReactElement<{
        closable?: boolean
        duration?: number
    }>

describe('notifyError', () => {
    beforeEach(() => push.mockReset())

    it('muestra el mensaje y el id de solicitud; el aviso dura más y se cierra', () => {
        notifyError(
            new ApiError({
                code: 'INSUFFICIENT_STOCK',
                message: 'No hay stock suficiente',
                status: 400,
                requestId: '3f2a9c1e-7b4d-4c2a-9e11-5d0b8a6f2c47',
            }),
            'No se pudo cobrar'
        )

        render(pushed())
        expect(screen.getByText('No hay stock suficiente')).toBeInTheDocument()
        expect(screen.getByText(/Id de solicitud/)).toHaveTextContent(
            '3f2a9c1e-7b4d-4c2a-9e11-5d0b8a6f2c47'
        )
        expect(pushed().props.closable).toBe(true)
        expect(pushed().props.duration).toBe(8000)
    })

    it('sin id de solicitud queda como antes', () => {
        notifyError(new Error('Network Error'), 'No se pudo cobrar')

        render(pushed())
        expect(screen.getByText('Network Error')).toBeInTheDocument()
        expect(screen.queryByText(/Id de solicitud/)).not.toBeInTheDocument()
        expect(pushed().props.closable).toBe(false)
        expect(pushed().props.duration).toBeUndefined()
    })
})
