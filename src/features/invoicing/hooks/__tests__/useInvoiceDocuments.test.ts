import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { ApiError } from '@/utils/errors/ApiError'
import { saveFile } from '@shared/lib/saveFile'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useInvoiceDocuments } from '../useInvoiceDocuments'
import { useInvoiceDeliveries } from '../useInvoicing'
import * as api from '../../api/client'
import { INVOICING_ERROR_MESSAGES } from '../../model/errors'
import type { Invoice, InvoiceDelivery } from '../../model/types'

vi.mock('../../api/client')
vi.mock('@shared/lib/saveFile', () => ({ saveFile: vi.fn() }))
vi.mock('@shared/ui/notify', () => ({
    notifyError: vi.fn(),
    notifySuccess: vi.fn(),
}))

const META = { requestId: 'req-1', timestamp: '2026-10-30T00:00:00Z' }
const ACCESS_CODE = '0910202601179214100100110010010000000011234567812'

const AUTHORIZED: Invoice = {
    id: 'inv-1',
    saleId: '7',
    accessCode: ACCESS_CODE,
    status: 'authorized',
    signatureId: 'cert-1',
    authorizationNumber: ACCESS_CODE,
    authorizedAt: '2026-10-09T15:01:02Z',
    buyerEmail: 'compras@andinas.ec',
    statusHistory: [],
    issue: null,
    attempts: 0,
    nextAttemptAt: null,
    createdAt: '2026-10-09T15:00:00Z',
    updatedAt: '2026-10-09T15:01:02Z',
}

const delivery = (
    overrides: Partial<InvoiceDelivery> = {}
): InvoiceDelivery => ({
    id: 'd-1',
    invoiceId: 'inv-1',
    kind: 'resend',
    recipient: 'compras@andinas.ec',
    status: 'pending',
    attempts: 0,
    nextAttemptAt: '2026-10-30T15:00:00Z',
    lastError: null,
    smtpResponse: null,
    sentAt: null,
    requestedBy: 'ana',
    createdAt: '2026-10-30T15:00:00Z',
    updatedAt: '2026-10-30T15:00:00Z',
    ...overrides,
})

function wrapper({ children }: { children: React.ReactNode }) {
    const qc = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => {
    vi.clearAllMocks()
})

describe('useInvoiceDocuments', () => {
    it('guarda el RIDE y el XML con la clave de acceso como nombre', async () => {
        const pdf = new Blob(['%PDF'])
        const xml = new Blob(['<autorizacion/>'])
        vi.mocked(api.downloadRide).mockResolvedValue(pdf)
        vi.mocked(api.downloadAuthorizedXml).mockResolvedValue(xml)
        const { result } = renderHook(() => useInvoiceDocuments(), { wrapper })

        await act(() => result.current.download(AUTHORIZED, 'ride'))
        await act(() => result.current.download(AUTHORIZED, 'xml'))

        expect(api.downloadRide).toHaveBeenCalledWith('inv-1')
        expect(saveFile).toHaveBeenNthCalledWith(1, pdf, `${ACCESS_CODE}.pdf`)
        expect(saveFile).toHaveBeenNthCalledWith(2, xml, `${ACCESS_CODE}.xml`)
        expect(result.current.isBusy(AUTHORIZED, 'ride')).toBe(false)
    })

    it('muestra el error de la descarga con los mensajes de facturación', async () => {
        const error = new ApiError({
            code: 'STORAGE_UNAVAILABLE',
            message: 'down',
            status: 503,
        })
        vi.mocked(api.downloadRide).mockRejectedValue(error)
        const { result } = renderHook(() => useInvoiceDocuments(), { wrapper })

        await act(() => result.current.download(AUTHORIZED, 'ride'))

        expect(saveFile).not.toHaveBeenCalled()
        expect(notifyError).toHaveBeenCalledWith(
            error,
            'No se pudo descargar el RIDE',
            { messages: INVOICING_ERROR_MESSAGES }
        )
    })

    it('reenvía al correo del comprador y lo dice', async () => {
        vi.mocked(api.resendInvoiceEmail).mockResolvedValue({
            data: delivery(),
            meta: META,
        })
        const { result } = renderHook(() => useInvoiceDocuments(), { wrapper })

        await act(() => result.current.sendAgain(AUTHORIZED))

        expect(api.resendInvoiceEmail).toHaveBeenCalledWith('inv-1')
        expect(notifySuccess).toHaveBeenCalledWith(
            'Envío en curso',
            'La factura se enviará a compras@andinas.ec.'
        )
    })

    it('explica por qué no se pudo reenviar', async () => {
        const error = new ApiError({
            code: 'BUYER_EMAIL_MISSING',
            message: 'no email',
            status: 409,
        })
        vi.mocked(api.resendInvoiceEmail).mockRejectedValue(error)
        const { result } = renderHook(() => useInvoiceDocuments(), { wrapper })

        await act(() => result.current.sendAgain(AUTHORIZED))

        expect(notifyError).toHaveBeenCalledWith(
            error,
            'No se pudo reenviar la factura',
            { messages: INVOICING_ERROR_MESSAGES }
        )
    })
})

describe('useInvoiceDeliveries', () => {
    it('trae el registro de envío de la factura', async () => {
        vi.mocked(api.getInvoiceDeliveries).mockResolvedValue({
            data: [delivery({ status: 'sent' })],
            meta: META,
        })
        const { result } = renderHook(() => useInvoiceDeliveries('inv-1'), {
            wrapper,
        })

        await waitFor(() => expect(result.current.isSuccess).toBe(true))
        expect(api.getInvoiceDeliveries).toHaveBeenCalledWith('inv-1')
        expect(result.current.data?.[0].status).toBe('sent')
    })

    it('no lo pide cuando no está habilitado', () => {
        renderHook(() => useInvoiceDeliveries('inv-1', false), { wrapper })

        expect(api.getInvoiceDeliveries).not.toHaveBeenCalled()
    })
})
