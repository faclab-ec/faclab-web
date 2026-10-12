import { Server, Response } from 'miragejs'
import { singleQueryParams } from './queryParams'
import { movementData } from '../data/movementData'

export default function movementFakeApi(server: Server) {
    // GET /movements - Get movements with filters
    server.get('/movements', (schema, request) => {
        const {
            productId,
            type,
            fromDate,
            toDate,
            limit = '100',
            offset = '0',
        } = singleQueryParams(request)

        let filteredMovements = [...movementData]

        // Filter by productId if provided
        if (productId) {
            const productIdNum = parseInt(productId)
            filteredMovements = filteredMovements.filter(
                (movement) => movement.productId === productIdNum
            )
        }

        // Filter by type if provided
        if (type) {
            filteredMovements = filteredMovements.filter(
                (movement) => movement.type === type
            )
        }

        // Filter by date range if provided
        if (fromDate) {
            const fromDateTime = new Date(fromDate).getTime()
            filteredMovements = filteredMovements.filter((movement) => {
                if (!movement.date) return false
                return new Date(movement.date).getTime() >= fromDateTime
            })
        }

        if (toDate) {
            const toDateTime = new Date(toDate).getTime()
            filteredMovements = filteredMovements.filter((movement) => {
                if (!movement.date) return false
                return new Date(movement.date).getTime() <= toDateTime
            })
        }

        // Apply pagination
        const limitNum = parseInt(limit)
        const offsetNum = parseInt(offset)
        const paginatedMovements = filteredMovements.slice(
            offsetNum,
            offsetNum + limitNum
        )

        return new Response(200, {}, paginatedMovements)
    })

    // POST /movements - Create movement
    server.post('/movements', (schema, request) => {
        const attrs = JSON.parse(request.requestBody)

        // Validate quantity
        if (attrs.quantity === 0) {
            return new Response(
                400,
                {},
                { detail: 'La cantidad no puede ser cero' }
            )
        }

        // Validate type and quantity relationship
        if (attrs.type === 'in' && attrs.quantity < 0) {
            return new Response(
                400,
                {},
                {
                    detail: 'La cantidad debe ser positiva para movimientos de entrada',
                }
            )
        }

        if (attrs.type === 'out' && attrs.quantity > 0) {
            return new Response(
                400,
                {},
                {
                    detail: 'La cantidad debe ser negativa para movimientos de salida',
                }
            )
        }

        // Create new movement
        const newMovement = {
            id: movementData.length + 1,
            productId: attrs.productId,
            quantity: attrs.quantity,
            type: attrs.type,
            reason: attrs.reason || null,
            date: attrs.date || new Date().toISOString(),
        }

        movementData.push(newMovement)

        return new Response(200, {}, newMovement)
    })
}
