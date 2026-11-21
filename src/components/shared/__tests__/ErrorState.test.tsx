import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ApiError } from '@/utils/errors/ApiError'
import ErrorState from '../ErrorState'

describe('ErrorState', () => {
    it('muestra el id de solicitud del error', () => {
        render(
            <ErrorState
                error={
                    new ApiError({
                        code: 'INTERNAL_ERROR',
                        message: 'Error interno',
                        status: 500,
                        requestId: 'c0ffee00-0000-4000-8000-000000000003',
                    })
                }
            />
        )

        expect(screen.getByRole('alert')).toHaveTextContent('Error interno')
        expect(screen.getByText(/Id de solicitud/)).toHaveTextContent(
            'c0ffee00-0000-4000-8000-000000000003'
        )
    })

    it('sin id de solicitud no lo menciona', () => {
        render(<ErrorState error={new Error('Network Error')} />)

        expect(screen.queryByText(/Id de solicitud/)).not.toBeInTheDocument()
    })
})
