import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import {
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineX,
} from 'react-icons/hi'
import {
    ADJUSTMENT_STATUS_LABELS,
    ADJUSTMENT_STATUS_TONES,
    type Adjustment,
} from '../model/types'
import PageHeader from '@/components/shared/PageHeader'

type Props = {
    adjustment: Adjustment
    isDraft: boolean
    onBack: () => void
    onEdit: () => void
    onConfirm: () => void
    onCancel: () => void
    onDelete: () => void
}

export const AdjustmentHeader = ({
    adjustment,
    isDraft,
    onBack,
    onEdit,
    onConfirm,
    onCancel,
    onDelete,
}: Props) => (
    <PageHeader
        className="!mb-1"
        title={`Ajuste #${adjustment.id}`}
        badge={
            <>
                <StatusBadge tone={ADJUSTMENT_STATUS_TONES[adjustment.status]}>
                    {ADJUSTMENT_STATUS_LABELS[adjustment.status]}
                </StatusBadge>
            </>
        }
        actions={
            <>
                {isDraft && (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlinePencil />}
                            onClick={onEdit}
                        >
                            Editar
                        </Button>
                        <Button
                            size="sm"
                            variant="solid"
                            color="emerald-600"
                            icon={<HiOutlineCheck />}
                            onClick={onConfirm}
                        >
                            Confirmar
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineX />}
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineTrash />}
                            onClick={onDelete}
                        >
                            Eliminar
                        </Button>
                    </div>
                )}
            </>
        }
        onBack={onBack}
    />
)
