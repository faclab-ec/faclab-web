import { describe, it, expect } from 'vitest'
import { ApiError } from '@/utils/errors/ApiError'
import { isTerminalUnavailable, posErrorMessage } from '../errors'
import { saleLabel } from '../../lib/saleLabel'

const apiError = (code: string, message = 'in English') =>
    new ApiError({ code, message, status: 409 })

describe('isTerminalUnavailable', () => {
    it('detects a terminal the backend no longer accepts', () => {
        for (const code of [
            'POS_TERMINAL_INACTIVE',
            'POS_TERMINAL_OUTSIDE_BRANCH',
            'BRANCH_INACTIVE',
            'TERMINAL_REQUIRED',
            'NOT_FOUND',
        ]) {
            expect(isTerminalUnavailable(apiError(code))).toBe(true)
        }
    })

    it('ignores other errors', () => {
        expect(isTerminalUnavailable(apiError('SHIFT_ALREADY_OPEN'))).toBe(
            false
        )
        expect(isTerminalUnavailable(new Error('offline'))).toBe(false)
        expect(isTerminalUnavailable(undefined)).toBe(false)
    })
})

describe('posErrorMessage', () => {
    it('translates what the cashier sees', () => {
        expect(posErrorMessage(apiError('SHIFT_ALREADY_OPEN'), 'x')).toBe(
            'Ya hay un turno abierto en esta caja.'
        )
    })

    it('keeps the backend message or the fallback otherwise', () => {
        expect(posErrorMessage(apiError('OTHER', 'Detalle'), 'x')).toBe(
            'Detalle'
        )
        expect(posErrorMessage(undefined, 'No se pudo')).toBe('No se pudo')
    })
})

describe('saleLabel', () => {
    it('prefers the branch number over the id', () => {
        expect(saleLabel({ id: 9, number: 'V-001-000123' })).toBe(
            'V-001-000123'
        )
        expect(saleLabel({ id: 9, number: null })).toBe('#9')
    })
})
