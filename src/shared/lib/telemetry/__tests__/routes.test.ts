import { afterEach, describe, expect, it } from 'vitest'
import { currentRoute, resetRoutes, routeAt, setRoute } from '../routes'

describe('telemetry routes', () => {
    afterEach(() => resetRoutes())

    it('sin rutas todavía es unknown', () => {
        expect(currentRoute()).toBe('unknown')
        expect(routeAt(100)).toBe('unknown')
    })

    it('da la ruta vigente en cada instante', () => {
        setRoute('/home', 10)
        setRoute('/pos', 40)
        setRoute('/sales/:id', 100)

        expect(currentRoute()).toBe('/sales/:id')
        expect(routeAt(50)).toBe('/pos')
        expect(routeAt(40)).toBe('/pos')
        expect(routeAt(100)).toBe('/sales/:id')
        // Antes del primer cambio (el LCP de la carga): la ruta de carga
        expect(routeAt(2)).toBe('/home')
    })

    it('no repite la misma ruta', () => {
        setRoute('/pos', 10)
        setRoute('/pos', 20)
        setRoute('/home', 30)

        expect(routeAt(25)).toBe('/pos')
    })

    it('acota el historial y conserva la ruta de carga', () => {
        setRoute('/sign-in', 0)
        for (let i = 1; i <= 300; i++) {
            setRoute(i % 2 ? '/pos' : '/home', i)
        }

        expect(routeAt(0)).toBe('/sign-in')
        expect(currentRoute()).toBe('/home')
        expect(routeAt(299)).toBe('/pos')
    })
})
