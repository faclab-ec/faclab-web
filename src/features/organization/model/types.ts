/** Establecimiento SRI de la empresa (código de 001 a 999) */
export interface Branch {
    id: number
    establishmentCode: string
    name: string
    /** Dirección del establecimiento: la `dirEstablecimiento` de la factura */
    address: string | null
    /** La matriz: una por empresa, no se puede eliminar */
    isMain: boolean
    isActive: boolean
}

/** Punto de emisión de una sucursal (código único en la sucursal) */
export interface EmissionPoint {
    id: number
    branchId: number
    code: string
    name: string | null
    isActive: boolean
}

/** Caja (terminal POS): emite por un punto de emisión de su sucursal y
 *  descuenta stock de una ubicación de una bodega de esa sucursal */
export interface PosTerminal {
    id: number
    branchId: number
    emissionPointId: number
    defaultLocationId: number
    code: string
    name: string
    isActive: boolean
}

export interface BranchListParams {
    isActive?: boolean
    limit?: number
    offset?: number
}

/** Puntos de emisión y cajas se listan por sucursal */
export interface BranchChildListParams {
    branchId?: number
    isActive?: boolean
    limit?: number
    offset?: number
}
