import { useQuery, keepPreviousData } from '@tanstack/react-query'
import * as api from '../api/client'
import type {
    ValuationParams,
    RotationParams,
    MovementHistoryParams,
    SummaryParams,
} from '../model/types'

const KEY = ['reports'] as const

export const useValuation = (params?: ValuationParams) =>
    useQuery({
        queryKey: [...KEY, 'valuation', params],
        queryFn: async () => {
            const response = await api.getValuation(params)
            return response.data
        },
    })

export const useRotation = (params?: RotationParams) =>
    useQuery({
        queryKey: [...KEY, 'rotation', params],
        queryFn: async () => {
            const response = await api.getRotation(params)
            return response.data
        },
    })

export const useMovementHistory = (params?: MovementHistoryParams) =>
    useQuery({
        queryKey: [...KEY, 'movements', params],
        queryFn: async () => {
            const body = await api.getMovementHistory(params)
            return { items: body.data, pagination: body.meta.pagination }
        },
        placeholderData: keepPreviousData,
    })

export const useWarehouseSummary = (params?: SummaryParams) =>
    useQuery({
        queryKey: [...KEY, 'summary', params],
        queryFn: async () => {
            const response = await api.getWarehouseSummary(params)
            return response.data
        },
    })

export const useDashboard = (expiringDays = 30) =>
    useQuery({
        queryKey: [...KEY, 'dashboard', expiringDays],
        queryFn: async () => {
            const response = await api.getDashboard(expiringDays)
            return response.data
        },
    })
