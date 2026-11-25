import { useEffect, useState } from 'react'
import {
    HiOutlineCheckCircle,
    HiOutlineLockClosed,
    HiOutlineMinusCircle,
} from 'react-icons/hi'
import { Link } from 'react-router-dom'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { ErrorState, PageHeader, StatusBadge } from '@/components/shared'
import { useCompanyConfig, useInvoicingStatus } from '@features/invoicing'
import GoLiveDialog from '../components/GoLiveDialog'
import VerificationPanel from '../components/VerificationPanel'
import { useWizardSteps } from '../hooks/useOnboarding'
import {
    currentStep,
    readyToInvoice,
    type StepState,
    type WizardStep,
} from '../model/steps'

const STATE_LABELS: Record<StepState, string> = {
    done: 'Hecho',
    pending: 'Pendiente',
    blocked: 'Bloqueado',
}

const STATE_TONES = {
    done: 'success',
    pending: 'warning',
    blocked: 'neutral',
} as const

const StepIcon = ({ state }: { state: StepState }) => {
    if (state === 'done') {
        return <HiOutlineCheckCircle className="text-2xl text-emerald-500" />
    }
    if (state === 'blocked') {
        return <HiOutlineLockClosed className="text-2xl text-gray-400" />
    }
    return <HiOutlineMinusCircle className="text-2xl text-amber-500" />
}

/**
 * Asistente de puesta en marcha (S8.5). Cada paso sale de lo que la empresa ya
 * tiene: se puede dejar y retomar, y lo hecho en otras pantallas cuenta. Los
 * pasos de configuración llevan a su pantalla y vuelven aquí; la verificación
 * y el paso a producción se hacen en esta misma página.
 */
const OnboardingPage = () => {
    const { steps, isLoading, error, refetch } = useWizardSteps()
    const invoicing = useInvoicingStatus()
    const config = useCompanyConfig()
    const [goingLive, setGoingLive] = useState(false)

    // Lo que se configuró en otra pantalla se ve al volver
    useEffect(() => {
        refetch()
        // Una vez al abrir
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size={32} />
            </div>
        )
    }
    if (error) return <ErrorState error={error} onRetry={refetch} />

    const next = currentStep(steps)
    const ready = readyToInvoice(steps)
    const ruc = config.data?.taxId ?? ''

    const renderAction = (step: WizardStep) => {
        if (step.key === 'verification') {
            return (
                <VerificationPanel
                    blocked={step.state === 'blocked'}
                    invoicing={invoicing.data}
                />
            )
        }
        if (step.key === 'production') {
            if (step.state === 'done') {
                return (
                    <Alert showIcon className="mt-3" type="info">
                        La empresa emite en producción.
                    </Alert>
                )
            }
            return (
                <Button
                    className="mt-3"
                    color="red-600"
                    disabled={step.state === 'blocked' || !ruc}
                    size="sm"
                    variant="solid"
                    onClick={() => setGoingLive(true)}
                >
                    Pasar a producción…
                </Button>
            )
        }
        if (!step.path) return null
        return (
            <Link className="mt-3 inline-block" to={step.path}>
                <Button
                    size="sm"
                    variant={step.state === 'done' ? 'default' : 'solid'}
                >
                    {step.state === 'done' ? 'Revisar' : 'Configurar'}
                </Button>
            </Link>
        )
    }

    return (
        <>
            <PageHeader
                description="Los pasos para dejar la empresa lista para facturar. Puedes dejarlo y retomarlo cuando quieras: cada paso se marca solo cuando está hecho."
                title="Puesta en marcha"
            />
            {ready ? (
                <Alert showIcon className="mb-4" type="success">
                    La empresa está lista para facturar
                    {invoicing.data?.environment === 1
                        ? ' en el ambiente de pruebas del SRI.'
                        : '.'}
                </Alert>
            ) : (
                next && (
                    <Alert showIcon className="mb-4" type="info">
                        El siguiente paso es <strong>{next.title}</strong>.
                    </Alert>
                )
            )}
            <ol className="space-y-3">
                {steps.map((step, index) => (
                    <li key={step.key}>
                        <Card
                            className={
                                next?.key === step.key
                                    ? 'ring-2 ring-primary'
                                    : undefined
                            }
                        >
                            <div className="flex items-start gap-3">
                                <StepIcon state={step.state} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h6>
                                            {index + 1}. {step.title}
                                        </h6>
                                        <StatusBadge
                                            tone={STATE_TONES[step.state]}
                                        >
                                            {STATE_LABELS[step.state]}
                                        </StatusBadge>
                                        {step.optional && (
                                            <span className="text-xs text-gray-500">
                                                Opcional
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {step.description}
                                    </p>
                                    {step.blockedBy &&
                                        step.state === 'blocked' && (
                                            <p className="mt-1 text-sm text-amber-600">
                                                {step.blockedBy}.
                                            </p>
                                        )}
                                    {renderAction(step)}
                                </div>
                            </div>
                        </Card>
                    </li>
                ))}
            </ol>
            <GoLiveDialog
                open={goingLive}
                ruc={ruc}
                onClose={() => setGoingLive(false)}
            />
        </>
    )
}

export default OnboardingPage
