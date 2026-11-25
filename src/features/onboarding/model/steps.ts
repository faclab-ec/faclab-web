import type { CompanyConfig, InvoicingStatus } from '@features/invoicing'
import type { CoreChecklist, TestInvoice } from './types'

export type StepKey =
    | 'fiscal-profile'
    | 'certificate'
    | 'branches'
    | 'terminals'
    | 'users'
    | 'import'
    | 'sequences'
    | 'verification'
    | 'production'

export type StepState = 'done' | 'pending' | 'blocked'

export interface WizardStep {
    key: StepKey
    title: string
    description: string
    state: StepState
    /** No hace falta para facturar */
    optional: boolean
    /** Pantalla donde se hace, si ya existe */
    path?: string
    /** Por qué todavía no se puede hacer */
    blockedBy?: string
}

export interface StepsInput {
    /** Lo de faclab-core; sin dato mientras carga */
    core: CoreChecklist | undefined
    /** El perfil fiscal; null cuando la empresa no lo ha guardado */
    config: CompanyConfig | null | undefined
    invoicing: InvoicingStatus | undefined
    /** Contadores ya fijados en faclab-invoicing */
    hasSequences: boolean
    testInvoice: TestInvoice | undefined
}

const coreStep = (core: CoreChecklist | undefined, key: string) =>
    core?.steps.find((step) => step.key === key)

/** El certificado está si el estado lo trae y nada del certificado falla */
const certificateReady = (invoicing: InvoicingStatus | undefined): boolean =>
    !!invoicing?.certificate &&
    !invoicing.issues.some(
        (issue) =>
            issue.severity === 'error' && issue.code.startsWith('CERTIFICATE_')
    )

/**
 * Los pasos del asistente con su estado, calculados de lo que la empresa ya
 * tiene (nada se guarda aparte): se puede dejar y retomar cuando se quiera, y
 * un paso hecho fuera del asistente cuenta como hecho.
 */
export const buildSteps = ({
    core,
    config,
    invoicing,
    hasSequences,
    testInvoice,
}: StepsInput): WizardStep[] => {
    const hasProfile = !!config
    const hasCertificate = certificateReady(invoicing)
    const branchesDone =
        !!coreStep(core, 'branches')?.done &&
        !!coreStep(core, 'emission_points')?.done
    const ready = !!invoicing?.ready
    const inProduction = invoicing?.environment === 2
    const tested = testInvoice?.status === 'AUTHORIZED'

    const state = (done: boolean, blockedBy?: string): StepState =>
        done ? 'done' : blockedBy ? 'blocked' : 'pending'

    const fiscalBlock = hasProfile ? undefined : 'Primero el perfil fiscal'

    return [
        {
            key: 'fiscal-profile',
            title: 'Perfil fiscal',
            description:
                'RUC, razón social, dirección de la matriz y régimen de la empresa.',
            state: state(hasProfile),
            optional: false,
            path: '/settings/company-config',
        },
        {
            key: 'certificate',
            title: 'Certificado de firma',
            description:
                'El archivo .p12 con el que se firman las facturas. Debe ser del RUC de la empresa.',
            state: state(hasCertificate, fiscalBlock),
            optional: false,
            path: '/settings/certificates',
            blockedBy: fiscalBlock,
        },
        {
            key: 'branches',
            title: 'Sucursales y puntos de emisión',
            description:
                'Cada establecimiento del SRI con sus puntos de emisión. La matriz 001 ya viene creada.',
            state: state(branchesDone),
            optional: false,
            path: '/settings/branches',
        },
        {
            key: 'terminals',
            title: 'Cajas del punto de venta',
            description:
                'Las terminales con las que se cobra en cada sucursal.',
            state: state(!!coreStep(core, 'terminals')?.done),
            optional: false,
            path: '/settings/branches',
        },
        {
            key: 'users',
            title: 'Usuarios',
            description:
                'Cajeros, gerentes y quienes más trabajan en el sistema. Puedes hacerlo después.',
            state: state(!!coreStep(core, 'users')?.done),
            optional: true,
            path: '/settings/users',
        },
        {
            key: 'import',
            title: 'Importación inicial',
            description:
                'Productos, clientes, proveedores y saldos de inventario desde una hoja de cálculo.',
            state: state(!!coreStep(core, 'import')?.done),
            optional: true,
            path: '/settings/imports',
        },
        {
            key: 'sequences',
            title: 'Secuenciales iniciales',
            description:
                'Solo si vienes de otro sistema: desde qué número sigue cada punto de emisión.',
            state: state(hasSequences),
            optional: true,
            path: '/settings/sequences',
        },
        {
            key: 'verification',
            title: 'Verificación en pruebas',
            description:
                'La facturación lista y una factura de prueba autorizada por el SRI en su ambiente de pruebas.',
            state: state(
                ready && tested,
                hasProfile && hasCertificate
                    ? undefined
                    : 'Falta el perfil fiscal o el certificado'
            ),
            optional: false,
            blockedBy:
                hasProfile && hasCertificate
                    ? undefined
                    : 'Falta el perfil fiscal o el certificado',
        },
        {
            key: 'production',
            title: 'Paso a producción',
            description:
                'Cambia la empresa al ambiente real del SRI. Pide confirmación, queda registrado y no se puede deshacer.',
            state: state(
                inProduction,
                ready && tested
                    ? undefined
                    : 'Primero la verificación en pruebas'
            ),
            optional: false,
            blockedBy:
                ready && tested
                    ? undefined
                    : 'Primero la verificación en pruebas',
        },
    ]
}

/** El primer paso obligatorio sin hacer, o el primero sin hacer; null si todo está hecho */
export const currentStep = (steps: WizardStep[]): WizardStep | null =>
    steps.find((step) => step.state !== 'done' && !step.optional) ??
    steps.find((step) => step.state !== 'done') ??
    null

/** La empresa puede facturar en pruebas: todo lo obligatorio hasta la verificación */
export const readyToInvoice = (steps: WizardStep[]): boolean =>
    steps
        .filter((step) => !step.optional && step.key !== 'production')
        .every((step) => step.state === 'done')
