import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    Movement,
    MovementInput,
    MovementListParams,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

export const validateMovement = (
    movement: MovementInput
): { valid: boolean; error?: string } => {
    if (movement.quantity === 0) {
        return { valid: false, error: 'La cantidad no puede ser cero' }
    }
    if (movement.type === 'IN' && movement.quantity < 0) {
        return {
            valid: false,
            error: 'La cantidad debe ser positiva para movimientos de entrada',
        }
    }
    if (movement.type === 'OUT' && movement.quantity > 0) {
        return {
            valid: false,
            error: 'La cantidad debe ser negativa para movimientos de salida',
        }
    }
    return { valid: true }
}

export const getMovements = (params?: MovementListParams) =>
    httpClient.get<PaginatedResponse<Movement>>(`${HOST}/movements`, { params })

export const createMovement = (movement: MovementInput) => {
    const validation = validateMovement(movement)
    if (!validation.valid) {
        throw new Error(validation.error)
    }
    return httpClient.post<DataResponse<Movement>>(
        `${HOST}/movements`,
        movement
    )
}
