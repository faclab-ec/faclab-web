import { useParams, useNavigate } from 'react-router-dom'
import { useTransfer, useTransferItems } from '../hooks/useTransfers'
import { useLocationsList } from '@features/locations'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useTransferActions } from '../components/useTransferActions'
import { TransferHeader } from '../components/TransferHeader'
import { TransferInfo } from '../components/TransferInfo'
import { TransferItems } from '../components/TransferItems'
import { EditTransferDialog } from '../components/EditTransferDialog'
import { ConfirmTransferDialog } from '../components/ConfirmTransferDialog'
import { ReceiveTransferDialog } from '../components/ReceiveTransferDialog'
import TransferItemForm from '../components/TransferItemForm'
import { formatProductLabel } from '@shared/lib/format'

const TransferDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const transferId = parseInt(id || '0')

    const { data: transfer, isLoading: transferLoading } =
        useTransfer(transferId)
    const { data: items = [], isLoading: itemsLoading } =
        useTransferItems(transferId)

    const { data: locationsData } = useLocationsList({ limit: 100 })
    const locations = locationsData?.items ?? []

    const actions = useTransferActions(transferId, transfer)

    const isDraft = transfer?.status === 'draft'
    const isConfirmed = transfer?.status === 'confirmed'
    const canCancel = isDraft || isConfirmed

    const getLocationName = (locationId: number) => {
        const l = locations.find((l) => l.id === locationId)
        return l ? `${l.name} (${l.code})` : `#${locationId}`
    }

    const getProductName = (productId: number) =>
        formatProductLabel(
            items.find((item) => item.productId === productId) ?? { productId }
        )

    if (transferLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div>Cargando...</div>
            </div>
        )
    }

    if (!transfer) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h4 className="mb-4">Transferencia no encontrada</h4>
                <Button
                    variant="solid"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/transfers')}
                >
                    Volver a Transferencias
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <TransferHeader
                transfer={transfer}
                isDraft={isDraft}
                isConfirmed={isConfirmed}
                canCancel={canCancel}
                onBack={() => navigate('/transfers')}
                onEdit={actions.handleEditTransfer}
                onConfirm={() => actions.setConfirmDialogOpen(true)}
                onReceive={() => actions.setReceiveDialogOpen(true)}
                onCancel={() => actions.setCancelDialogOpen(true)}
                onDelete={() => actions.setDeleteDialogOpen(true)}
            />

            <TransferInfo
                transfer={transfer}
                sourceName={getLocationName(transfer.sourceLocationId)}
                destinationName={getLocationName(
                    transfer.destinationLocationId
                )}
            />

            <TransferItems
                items={items}
                itemsLoading={itemsLoading}
                isDraft={isDraft}
                getProductName={getProductName}
                onAdd={actions.handleAddItem}
                onEdit={actions.handleEditItem}
                onDeleteItem={(item) =>
                    actions.setDeleteItemDialog({ open: true, item })
                }
            />

            <TransferItemForm
                transferId={transferId}
                item={actions.selectedItem}
                open={actions.itemFormOpen}
                onClose={actions.handleCloseItemForm}
            />

            <EditTransferDialog
                open={actions.editDialogOpen}
                editData={actions.editData}
                isPending={actions.updateTransfer.isPending}
                onClose={() => actions.setEditDialogOpen(false)}
                onChange={actions.setEditData}
                onSave={actions.handleSaveEdit}
            />

            <ConfirmTransferDialog
                open={actions.confirmDialogOpen}
                items={items}
                getProductName={getProductName}
                isPending={actions.confirmTransfer.isPending}
                onClose={() => actions.setConfirmDialogOpen(false)}
                onConfirm={actions.handleConfirm}
            />

            <ReceiveTransferDialog
                open={actions.receiveDialogOpen}
                items={items}
                getProductName={getProductName}
                isPending={actions.receiveTransfer.isPending}
                onClose={() => actions.setReceiveDialogOpen(false)}
                onReceive={actions.handleReceive}
            />

            <Dialog
                isOpen={actions.cancelDialogOpen}
                onClose={() => actions.setCancelDialogOpen(false)}
                onRequestClose={() => actions.setCancelDialogOpen(false)}
            >
                <h5 className="mb-4">Cancelar Transferencia</h5>
                <p className="mb-6">
                    ¿Está seguro que desea cancelar esta transferencia?
                    {isConfirmed &&
                        ' Se liberarán las reservas de stock en la ubicación de origen.'}
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => actions.setCancelDialogOpen(false)}
                    >
                        Volver
                    </Button>
                    <Button
                        variant="solid"
                        loading={actions.cancelTransfer.isPending}
                        onClick={actions.handleCancel}
                    >
                        Cancelar Transferencia
                    </Button>
                </div>
            </Dialog>

            <Dialog
                isOpen={actions.deleteDialogOpen}
                onClose={() => actions.setDeleteDialogOpen(false)}
                onRequestClose={() => actions.setDeleteDialogOpen(false)}
            >
                <h5 className="mb-4">Eliminar Transferencia</h5>
                <p className="mb-6">
                    ¿Está seguro que desea eliminar esta transferencia? Esta
                    acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => actions.setDeleteDialogOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        loading={actions.deleteTransfer.isPending}
                        onClick={actions.handleDelete}
                    >
                        Eliminar
                    </Button>
                </div>
            </Dialog>

            <Dialog
                isOpen={actions.deleteItemDialog.open}
                onClose={() =>
                    actions.setDeleteItemDialog({ open: false, item: null })
                }
                onRequestClose={() =>
                    actions.setDeleteItemDialog({ open: false, item: null })
                }
            >
                <h5 className="mb-4">Eliminar Item</h5>
                <p className="mb-6">
                    ¿Está seguro que desea eliminar este item de la
                    transferencia? Esta acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() =>
                            actions.setDeleteItemDialog({
                                open: false,
                                item: null,
                            })
                        }
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        loading={actions.deleteItem.isPending}
                        onClick={actions.handleDeleteItemConfirm}
                    >
                        Eliminar
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default TransferDetailPage
