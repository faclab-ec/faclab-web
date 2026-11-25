import { useQuery } from '@tanstack/react-query'
import * as api from '../api/client'

export const SUBSCRIPTION_KEY = ['subscription'] as const

export const useSubscription = () =>
    useQuery({
        queryKey: SUBSCRIPTION_KEY,
        queryFn: async () => (await api.getSubscription()).data,
        // El uso cambia con cada alta y cada comprobante autorizado
        staleTime: 30_000,
    })
