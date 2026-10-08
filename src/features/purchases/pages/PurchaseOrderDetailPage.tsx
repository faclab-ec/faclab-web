import { useParams, useNavigate } from 'react-router-dom'
import {
    usePurchaseOrder,
    usePurchaseOrderItems,
    usePurchaseOrderReceipts,
} from '../hooks/usePurchaseOrders'
import { useProductsList } from '@features/products'
import { useSuppliersList } from '@features/suppliers'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { usePurchaseOrderActions } from '../hooks/usePurchaseOrderActions'
import { PurchaseOrderHeader } from '../components/PurchaseOrderHeader'
import { PurchaseOrderInfo } from '../components/PurchaseOrderInfo'
import { PurchaseOrderItems } from '../components/PurchaseOrderItems'
import { PurchaseOrderReceipts } from '../components/PurchaseOrderReceipts'
import { EditOrderDialog } from '../components/EditOrderDialog'
import { SendOrderDialog } from '../components/SendOrderDialog'
import PurchaseOrderItemForm from '../components/PurchaseOrderItemForm'
import ReceiveForm from '../components/ReceiveForm'

const PurchaseOrderDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const orderId = parseInt(id || '0')

    const { data: order, isLoading: orderLoading } = usePurchaseOrder(orderId)
    const { data: items = [], isLoading: itemsLoading } =
        usePurchaseOrderItems(orderId)
    const { data: receipts = [] } = usePurchaseOrderReceipts(orderId)

    const { data: productsData } = useProductsList()
    const products = productsData?.items ?? []

    const { data: suppliersData } = useSuppliersList({ limit: 100 })
    const suppliers = suppliersData?.items ?? []

    const actions = usePurchaseOrderActions(orderId, order)

    const isDraft = order?.status === 'draft'
    const isSent = order?.status === 'sent'
    const isPartial = order?.status === 'partial'
    const canReceive = isSent || isPartial
    const canCancel = isDraft || isSent || isPartial

    const supplierOptions = suppliers
        .filter((s) => s.isActive)
        .map((s) => ({ value: s.id.toString(), label: s.name }))

    const getProductName = (productId: number) => {
        const p = products.find((p) => p.id === productId)
        return p ? `${p.name} (${p.sku})` : `#${productId}`
    }

    if (orderLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div>Cargando...</div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h4 className="mb-4">Orden de compra no encontrada</h4>
                <Button
                    variant="solid"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/purchase-orders')}
                >
                    Volver a Órdenes de Compra
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <PurchaseOrderHeader
                order={order}
                isDraft={isDraft}
                canReceive={canReceive}
                canCancel={canCancel}
                onBack={() => navigate('/purchase-orders')}
                onEdit={actions.handleEditOrder}
                onSend={() => actions.setSendDialogOpen(true)}
                onDelete={() => actions.setDeleteDialogOpen(true)}
                onReceive={() => actions.setReceiveFormOpen(true)}
                onCancel={() => actions.setCancelDialogOpen(true)}
            />

            <PurchaseOrderInfo
                order={order}
                supplierName={order.supplierName ?? `#${order.supplierId}`}
            />

            <PurchaseOrderItems
                items={items}
                itemsLoading={itemsLoading}
                isDraft={isDraft}
                order={order}
                getProductName={getProductName}
                onAdd={actions.handleAddItem}
                onEdit={actions.handleEditItem}
                onDeleteItem={(item) =>
                    actions.setDeleteItemDialog({ open: true, item })
                }
            />

            <PurchaseOrderReceipts order={order} receipts={receipts} />

            <PurchaseOrderItemForm
                orderId={orderId}
                item={actions.selectedItem}
                open={actions.itemFormOpen}
                onClose={actions.handleCloseItemForm}
            />

            <ReceiveForm
                orderId={orderId}
                items={items}
                open={actions.receiveFormOpen}
                getProductName={getProductName}
                onClose={() => actions.setReceiveFormOpen(false)}
            />

            <EditOrderDialog
                open={actions.editDialogOpen}
                editData={actions.editData}
                supplierOptions={supplierOptions}
                isPending={actions.updateOrder.isPending}
                onClose={() => actions.setEditDialogOpen(false)}
                onChange={actions.setEditData}
                onSave={actions.handleSaveEdit}
            />

            <SendOrderDialog
                open={actions.sendDialogOpen}
                items={items}
                order={order}
                getProductName={getProductName}
                isPending={actions.sendOrder.isPending}
                onClose={() => actions.setSendDialogOpen(false)}
                onSend={actions.handleSend}
            />

            <Dialog
                isOpen={actions.cancelDialogOpen}
                onClose={() => actions.setCancelDialogOpen(false)}
                onRequestClose={() => actions.setCancelDialogOpen(false)}
            >
                <h5 className="mb-4">Cancelar Orden de Compra</h5>
                <p className="mb-6">
                    ¿Está seguro que desea cancelar esta orden de compra?
                    {isPartial && ' La mercancía ya recibida no será afectada.'}
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
                        loading={actions.cancelOrder.isPending}
                        onClick={actions.handleCancel}
                    >
                        Cancelar Orden
                    </Button>
                </div>
            </Dialog>

            <Dialog
                isOpen={actions.deleteDialogOpen}
                onClose={() => actions.setDeleteDialogOpen(false)}
                onRequestClose={() => actions.setDeleteDialogOpen(false)}
            >
                <h5 className="mb-4">Eliminar Orden de Compra</h5>
                <p className="mb-6">
                    ¿Está seguro que desea eliminar esta orden de compra? Esta
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
                        loading={actions.deleteOrder.isPending}
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
                    ¿Está seguro que desea eliminar este item de la orden? Esta
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

export default PurchaseOrderDetailPage
