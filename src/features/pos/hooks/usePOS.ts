import {
    keepPreviousData,
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query'
import * as api from '../api/client'
import type {
    OpenShiftInput,
    CloseShiftInput,
    QuickSaleInput,
    CreateSaleInput,
    AddSaleItemInput,
    UpdateSaleItemInput,
    SaleDiscountInput,
    PriceOverrideInput,
    PaymentInput,
    CreateRefundInput,
    ProcessRefundInput,
    CashMovementInput,
    QuickCustomerInput,
    RefundListParams,
    ShiftListParams,
} from '../model/types'

// === QUERIES ===

export function useActiveShift() {
    return useQuery({
        queryKey: ['pos', 'activeShift'],
        queryFn: async () => {
            const response = await api.getActiveShift()
            return response.data
        },
    })
}

export function usePOSProducts() {
    return useQuery({
        queryKey: ['pos', 'products'],
        queryFn: async () => {
            const response = await api.getProducts()
            return response.data
        },
    })
}

export function usePOSSearchProducts(term: string) {
    return useQuery({
        queryKey: ['pos', 'products', 'search', term],
        queryFn: async () => {
            const response = await api.searchProducts(term)
            return response.data
        },
        enabled: term.length >= 2,
    })
}

export function useParkedSales() {
    return useQuery({
        queryKey: ['pos', 'parkedSales'],
        queryFn: async () => {
            const response = await api.getParkedSales()
            return response.data
        },
    })
}

export function useReceipt(saleId: number) {
    return useQuery({
        queryKey: ['pos', 'receipt', saleId],
        queryFn: async () => {
            const response = await api.getReceipt(saleId)
            return response.data
        },
        enabled: saleId > 0,
    })
}

export function useCashSummary(shiftId: number) {
    return useQuery({
        queryKey: ['pos', 'cashSummary', shiftId],
        queryFn: async () => {
            const response = await api.getCashSummary(shiftId)
            return response.data
        },
        enabled: shiftId > 0,
    })
}

export function useXReport(shiftId: number) {
    return useQuery({
        queryKey: ['pos', 'xReport', shiftId],
        queryFn: async () => {
            const response = await api.getXReport(shiftId)
            return response.data
        },
        enabled: shiftId > 0,
    })
}

export function useZReport(shiftId: number) {
    return useQuery({
        queryKey: ['pos', 'zReport', shiftId],
        queryFn: async () => {
            const response = await api.getZReport(shiftId)
            return response.data
        },
        enabled: shiftId > 0,
    })
}

export function useDailyReport(date: string) {
    return useQuery({
        queryKey: ['pos', 'dailyReport', date],
        queryFn: async () => {
            const response = await api.getDailyReport(date)
            return response.data
        },
        enabled: !!date,
    })
}

export function useByPaymentMethodReport(fromDate: string, toDate: string) {
    return useQuery({
        queryKey: ['pos', 'byPaymentMethod', fromDate, toDate],
        queryFn: async () => {
            const response = await api.getByPaymentMethod(fromDate, toDate)
            return response.data
        },
        enabled: !!fromDate && !!toDate,
    })
}

// Shift and refund history, read from the back office (report:pos:read)
export function useShifts(params: ShiftListParams) {
    return useQuery({
        queryKey: ['pos', 'shifts', params],
        queryFn: async () => {
            const response = await api.getShifts(params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
        placeholderData: keepPreviousData,
    })
}

export function useShift(id: number) {
    return useQuery({
        queryKey: ['pos', 'shift', id],
        queryFn: async () => {
            const response = await api.getShift(id)
            return response.data
        },
        enabled: id > 0,
    })
}

export function useRefunds(params: RefundListParams) {
    return useQuery({
        queryKey: ['pos', 'refunds', params],
        queryFn: async () => {
            const response = await api.getRefunds(params)
            return {
                items: response.data,
                pagination: response.meta.pagination,
            }
        },
        placeholderData: keepPreviousData,
    })
}

export function usePOSCustomerSearch(taxId: string) {
    return useQuery({
        queryKey: ['pos', 'customers', 'search', taxId],
        queryFn: async () => {
            const response = await api.searchCustomerByTaxId(taxId)
            return response.data
        },
        enabled: taxId.length >= 5,
    })
}

// === MUTATIONS ===

export function useOpenShift() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: OpenShiftInput) => {
            const response = await api.openShift(data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'activeShift'] })
        },
    })
}

export function useCloseShift() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            shiftId,
            data,
        }: {
            shiftId: number
            data: CloseShiftInput
        }) => {
            const response = await api.closeShift(shiftId, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'activeShift'] })
        },
    })
}

export function useQuickSale() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (data: QuickSaleInput) => {
            const response = await api.quickSale(data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })
        },
    })
}

export function useCreateSale() {
    return useMutation({
        mutationFn: async (data: CreateSaleInput) => {
            const response = await api.createSale(data)
            return response.data
        },
    })
}

export function useAddSaleItem() {
    return useMutation({
        mutationFn: async ({
            saleId,
            data,
        }: {
            saleId: number
            data: AddSaleItemInput
        }) => {
            const response = await api.addSaleItem(saleId, data)
            return response.data
        },
    })
}

export function useUpdateSaleItem() {
    return useMutation({
        mutationFn: async ({
            saleId,
            itemId,
            data,
        }: {
            saleId: number
            itemId: number
            data: UpdateSaleItemInput
        }) => {
            const response = await api.updateSaleItem(saleId, itemId, data)
            return response.data
        },
    })
}

export function useDeleteSaleItem() {
    return useMutation({
        mutationFn: async ({
            saleId,
            itemId,
        }: {
            saleId: number
            itemId: number
        }) => {
            await api.deleteSaleItem(saleId, itemId)
        },
    })
}

export function useApplySaleDiscount() {
    return useMutation({
        mutationFn: async ({
            saleId,
            data,
        }: {
            saleId: number
            data: SaleDiscountInput
        }) => {
            const response = await api.applySaleDiscount(saleId, data)
            return response.data
        },
    })
}

export function useOverrideItemPrice() {
    return useMutation({
        mutationFn: async ({
            saleId,
            itemId,
            data,
        }: {
            saleId: number
            itemId: number
            data: PriceOverrideInput
        }) => {
            const response = await api.overrideItemPrice(saleId, itemId, data)
            return response.data
        },
    })
}

export function useConfirmSale() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (saleId: number) => {
            const response = await api.confirmSale(saleId)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })
        },
    })
}

export function useParkSale() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            saleId,
            reason,
        }: {
            saleId: number
            reason?: string
        }) => {
            const response = await api.parkSale(saleId, reason)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['pos', 'parkedSales'],
            })
        },
    })
}

export function useResumeSale() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (saleId: number) => {
            const response = await api.resumeSale(saleId)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['pos', 'parkedSales'],
            })
        },
    })
}

export function useCancelSale() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            saleId,
            reason,
        }: {
            saleId: number
            reason?: string
        }) => {
            const response = await api.cancelSale(saleId, reason)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })
            queryClient.invalidateQueries({
                queryKey: ['pos', 'parkedSales'],
            })
        },
    })
}

export function useAddPayment() {
    return useMutation({
        mutationFn: async ({
            saleId,
            data,
        }: {
            saleId: number
            data: PaymentInput
        }) => {
            const response = await api.addPayment(saleId, data)
            return response.data
        },
    })
}

export function useCreateRefund() {
    return useMutation({
        mutationFn: async (data: CreateRefundInput) => {
            const response = await api.createRefund(data)
            return response.data
        },
    })
}

export function useProcessRefund() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            refundId,
            data,
        }: {
            refundId: number
            data: ProcessRefundInput
        }) => {
            const response = await api.processRefund(refundId, data)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })
        },
    })
}

export function useCancelRefund() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (refundId: number) => {
            const response = await api.cancelRefund(refundId)
            return response.data
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pos', 'refunds'] })
        },
    })
}

export function useAddCashMovement() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async ({
            shiftId,
            data,
        }: {
            shiftId: number
            data: CashMovementInput
        }) => {
            const response = await api.addCashMovement(shiftId, data)
            return response.data
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['pos', 'cashSummary', variables.shiftId],
            })
        },
    })
}

export function useQuickCreateCustomer() {
    return useMutation({
        mutationFn: async (data: QuickCustomerInput) => {
            const response = await api.quickCreateCustomer(data)
            return response.data
        },
    })
}
