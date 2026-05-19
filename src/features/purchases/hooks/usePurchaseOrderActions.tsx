import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useUpdatePurchaseOrder,
    useDeletePurchaseOrder,
    useSendPurchaseOrder,
    useCancelPurchaseOrder,
    useDeletePurchaseOrderItem,
} from './usePurchaseOrders'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
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
            toast.push(
                <Notification title="Orden actualizada" type="success">
                    La orden de compra se actualizó correctamente
                </Notification>,
                { placement: 'top-end' }
            )
            setEditDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al actualizar la orden')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleSend = async () => {
        try {
            await sendOrder.mutateAsync(orderId)
            toast.push(
                <Notification title="Orden enviada" type="success">
                    La orden de compra fue enviada al proveedor
                </Notification>,
                { placement: 'top-end' }
            )
            setSendDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al enviar la orden')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleCancel = async () => {
        try {
            await cancelOrder.mutateAsync(orderId)
            toast.push(
                <Notification title="Orden cancelada" type="success">
                    La orden de compra fue cancelada
                </Notification>,
                { placement: 'top-end' }
            )
            setCancelDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al cancelar la orden')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleDelete = async () => {
        try {
            await deleteOrder.mutateAsync(orderId)
            toast.push(
                <Notification title="Orden eliminada" type="success">
                    La orden de compra fue eliminada
                </Notification>,
                { placement: 'top-end' }
            )
            navigate('/purchase-orders')
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al eliminar la orden')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleDeleteItemConfirm = async () => {
        if (!deleteItemDialog.item) return
        try {
            await deleteItem.mutateAsync({
                itemId: deleteItemDialog.item.id,
                orderId,
            })
            toast.push(
                <Notification title="Item eliminado" type="success">
                    El item fue eliminado
                </Notification>,
                { placement: 'top-end' }
            )
            setDeleteItemDialog({ open: false, item: null })
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al eliminar el item')}
                </Notification>,
                { placement: 'top-end' }
            )
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
