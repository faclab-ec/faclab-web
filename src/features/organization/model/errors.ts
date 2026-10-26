import type { ErrorMessages } from '@shared/lib/getErrorMessage'

// El backend responde en inglés
export const ORGANIZATION_ERROR_MESSAGES: ErrorMessages = {
    BRANCH_ESTABLISHMENT_CODE_ALREADY_EXISTS:
        'Ya existe una sucursal con ese código de establecimiento.',
    MAIN_BRANCH_ALREADY_EXISTS: 'La empresa ya tiene una matriz.',
    MAIN_BRANCH_DELETION: 'La matriz no se puede eliminar.',
    RECORD_IN_USE:
        'Está en uso (bodegas, puntos de emisión, cajas, accesos o ventas). Desactívalo en lugar de eliminarlo.',
    EMISSION_POINT_CODE_ALREADY_EXISTS:
        'La sucursal ya tiene un punto de emisión con ese código.',
    POS_TERMINAL_CODE_ALREADY_EXISTS:
        'La sucursal ya tiene una caja con ese código.',
    EMISSION_POINT_OUTSIDE_BRANCH:
        'El punto de emisión no pertenece a esta sucursal.',
    LOCATION_OUTSIDE_BRANCH:
        'La ubicación no es de una bodega de esta sucursal.',
    REFERENCE_NOT_FOUND:
        'La sucursal, el punto de emisión o la ubicación ya no existe.',
}
