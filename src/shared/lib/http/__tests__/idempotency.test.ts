import { describe, it, expect, afterEach } from 'vitest'
import { newIdempotencyKey } from '../idempotency'

const UUID_V4 =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('newIdempotencyKey', () => {
    // Propia o heredada: al terminar queda como estaba
    const randomUUID = Object.getOwnPropertyDescriptor(crypto, 'randomUUID')

    afterEach(() => {
        if (randomUUID) {
            Object.defineProperty(crypto, 'randomUUID', randomUUID)
        } else {
            Reflect.deleteProperty(crypto, 'randomUUID')
        }
    })

    it('da un UUID nuevo cada vez', () => {
        const first = newIdempotencyKey()

        expect(first).toMatch(UUID_V4)
        expect(newIdempotencyKey()).not.toBe(first)
    })

    it('sin randomUUID (HTTP en la red local) lo arma con getRandomValues', () => {
        Object.defineProperty(crypto, 'randomUUID', {
            value: undefined,
            configurable: true,
        })

        const first = newIdempotencyKey()

        expect(first).toMatch(UUID_V4)
        expect(newIdempotencyKey()).not.toBe(first)
    })
})
