import {
    useQuery,
    useMutation,
    useQueryClient,
    keepPreviousData,
} from '@tanstack/react-query'
import * as api from '../api/client'
import type { DiscrepancyQueryParams, SaleQueryParams } from '../model/types'

const SALES_KEY = ['sales'] as const

export const useSalesList = (params?: SaleQueryParams) =>
    useQuery({
        queryKey: [...SALES_KEY, params],
        queryFn: async () => {
            const body = await api.getSales(params)
            return { items: body.data, pagination: body.meta.pagination }
        },
        placeholderData: keepPreviousData,
    })

export const useSale = (id: number) =>
    useQuery({
        queryKey: [...SALES_KEY, id],
        queryFn: async () => {
            const body = await api.getSale(id)
            return body.data
        },
        enabled: id > 0,
    })

export const useSaleItems = (saleId: number) =>
    useQuery({
        queryKey: ['saleItems', saleId],
        queryFn: async () => {
            const body = await api.getSaleItems(saleId)
            return body.data
        },
        enabled: saleId > 0,
    })

export const useSalePayments = (saleId: number) =>
    useQuery({
        queryKey: ['salePayments', saleId],
        queryFn: async () => {
            const body = await api.getSalePayments(saleId)
            return body.data
        },
        enabled: saleId > 0,
    })

export const useRequestInvoice = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (saleId: number) => {
            const body = await api.requestInvoice(saleId)
            return body.data
        },
        // faclab-invoicing picks it up from Kafka in a moment; the sale is
        // pending again and leaves the discrepancies
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['invoicing'] })
            queryClient.invalidateQueries({ queryKey: SALES_KEY })
        },
    })
}

export const useInvoiceDiscrepancies = (params?: DiscrepancyQueryParams) =>
    useQuery({
        queryKey: [...SALES_KEY, 'discrepancies', params],
        queryFn: async () => {
            const body = await api.getInvoiceDiscrepancies(params)
            return { items: body.data, pagination: body.meta.pagination }
        },
        placeholderData: keepPreviousData,
    })

export const useReviewDiscrepancy = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({ id, note }: { id: number; note?: string }) => {
            const body = await api.reviewInvoiceDiscrepancy(id, note)
            return body.data
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: SALES_KEY }),
    })
}
