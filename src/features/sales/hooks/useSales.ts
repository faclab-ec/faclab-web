import { useQuery, keepPreviousData } from '@tanstack/react-query'
import * as api from '../api/client'
import type { SaleQueryParams } from '../model/types'

const SALES_KEY = ['sales'] as const
const INVOICES_KEY = ['invoicing', 'invoices', 'by-sale'] as const

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

export const useInvoices = () =>
    useQuery({
        queryKey: ['invoicing', 'invoices'],
        queryFn: async () => {
            const body = await api.getInvoices()
            return body.data
        },
    })

export const useInvoicesBySale = (saleId: number) =>
    useQuery({
        queryKey: [...INVOICES_KEY, saleId],
        queryFn: async () => {
            const body = await api.getInvoicesBySale(saleId)
            return body.data
        },
        enabled: saleId > 0,
    })
