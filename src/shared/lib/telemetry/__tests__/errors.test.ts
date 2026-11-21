import { describe, expect, it } from 'vitest'
import { ApiError } from '@/utils/errors/ApiError'
import { describeError } from '../errors'

describe('describeError', () => {
    it('de un Error toma tipo, mensaje y stack', () => {
        const error = new TypeError(
            "Cannot read properties of undefined (reading 'id')"
        )

        const report = describeError(error, { source: 'window' })

        expect(report.exception.name).toBe('TypeError')
        expect(report.exception.message).toBe(error.message)
        expect(report.exception.stack).toContain('TypeError')
        expect(report.attributes).toEqual({
            'faclab.error.source': 'window',
            'error.type': 'TypeError',
        })
    })

    it('de un ApiError no envía el mensaje del servidor', () => {
        const error = new ApiError({
            code: 'CUSTOMER_ALREADY_EXISTS',
            message: 'Customer with tax id 0912345678001 already exists',
            status: 409,
            requestId: 'c0ffee00-0000-4000-8000-000000000001',
        })

        const report = describeError(error, { source: 'unhandledrejection' })

        expect(report.exception.name).toBe('ApiError')
        expect(report.exception.message).toBe('CUSTOMER_ALREADY_EXISTS')
        expect(report.exception.stack).toMatch(
            /^ApiError: CUSTOMER_ALREADY_EXISTS\n/
        )
        expect(report.attributes).toEqual({
            'faclab.error.source': 'unhandledrejection',
            'error.type': 'CUSTOMER_ALREADY_EXISTS',
            'faclab.error.code': 'CUSTOMER_ALREADY_EXISTS',
            'http.response.status_code': 409,
            'http.request.id': 'c0ffee00-0000-4000-8000-000000000001',
        })
        expect(JSON.stringify(report)).not.toContain('0912345678001')
    })

    it('un ApiError de red no lleva estado ni id', () => {
        const error = new ApiError({
            code: 'ERR_NETWORK',
            message: 'Network Error',
            status: 0,
        })

        const { attributes } = describeError(error, { source: 'window' })

        expect(attributes).not.toHaveProperty('http.response.status_code')
        expect(attributes).not.toHaveProperty('http.request.id')
    })

    it('agrega el stack de componentes del ErrorBoundary, recortado', () => {
        const componentStack = `\n    at Broken\n    at ErrorBoundary${' x'.repeat(
            2000
        )}`

        const { attributes } = describeError(new Error('boom'), {
            source: 'boundary',
            componentStack,
        })

        const stack = attributes['faclab.react.component_stack'] as string
        expect(stack.startsWith('at Broken')).toBe(true)
        expect(stack.length).toBeLessThanOrEqual(2001)
    })

    it('recorta los mensajes largos', () => {
        const { exception } = describeError(new Error('x'.repeat(5000)), {
            source: 'window',
        })
        expect(exception.message.length).toBe(501)
    })

    it('un valor que no es Error se describe por su tipo', () => {
        expect(
            describeError('se rompió', { source: 'unhandledrejection' })
                .exception
        ).toEqual({ name: 'string', message: 'se rompió' })
        expect(
            describeError(
                { token: 'secreto' },
                { source: 'unhandledrejection' }
            ).exception
        ).toEqual({ name: 'object', message: 'Non-Error object thrown' })
    })
})
