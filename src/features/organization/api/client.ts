import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { DataResponse, PaginatedResponse } from '@/@types/api'
import type {
    Branch,
    BranchChildListParams,
    BranchListParams,
    EmissionPoint,
    PosTerminal,
} from '../model/types'

const HOST = appConfig.inventoryApiHost

// Los PUT reemplazan el registro completo (`isActive` incluido). La sucursal
// de un punto de emisión o de una caja se fija al crearlo.

export type BranchInput = {
    establishmentCode: string
    name: string
    address: string | null
    isActive: boolean
}

export type EmissionPointInput = {
    code: string
    name: string | null
    isActive: boolean
}

export type PosTerminalInput = {
    emissionPointId: number
    defaultLocationId: number
    code: string
    name: string
    isActive: boolean
}

// --- Branches ---

export const getBranches = (params?: BranchListParams) =>
    httpClient.get<PaginatedResponse<Branch>>(`${HOST}/branches`, { params })

export const getBranch = (id: number) =>
    httpClient.get<DataResponse<Branch>>(`${HOST}/branches/${id}`)

export const createBranch = (data: BranchInput) =>
    httpClient.post<DataResponse<Branch>>(`${HOST}/branches`, data)

export const updateBranch = (id: number, data: BranchInput) =>
    httpClient.put<DataResponse<Branch>>(`${HOST}/branches/${id}`, data)

export const deleteBranch = (id: number) =>
    httpClient.delete(`${HOST}/branches/${id}`)

// --- Emission points ---

export const getEmissionPoints = (params?: BranchChildListParams) =>
    httpClient.get<PaginatedResponse<EmissionPoint>>(
        `${HOST}/emission-points`,
        { params }
    )

export const createEmissionPoint = (
    branchId: number,
    data: EmissionPointInput
) =>
    httpClient.post<DataResponse<EmissionPoint>>(`${HOST}/emission-points`, {
        ...data,
        branchId,
    })

export const updateEmissionPoint = (id: number, data: EmissionPointInput) =>
    httpClient.put<DataResponse<EmissionPoint>>(
        `${HOST}/emission-points/${id}`,
        data
    )

export const deleteEmissionPoint = (id: number) =>
    httpClient.delete(`${HOST}/emission-points/${id}`)

// --- POS terminals ---

export const getPosTerminals = (params?: BranchChildListParams) =>
    httpClient.get<PaginatedResponse<PosTerminal>>(`${HOST}/pos-terminals`, {
        params,
    })

export const createPosTerminal = (branchId: number, data: PosTerminalInput) =>
    httpClient.post<DataResponse<PosTerminal>>(`${HOST}/pos-terminals`, {
        ...data,
        branchId,
    })

export const updatePosTerminal = (id: number, data: PosTerminalInput) =>
    httpClient.put<DataResponse<PosTerminal>>(
        `${HOST}/pos-terminals/${id}`,
        data
    )

export const deletePosTerminal = (id: number) =>
    httpClient.delete(`${HOST}/pos-terminals/${id}`)
