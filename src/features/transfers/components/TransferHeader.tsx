import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import {
    HiOutlinePencil,
    HiOutlineTrash,
    HiOutlineCheck,
    HiOutlineX,
} from 'react-icons/hi'
import {
    TRANSFER_STATUS_LABELS,
    TRANSFER_STATUS_TONES,
    type Transfer,
} from '../model/types'
import PageHeader from '@/components/shared/PageHeader'

type Props = {
    transfer: Transfer
    isDraft: boolean
    isConfirmed: boolean
    canCancel: boolean
    onBack: () => void
    onEdit: () => void
    onConfirm: () => void
    onReceive: () => void
    onCancel: () => void
    onDelete: () => void
}

export const TransferHeader = ({
    transfer,
    isDraft,
    isConfirmed,
    canCancel,
    onBack,
    onEdit,
    onConfirm,
    onReceive,
    onCancel,
    onDelete,
}: Props) => (
    <PageHeader
        className="!mb-1"
        title={`Transferencia #${transfer.id}`}
        badge={
            <>
                <StatusBadge tone={TRANSFER_STATUS_TONES[transfer.status]}>
                    {TRANSFER_STATUS_LABELS[transfer.status]}
                </StatusBadge>
            </>
        }
        actions={
            <>
                <div className="flex gap-2">
                    {isDraft && (
                        <>
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
                                icon={<HiOutlineTrash />}
                                onClick={onDelete}
                            >
                                Eliminar
                            </Button>
                        </>
                    )}
                    {isConfirmed && (
                        <Button
                            size="sm"
                            variant="solid"
                            color="emerald-600"
                            icon={<HiOutlineCheck />}
                            onClick={onReceive}
                        >
                            Recibir
                        </Button>
                    )}
                    {canCancel && (
                        <Button
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineX />}
                            onClick={onCancel}
                        >
                            Cancelar
                        </Button>
                    )}
                </div>
            </>
        }
        onBack={onBack}
    />
)
