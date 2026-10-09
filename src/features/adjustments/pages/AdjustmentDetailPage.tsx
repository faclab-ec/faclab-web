import { useParams, useNavigate } from 'react-router-dom'
import { useAdjustment, useAdjustmentItems } from '../hooks/useAdjustments'
import { useWarehousesList } from '@features/warehouses'
import { useLocationsList } from '@features/locations'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useAdjustmentActions } from '../components/useAdjustmentActions'
import { AdjustmentHeader } from '../components/AdjustmentHeader'
import { AdjustmentInfo } from '../components/AdjustmentInfo'
import { AdjustmentItems } from '../components/AdjustmentItems'
import { EditAdjustmentDialog } from '../components/EditAdjustmentDialog'
import { ConfirmAdjustmentDialog } from '../components/ConfirmAdjustmentDialog'
import AdjustmentItemForm from '../components/AdjustmentItemForm'
import { formatProductLabel } from '@shared/lib/format'

const AdjustmentDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const adjustmentId = parseInt(id || '0')

    const { data: adjustment, isLoading: adjustmentLoading } =
        useAdjustment(adjustmentId)
    const { data: items = [], isLoading: itemsLoading } =
        useAdjustmentItems(adjustmentId)

    const { data: warehousesData } = useWarehousesList({ limit: 100 })
    const warehouses = warehousesData?.items ?? []

    const warehouseId = adjustment?.warehouseId ?? 0
    const { data: locationsData } = useLocationsList(
        warehouseId ? { warehouseId, limit: 100 } : undefined
    )
    const locations = locationsData?.items ?? []

    const actions = useAdjustmentActions(adjustmentId, adjustment)

    const isDraft = adjustment?.status === 'draft'
    const itemsWithDifference = items.filter((i) => i.difference !== 0)

    const getWarehouseName = (wId: number) => {
        const w = warehouses.find((w) => w.id === wId)
        return w ? `${w.name} (${w.code})` : `#${wId}`
    }

    const getProductName = (productId: number) =>
        formatProductLabel(
            items.find((item) => item.productId === productId) ?? { productId }
        )

    const getLocationName = (locationId: number) => {
        const l = locations.find((l) => l.id === locationId)
        return l ? `${l.name} (${l.code})` : `#${locationId}`
    }

    if (adjustmentLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div>Cargando...</div>
            </div>
        )
    }

    if (!adjustment) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h4 className="mb-4">Ajuste no encontrado</h4>
                <Button
                    variant="solid"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/adjustments')}
                >
                    Volver a Ajustes
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <AdjustmentHeader
                adjustment={adjustment}
                isDraft={isDraft}
                onBack={() => navigate('/adjustments')}
                onEdit={actions.handleEditAdjustment}
                onConfirm={() => actions.setConfirmDialogOpen(true)}
                onCancel={() => actions.setCancelDialogOpen(true)}
                onDelete={() => actions.setDeleteDialogOpen(true)}
            />

            <AdjustmentInfo
                adjustment={adjustment}
                warehouseName={getWarehouseName(adjustment.warehouseId)}
            />

            <AdjustmentItems
                items={items}
                itemsLoading={itemsLoading}
                isDraft={isDraft}
                getProductName={getProductName}
                getLocationName={getLocationName}
                onAdd={actions.handleAddItem}
                onEdit={actions.handleEditItem}
                onDeleteItem={(item) =>
                    actions.setDeleteItemDialog({ open: true, item })
                }
            />

            <AdjustmentItemForm
                adjustmentId={adjustmentId}
                item={actions.selectedItem}
                open={actions.itemFormOpen}
                warehouseId={adjustment.warehouseId}
                onClose={actions.handleCloseItemForm}
            />

            <EditAdjustmentDialog
                open={actions.editDialogOpen}
                editData={actions.editData}
                isPending={actions.updateAdjustment.isPending}
                onClose={() => actions.setEditDialogOpen(false)}
                onChange={actions.setEditData}
                onSave={actions.handleSaveEdit}
            />

            <ConfirmAdjustmentDialog
                open={actions.confirmDialogOpen}
                itemsWithDifference={itemsWithDifference}
                getProductName={getProductName}
                isPending={actions.confirmAdjustment.isPending}
                onClose={() => actions.setConfirmDialogOpen(false)}
                onConfirm={actions.handleConfirm}
            />

            <Dialog
                isOpen={actions.cancelDialogOpen}
                onClose={() => actions.setCancelDialogOpen(false)}
                onRequestClose={() => actions.setCancelDialogOpen(false)}
            >
                <h5 className="mb-4">Cancelar Ajuste</h5>
                <p className="mb-6">
                    ¿Está seguro que desea cancelar este ajuste? No se generarán
                    movimientos de inventario.
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
                        loading={actions.cancelAdjustment.isPending}
                        onClick={actions.handleCancel}
                    >
                        Cancelar Ajuste
                    </Button>
                </div>
            </Dialog>

            <Dialog
                isOpen={actions.deleteDialogOpen}
                onClose={() => actions.setDeleteDialogOpen(false)}
                onRequestClose={() => actions.setDeleteDialogOpen(false)}
            >
                <h5 className="mb-4">Eliminar Ajuste</h5>
                <p className="mb-6">
                    ¿Está seguro que desea eliminar este ajuste? Esta acción no
                    se puede deshacer.
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
                        loading={actions.deleteAdjustment.isPending}
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
                    ¿Está seguro que desea eliminar este item del ajuste? Esta
                    acción no se puede deshacer.
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

export default AdjustmentDetailPage
