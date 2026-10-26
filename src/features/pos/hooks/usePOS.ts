import {
    keepPreviousData,
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query'
import * as api from '../api/client'
import { useIdempotencyKey } from '@shared/hooks/useIdempotencyKey'
import { useActiveBranch, useBoundTerminalId } from '@/stores'
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

/** Cajas activas de una sucursal; se vuelven a pedir al abrir el POS. */
export function usePosTerminals(branchId: number | null) {
    return useQuery({
        queryKey: ['pos', 'terminals', branchId],
        queryFn: async () => {
            const response = await api.getTerminals()
            return response.data
        },
        enabled: branchId !== null,
        staleTime: 0,
    })
}

/** Sucursal y caja en las que corre el POS: parte de las claves que dependen de ellas */
const usePlacementKey = () => {
    const branch = useActiveBranch()
    const terminalId = useBoundTerminalId()
    return [branch?.id ?? null, terminalId] as const
}

export function useActiveShift() {
    const placement = usePlacementKey()
    return useQuery({
        queryKey: ['pos', 'activeShift', ...placement],
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
    const placement = usePlacementKey()
    return useQuery({
        queryKey: ['pos', 'parkedSales', ...placement],
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

// Las mutaciones que crean documentos o mueven dinero envían la clave de la
// operación (`useIdempotencyKey`): la misma en cada intento hasta que sale bien

export function useQuickSale() {
    const queryClient = useQueryClient()
    const operation = useIdempotencyKey()
    return useMutation({
        mutationFn: async (data: QuickSaleInput) => {
            const response = await api.quickSale(data, operation.current())
            return response.data
        },
        onSuccess: () => {
            operation.reset()
            queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })
        },
        onError: operation.resetIfUsed,
    })
}

export function useCreateSale() {
    const operation = useIdempotencyKey()
    return useMutation({
        mutationFn: async (data: CreateSaleInput) => {
            const response = await api.createSale(data, operation.current())
            return response.data
        },
        onSuccess: operation.reset,
        onError: operation.resetIfUsed,
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
    const operation = useIdempotencyKey()
    return useMutation({
        mutationFn: async (saleId: number) => {
            const response = await api.confirmSale(saleId, operation.current())
            return response.data
        },
        onSuccess: () => {
            operation.reset()
            queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })
        },
        onError: operation.resetIfUsed,
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
    const operation = useIdempotencyKey()
    return useMutation({
        mutationFn: async ({
            saleId,
            data,
        }: {
            saleId: number
            data: PaymentInput
        }) => {
            const response = await api.addPayment(
                saleId,
                data,
                operation.current()
            )
            return response.data
        },
        onSuccess: operation.reset,
        onError: operation.resetIfUsed,
    })
}

export function useCreateRefund() {
    const operation = useIdempotencyKey()
    return useMutation({
        mutationFn: async (data: CreateRefundInput) => {
            const response = await api.createRefund(data, operation.current())
            return response.data
        },
        onSuccess: operation.reset,
        onError: operation.resetIfUsed,
    })
}

export function useProcessRefund() {
    const queryClient = useQueryClient()
    const operation = useIdempotencyKey()
    return useMutation({
        mutationFn: async ({
            refundId,
            data,
        }: {
            refundId: number
            data: ProcessRefundInput
        }) => {
            const response = await api.processRefund(
                refundId,
                data,
                operation.current()
            )
            return response.data
        },
        onSuccess: () => {
            operation.reset()
            queryClient.invalidateQueries({ queryKey: ['pos', 'products'] })
        },
        onError: operation.resetIfUsed,
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
    const operation = useIdempotencyKey()
    return useMutation({
        mutationFn: async ({
            shiftId,
            data,
        }: {
            shiftId: number
            data: CashMovementInput
        }) => {
            const response = await api.addCashMovement(
                shiftId,
                data,
                operation.current()
            )
            return response.data
        },
        onError: operation.resetIfUsed,
        onSuccess: (_, variables) => {
            operation.reset()
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
