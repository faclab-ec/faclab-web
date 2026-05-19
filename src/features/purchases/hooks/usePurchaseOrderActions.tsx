import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useUpdatePurchaseOrder,
    useDeletePurchaseOrder,
    useSendPurchaseOrder,
    useCancelPurchaseOrder,
    useDeletePurchaseOrderItem,
} from './usePurchaseOrders'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import type {
    PurchaseOrder,
    PurchaseOrderItem,
    PurchaseOrderUpdateInput,
} from '../model/types'

type EditData = PurchaseOrderUpdateInput & { supplierId: number }

export function usePurchaseOrderActions(
    orderId: number,
    order: PurchaseOrder | undefined
) {
    const navigate = useNavigate()

    const updateOrder = useUpdatePurchaseOrder()
    const deleteOrder = useDeletePurchaseOrder()
    const sendOrder = useSendPurchaseOrder()
    const cancelOrder = useCancelPurchaseOrder()
    const deleteItem = useDeletePurchaseOrderItem()

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editData, setEditData] = useState<EditData>({
        supplierId: 0,
        notes: '',
        expectedDate: '',
    })
    const [itemFormOpen, setItemFormOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<PurchaseOrderItem | null>(
        null
    )
    const [receiveFormOpen, setReceiveFormOpen] = useState(false)
    const [sendDialogOpen, setSendDialogOpen] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteItemDialog, setDeleteItemDialog] = useState<{
        open: boolean
        item: PurchaseOrderItem | null
    }>({ open: false, item: null })

    const handleEditOrder = () => {
        if (order) {
            setEditData({
                supplierId: order.supplierId,
                notes: order.notes || '',
                expectedDate: order.expectedDate
                    ? order.expectedDate.split('T')[0]
                    : '',
            })
            setEditDialogOpen(true)
        }
    }

    const handleSaveEdit = async () => {
        try {
            await updateOrder.mutateAsync({
                id: orderId,
                data: {
                    supplierId: editData.supplierId,
                    notes: editData.notes || undefined,
                    expectedDate: editData.expectedDate
                        ? `${editData.expectedDate}T00:00:00Z`
                        : undefined,
                },
            })
            notifySuccess(
                'Orden actualizada',
                'La orden de compra se actualizó correctamente'
            )
            setEditDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al actualizar la orden')
        }
    }

    const handleSend = async () => {
        try {
            await sendOrder.mutateAsync(orderId)
            notifySuccess(
                'Orden enviada',
                'La orden de compra fue enviada al proveedor'
            )
            setSendDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al enviar la orden')
        }
    }

    const handleCancel = async () => {
        try {
            await cancelOrder.mutateAsync(orderId)
            notifySuccess('Orden cancelada', 'La orden de compra fue cancelada')
            setCancelDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al cancelar la orden')
        }
    }

    const handleDelete = async () => {
        try {
            await deleteOrder.mutateAsync(orderId)
            notifySuccess('Orden eliminada', 'La orden de compra fue eliminada')
            navigate('/purchase-orders')
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar la orden')
        }
    }

    const handleDeleteItemConfirm = async () => {
        if (!deleteItemDialog.item) return
        try {
            await deleteItem.mutateAsync({
                itemId: deleteItemDialog.item.id,
                orderId,
            })
            notifySuccess('Item eliminado', 'El item fue eliminado')
            setDeleteItemDialog({ open: false, item: null })
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el item')
        }
    }

    return {
        updateOrder,
        deleteOrder,
        sendOrder,
        cancelOrder,
        deleteItem,
        editDialogOpen,
        setEditDialogOpen,
        editData,
        setEditData,
        itemFormOpen,
        selectedItem,
        receiveFormOpen,
        setReceiveFormOpen,
        sendDialogOpen,
        setSendDialogOpen,
        cancelDialogOpen,
        setCancelDialogOpen,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deleteItemDialog,
        setDeleteItemDialog,
        handleEditOrder,
        handleSaveEdit,
        handleSend,
        handleCancel,
        handleDelete,
        handleDeleteItemConfirm,
        handleAddItem: () => {
            setSelectedItem(null)
            setItemFormOpen(true)
        },
        handleEditItem: (item: PurchaseOrderItem) => {
            setSelectedItem(item)
            setItemFormOpen(true)
        },
        handleCloseItemForm: () => {
            setItemFormOpen(false)
            setSelectedItem(null)
        },
    }
}
