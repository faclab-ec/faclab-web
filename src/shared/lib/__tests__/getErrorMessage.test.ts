import { describe, expect, it } from 'vitest'
import { AxiosError, type AxiosResponse } from 'axios'
import { ApiError } from '@/utils/errors/ApiError'
import { getErrorRequestId } from '../getErrorMessage'

describe('getErrorRequestId', () => {
    it('lo toma de un ApiError', () => {
        const error = new ApiError({
            code: 'NOT_FOUND',
            message: 'Not found',
            status: 404,
            requestId: 'req-1',
        })
        expect(getErrorRequestId(error)).toBe('req-1')
    })

    it('lo toma del envelope de un AxiosError sin convertir', () => {
        const error = new AxiosError('Request failed', 'ERR_BAD_RESPONSE')
        error.response = {
            status: 500,
            data: { errors: [], meta: { requestId: 'req-2' } },
        } as AxiosResponse
        expect(getErrorRequestId(error)).toBe('req-2')
    })

    it('no hay id en un error de red ni en otros errores', () => {
        expect(
            getErrorRequestId(
                new ApiError({ code: 'ERR_NETWORK', message: 'x', status: 0 })
            )
        ).toBeUndefined()
        expect(getErrorRequestId(new Error('x'))).toBeUndefined()
        expect(getErrorRequestId('x')).toBeUndefined()
    })
})
