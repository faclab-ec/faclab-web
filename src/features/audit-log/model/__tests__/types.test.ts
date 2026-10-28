import { describe, expect, it } from 'vitest'
import { auditChanges, formatAuditValue } from '../types'

describe('auditChanges', () => {
    it('joins before and after, marking what changed', () => {
        const changes = auditChanges({
            before: { sale_price: '10.000000', name: 'Taladro' },
            after: { sale_price: '12.500000', name: 'Taladro' },
        })

        expect(changes).toEqual([
            {
                field: 'sale_price',
                label: 'Precio de venta',
                before: '10.000000',
                after: '12.500000',
                changed: true,
            },
            {
                field: 'name',
                label: 'Nombre',
                before: 'Taladro',
                after: 'Taladro',
                changed: false,
            },
        ])
    })

    it('lists the fields only after has, and keeps unknown keys', () => {
        const changes = auditChanges({
            before: { unit_price: '10' },
            after: { unit_price: '9', reason: 'Cliente', extra_field: 1 },
        })

        expect(changes.map((c) => [c.label, c.before, c.after])).toEqual([
            ['Precio unitario', '10', '9'],
            ['Motivo', undefined, 'Cliente'],
            ['extra_field', undefined, 1],
        ])
    })

    it('is empty without values', () => {
        expect(auditChanges({ before: null, after: null })).toEqual([])
    })
})

describe('formatAuditValue', () => {
    it.each([
        [undefined, '—'],
        [null, '—'],
        [true, 'Sí'],
        [false, 'No'],
        ['CANCELLED', 'CANCELLED'],
        [[1, 3], '[1,3]'],
        [{ product_id: 2, quantity: '3' }, '{"product_id":2,"quantity":"3"}'],
    ])('%j → %s', (value, text) => {
        expect(formatAuditValue(value)).toBe(text)
    })
})
