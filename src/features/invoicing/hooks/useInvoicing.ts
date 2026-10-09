import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { isApiError } from '@/utils/errors/ApiError'
import { useCan } from '@/stores'
import * as api from '../api/client'
import type { CompanyConfigInput } from '../model/types'

// Everything faclab-invoicing serves lives under this key: a change to the
// config or the certificates, or a retry, refreshes status and invoices too
const INVOICING_KEY = ['invoicing'] as const
const STATUS_KEY = [...INVOICING_KEY, 'status'] as const
const INVOICES_KEY = [...INVOICING_KEY, 'invoices'] as const

/**
 * Whether the issuer can invoice. Every role can read it (`sale:read`); it is
 * refreshed every few minutes so a POS left open notices changes.
 */
export function useInvoicingStatus() {
    const canRead = useCan('sale:read')
    return useQuery({
        queryKey: STATUS_KEY,
        queryFn: async () => {
            const response = await api.getInvoicingStatus()
            return response.data
        },
        enabled: canRead,
        staleTime: 60_000,
        refetchInterval: 5 * 60_000,
    })
}

export function useInvoices(params?: { attention?: boolean }) {
    const attention = params?.attention ?? false
    return useQuery({
        queryKey: [...INVOICES_KEY, { attention }],
        queryFn: async () => {
            const response = await api.getInvoices({ attention })
            return response.data
        },
    })
}

export function useInvoicesBySale(saleId: string | number | undefined) {
    return useQuery({
        queryKey: [...INVOICES_KEY, 'by-sale', String(saleId)],
        queryFn: async () => {
            const response = await api.getInvoicesBySale(
                saleId as string | number
            )
            return response.data
        },
        enabled: saleId != null,
    })
}

export function useRetryInvoice() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (id: string) => {
            const response = await api.retryInvoice(id)
            return response.data
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: INVOICING_KEY }),
    })
}

export function useRetryInvoices() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async () => {
            const response = await api.retryInvoices()
            return response.data.queued
        },
        onSettled: () =>
            queryClient.invalidateQueries({ queryKey: INVOICING_KEY }),
    })
}

export function useCertificates() {
    return useQuery({
        queryKey: [...INVOICING_KEY, 'certificates'],
        queryFn: async () => {
            const response = await api.getCertificates()
            return response.data
        },
    })
}

export function useUploadCertificate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            file,
            password,
        }: {
            file: File
            password: string
        }) => {
            const response = await api.uploadCertificate(file, password)
            return response.data
        },
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: INVOICING_KEY }),
    })
}

export function useDeleteCertificate() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => api.deleteCertificate(id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: INVOICING_KEY }),
    })
}

export function useCompanyConfig() {
    return useQuery({
        queryKey: [...INVOICING_KEY, 'company-config'],
        queryFn: async () => {
            const response = await api.getCompanyConfig()
            return response.data
        },
        retry: (failureCount, error: unknown) => {
            if (isApiError(error) && error.status === 404) return false
            return failureCount < 2
        },
    })
}

export function useUpdateCompanyConfig() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: CompanyConfigInput) => {
            const response = await api.updateCompanyConfig(data)
            return response.data
        },
        // Saving resumes pending invoices: refresh status and lists too
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: INVOICING_KEY }),
    })
}
