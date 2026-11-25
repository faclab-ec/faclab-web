import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/client'
import { usePlatformStore } from '../store/usePlatformStore'
import type {
    ChangeSubscriptionInput,
    CreateTenantInput,
    TenantStatus,
} from '../model/types'

export const PLATFORM_KEY = ['platform'] as const

export const usePlatformLogin = () => {
    const signIn = usePlatformStore((state) => state.signIn)
    return useMutation({
        mutationFn: async (values: { username: string; password: string }) =>
            (await api.platformLogin(values.username, values.password)).data,
        onSuccess: (data) =>
            signIn({
                accessToken: data.accessToken,
                expiresIn: data.expiresIn,
                displayName: data.displayName,
            }),
    })
}

export const usePlatformSignOut = () => {
    const queryClient = useQueryClient()
    const clear = usePlatformStore((state) => state.clear)
    return () => {
        clear()
        queryClient.removeQueries({ queryKey: PLATFORM_KEY })
    }
}

export const useTenants = (filters: {
    q?: string
    status?: TenantStatus
    limit: number
    offset: number
}) =>
    useQuery({
        queryKey: [...PLATFORM_KEY, 'tenants', filters],
        queryFn: async () => (await api.listTenants(filters)).data,
    })

export const useTenant = (id: string | undefined) =>
    useQuery({
        queryKey: [...PLATFORM_KEY, 'tenant', id],
        queryFn: async () => (await api.getTenant(id!)).data,
        enabled: !!id,
    })

export const usePlans = () =>
    useQuery({
        queryKey: [...PLATFORM_KEY, 'plans'],
        queryFn: async () => (await api.listPlans()).data,
        staleTime: 60_000,
    })

const useInvalidate = () => {
    const queryClient = useQueryClient()
    return () => queryClient.invalidateQueries({ queryKey: PLATFORM_KEY })
}

export const useCreateTenant = () => {
    const invalidate = useInvalidate()
    return useMutation({
        mutationFn: async (body: CreateTenantInput) =>
            (await api.createTenant(body)).data,
        onSuccess: invalidate,
    })
}

export const useSuspendTenant = () => {
    const invalidate = useInvalidate()
    return useMutation({
        mutationFn: async (values: { id: string; reason?: string }) =>
            (await api.suspendTenant(values.id, values.reason)).data,
        onSuccess: invalidate,
    })
}

export const useActivateTenant = () => {
    const invalidate = useInvalidate()
    return useMutation({
        mutationFn: async (id: string) => (await api.activateTenant(id)).data,
        onSuccess: invalidate,
    })
}

export const useChangeSubscription = () => {
    const invalidate = useInvalidate()
    return useMutation({
        mutationFn: async (values: {
            id: string
            body: ChangeSubscriptionInput
        }) => (await api.changeSubscription(values.id, values.body)).data,
        onSuccess: invalidate,
    })
}
