import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import { HiOutlinePencil, HiOutlineTrash, HiOutlineX } from 'react-icons/hi'
import { HiOutlinePaperAirplane, HiOutlineArchiveBox } from 'react-icons/hi2'
import {
    PURCHASE_ORDER_STATUS_LABELS,
    PURCHASE_ORDER_STATUS_TONES,
} from '../model/types'
import type { PurchaseOrder } from '../model/types'
import PageHeader from '@/components/shared/PageHeader'

type Props = {
    order: PurchaseOrder
    isDraft: boolean
    canReceive: boolean
    canCancel: boolean
    onBack: () => void
    onEdit: () => void
    onSend: () => void
    onDelete: () => void
    onReceive: () => void
    onCancel: () => void
}

export const PurchaseOrderHeader = ({
    order,
    isDraft,
    canReceive,
    canCancel,
    onBack,
    onEdit,
    onSend,
    onDelete,
    onReceive,
    onCancel,
}: Props) => (
    <PageHeader
        className="!mb-1"
        title={`Orden ${order.orderNumber}`}
        badge={
            <>
                <StatusBadge tone={PURCHASE_ORDER_STATUS_TONES[order.status]}>
                    {PURCHASE_ORDER_STATUS_LABELS[order.status]}
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
                                color="blue-600"
                                icon={<HiOutlinePaperAirplane />}
                                onClick={onSend}
                            >
                                Enviar
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
                    {canReceive && (
                        <Button
                            size="sm"
                            variant="solid"
                            color="emerald-600"
                            icon={<HiOutlineArchiveBox />}
                            onClick={onReceive}
                        >
                            Recibir Mercancía
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
