import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HiOutlineArrowLeft, HiOutlinePencil } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import { EmptyState, ErrorState, FormModal } from '@/components/shared'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge, { ActiveBadge } from '@/components/shared/StatusBadge'
import { PERMISSION } from '@/constants/permissions.constant'
import { useCan } from '@/stores'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { isApiError } from '@/utils/errors/ApiError'
import {
    useBranch,
    useBranchMutations,
    useEmissionPointsList,
    usePosTerminalsList,
} from '../hooks/useOrganization'
import { ORGANIZATION_ERROR_MESSAGES } from '../model/errors'
import BranchForm from '../components/BranchForm'
import EmissionPointsSection from '../components/EmissionPointsSection'
import PosTerminalsSection from '../components/PosTerminalsSection'
import type { BranchInput } from '../api/client'

const FORM_ID = 'branch-detail-form'
const BRANCHES_PATH = '/settings/branches'

const BranchDetailPage = () => {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const branchId = Number(id) || 0
    const canWrite = useCan(PERMISSION.ORGANIZATION_WRITE)
    const [editing, setEditing] = useState(false)

    const branch = useBranch(branchId)
    const children = { branchId, limit: 1000 }
    const emissionPoints = useEmissionPointsList(children)
    const terminals = usePosTerminalsList(children)
    const { update } = useBranchMutations()

    const handleSubmit = async (values: BranchInput) => {
        try {
            await update.mutateAsync({ id: branchId, data: values })
            notifySuccess('Sucursal actualizada')
            setEditing(false)
        } catch (err) {
            notifyError(err, 'No se pudo guardar la sucursal', {
                messages: ORGANIZATION_ERROR_MESSAGES,
            })
        }
    }

    if (branch.isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Spinner size={40} />
            </div>
        )
    }

    if (!branch.data) {
        return branch.error &&
            !(isApiError(branch.error) && branch.error.code === 'NOT_FOUND') ? (
            <ErrorState error={branch.error} onRetry={() => branch.refetch()} />
        ) : (
            <EmptyState
                className="min-h-[24rem]"
                title="Sucursal no encontrada"
                action={
                    <Button
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate(BRANCHES_PATH)}
                    >
                        Volver a Sucursales
                    </Button>
                }
            />
        )
    }

    const data = branch.data

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                className="!mb-1"
                title={`${data.establishmentCode} · ${data.name}`}
                badge={
                    <>
                        {data.isMain && (
                            <StatusBadge tone="info">Matriz</StatusBadge>
                        )}
                        <ActiveBadge active={data.isActive} />
                    </>
                }
                description={data.address || 'Sin dirección de establecimiento'}
                actions={
                    canWrite && (
                        <Button
                            size="sm"
                            icon={<HiOutlinePencil />}
                            onClick={() => setEditing(true)}
                        >
                            Editar
                        </Button>
                    )
                }
                onBack={() => navigate(BRANCHES_PATH)}
            />

            <EmissionPointsSection
                branchId={branchId}
                emissionPoints={emissionPoints.data?.items ?? []}
                loading={emissionPoints.isLoading}
                error={emissionPoints.error}
                canWrite={canWrite}
                onRetry={() => emissionPoints.refetch()}
            />

            <PosTerminalsSection
                branchId={branchId}
                terminals={terminals.data?.items ?? []}
                emissionPoints={emissionPoints.data?.items ?? []}
                loading={terminals.isLoading}
                error={terminals.error}
                canWrite={canWrite}
                onRetry={() => terminals.refetch()}
            />

            <FormModal
                formId={FORM_ID}
                isOpen={editing}
                title="Editar sucursal"
                isSubmitting={update.isPending}
                onClose={() => setEditing(false)}
            >
                <BranchForm
                    formId={FORM_ID}
                    branch={data}
                    isSubmitting={update.isPending}
                    onSubmit={handleSubmit}
                />
            </FormModal>
        </div>
    )
}

export default BranchDetailPage
