import { describe, expect, it } from 'vitest'
import { routePattern } from '../routePattern'

describe('routePattern', () => {
    it('da el patrón de la ruta, nunca la URL con ids', () => {
        expect(routePattern('/sales/123')).toBe('/sales/:id')
        expect(routePattern('/settings/branches/7')).toBe(
            '/settings/branches/:id'
        )
    })

    it('una ruta fija gana sobre la que tiene parámetro', () => {
        expect(routePattern('/sales/attention')).toBe('/sales/attention')
        expect(routePattern('/pos')).toBe('/pos')
        expect(routePattern('/')).toBe('/')
    })

    it('una URL que no es de la app queda como unmatched', () => {
        expect(routePattern('/no-existe/0912345678')).toBe('unmatched')
    })
})
