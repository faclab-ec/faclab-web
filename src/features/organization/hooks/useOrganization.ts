import {
    keepPreviousData,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import { ME_QUERY_KEY } from '@features/auth'
import * as api from '../api/client'
import type {
    BranchInput,
    EmissionPointInput,
    PosTerminalInput,
} from '../api/client'
import type { BranchChildListParams, BranchListParams } from '../model/types'

const KEY = ['organization'] as const

// --- Branches ---

export const useBranchesList = (params?: BranchListParams) =>
    useQuery({
        queryKey: [...KEY, 'branches', params],
        queryFn: async () => {
            const response = await api.getBranches(params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
        placeholderData: keepPreviousData,
    })

export const useBranch = (id: number) =>
    useQuery({
        queryKey: [...KEY, 'branches', id],
        queryFn: async () => (await api.getBranch(id)).data,
        enabled: id > 0,
    })

export const useBranchMutations = () => {
    const qc = useQueryClient()
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: KEY })
        // Las sucursales a las que se puede entrar (selector) vienen de /me
        qc.invalidateQueries({ queryKey: ME_QUERY_KEY })
    }

    return {
        create: useMutation({
            mutationFn: (data: BranchInput) =>
                api.createBranch(data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        update: useMutation({
            mutationFn: ({ id, data }: { id: number; data: BranchInput }) =>
                api.updateBranch(id, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        delete: useMutation({
            mutationFn: (id: number) => api.deleteBranch(id),
            onSuccess: invalidate,
        }),
    }
}

// --- Emission points ---

export const useEmissionPointsList = (params?: BranchChildListParams) =>
    useQuery({
        queryKey: [...KEY, 'emissionPoints', params],
        queryFn: async () => {
            const response = await api.getEmissionPoints(params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
    })

export const useEmissionPointMutations = (branchId: number) => {
    const qc = useQueryClient()
    const invalidate = () => qc.invalidateQueries({ queryKey: KEY })

    return {
        create: useMutation({
            mutationFn: (data: EmissionPointInput) =>
                api.createEmissionPoint(branchId, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        update: useMutation({
            mutationFn: ({
                id,
                data,
            }: {
                id: number
                data: EmissionPointInput
            }) => api.updateEmissionPoint(id, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        delete: useMutation({
            mutationFn: (id: number) => api.deleteEmissionPoint(id),
            onSuccess: invalidate,
        }),
    }
}

// --- POS terminals ---

export const usePosTerminalsList = (params?: BranchChildListParams) =>
    useQuery({
        queryKey: [...KEY, 'posTerminals', params],
        queryFn: async () => {
            const response = await api.getPosTerminals(params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
    })

export const usePosTerminalMutations = (branchId: number) => {
    const qc = useQueryClient()
    const invalidate = () => {
        qc.invalidateQueries({ queryKey: KEY })
        // Las cajas que ofrece el POS
        qc.invalidateQueries({ queryKey: ['pos', 'terminals'] })
    }

    return {
        create: useMutation({
            mutationFn: (data: PosTerminalInput) =>
                api.createPosTerminal(branchId, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        update: useMutation({
            mutationFn: ({
                id,
                data,
            }: {
                id: number
                data: PosTerminalInput
            }) => api.updatePosTerminal(id, data).then((r) => r.data),
            onSuccess: invalidate,
        }),
        delete: useMutation({
            mutationFn: (id: number) => api.deletePosTerminal(id),
            onSuccess: invalidate,
        }),
    }
}
