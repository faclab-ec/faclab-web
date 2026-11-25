import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    useCompanyConfig,
    useInvoicingStatus,
    useSequences,
} from '@features/invoicing'
import * as api from '../api/client'
import { buildSteps, type WizardStep } from '../model/steps'

export const ONBOARDING_KEY = ['onboarding'] as const
const CHECKLIST_KEY = [...ONBOARDING_KEY, 'checklist'] as const
const TEST_INVOICE_KEY = [...ONBOARDING_KEY, 'test-invoice'] as const

/** Mientras el SRI la procesa, se vuelve a preguntar cada pocos segundos */
export const TEST_INVOICE_POLL_MS = 3000

export const useChecklist = () =>
    useQuery({
        queryKey: CHECKLIST_KEY,
        queryFn: async () => (await api.getChecklist()).data,
        // Lo que la empresa arma en otras pantallas se ve al volver
        staleTime: 0,
    })

export const useTestInvoice = () =>
    useQuery({
        queryKey: TEST_INVOICE_KEY,
        queryFn: async () => (await api.getTestInvoice()).data,
        staleTime: 0,
        refetchInterval: (query) =>
            query.state.data?.status === 'PROCESSING'
                ? TEST_INVOICE_POLL_MS
                : false,
    })

export const useSubmitTestInvoice = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async () => (await api.submitTestInvoice()).data,
        onSuccess: (data) => {
            queryClient.setQueryData(TEST_INVOICE_KEY, data)
        },
    })
}

export const useGoLive = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: async (confirmRuc: string) =>
            (await api.goLive(confirmRuc)).data,
        onSuccess: () => {
            // El ambiente cambia el readiness, el perfil y el aviso del encabezado
            queryClient.invalidateQueries({ queryKey: ['invoicing'] })
            queryClient.invalidateQueries({ queryKey: ONBOARDING_KEY })
        },
    })
}

/** Los pasos del asistente con su estado: lo de core, lo de facturación y la prueba */
export const useWizardSteps = (): {
    steps: WizardStep[]
    isLoading: boolean
    error: unknown
    refetch: () => void
} => {
    const checklist = useChecklist()
    const config = useCompanyConfig()
    const status = useInvoicingStatus()
    const sequences = useSequences()
    const testInvoice = useTestInvoice()

    const steps = buildSteps({
        core: checklist.data,
        // Sin perfil guardado, la facturación responde 404
        config: config.isError ? null : config.data,
        invoicing: status.data,
        hasSequences: (sequences.data?.length ?? 0) > 0,
        testInvoice: testInvoice.data,
    })

    return {
        steps,
        isLoading: checklist.isLoading || status.isLoading,
        error: checklist.error ?? status.error,
        refetch: () => {
            void checklist.refetch()
            void status.refetch()
            void config.refetch()
            void sequences.refetch()
            void testInvoice.refetch()
        },
    }
}
