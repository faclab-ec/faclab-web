import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useAdjustmentMutations,
    useAdjustmentItemMutations,
} from '../hooks/useAdjustments'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import type {
    Adjustment,
    AdjustmentItem,
    AdjustmentUpdateInput,
} from '../model/types'

export function useAdjustmentActions(
    adjustmentId: number,
    adjustment: Adjustment | undefined
) {
    const navigate = useNavigate()

    const {
        update: updateAdjustment,
        remove: deleteAdjustment,
        confirm: confirmAdjustment,
        cancel: cancelAdjustment,
    } = useAdjustmentMutations()
    const { remove: deleteItem } = useAdjustmentItemMutations(adjustmentId)

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editData, setEditData] = useState<AdjustmentUpdateInput>({
        notes: '',
        adjustedBy: '',
    })
    const [itemFormOpen, setItemFormOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<AdjustmentItem | null>(
        null
    )
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteItemDialog, setDeleteItemDialog] = useState<{
        open: boolean
        item: AdjustmentItem | null
    }>({ open: false, item: null })

    const handleEditAdjustment = () => {
        if (adjustment) {
            setEditData({
                notes: adjustment.notes || '',
                adjustedBy: adjustment.adjustedBy || '',
            })
            setEditDialogOpen(true)
        }
    }

    const handleSaveEdit = async () => {
        try {
            await updateAdjustment.mutateAsync({
                id: adjustmentId,
                data: {
                    notes: editData.notes || undefined,
                    adjustedBy: editData.adjustedBy || undefined,
                },
            })
            toast.push(
                <Notification title="Ajuste actualizado" type="success">
                    El ajuste se actualizó correctamente
                </Notification>,
                { placement: 'top-end' }
            )
            setEditDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al actualizar el ajuste')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleConfirm = async () => {
        try {
            await confirmAdjustment.mutateAsync(adjustmentId)
            toast.push(
                <Notification title="Ajuste confirmado" type="success">
                    El ajuste se confirmó y los movimientos de inventario fueron
                    generados
                </Notification>,
                { placement: 'top-end' }
            )
            setConfirmDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al confirmar el ajuste')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleCancel = async () => {
        try {
            await cancelAdjustment.mutateAsync(adjustmentId)
            toast.push(
                <Notification title="Ajuste cancelado" type="success">
                    El ajuste fue cancelado
                </Notification>,
                { placement: 'top-end' }
            )
            setCancelDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al cancelar el ajuste')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleDelete = async () => {
        try {
            await deleteAdjustment.mutateAsync(adjustmentId)
            toast.push(
                <Notification title="Ajuste eliminado" type="success">
                    El ajuste fue eliminado
                </Notification>,
                { placement: 'top-end' }
            )
            navigate('/adjustments')
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al eliminar el ajuste')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleDeleteItemConfirm = async () => {
        if (!deleteItemDialog.item) return
        try {
            await deleteItem.mutateAsync(deleteItemDialog.item.id)
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
        updateAdjustment,
        deleteAdjustment,
        confirmAdjustment,
        cancelAdjustment,
        deleteItem,
        editDialogOpen,
        setEditDialogOpen,
        editData,
        setEditData,
        itemFormOpen,
        selectedItem,
        confirmDialogOpen,
        setConfirmDialogOpen,
        cancelDialogOpen,
        setCancelDialogOpen,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deleteItemDialog,
        setDeleteItemDialog,
        handleEditAdjustment,
        handleSaveEdit,
        handleConfirm,
        handleCancel,
        handleDelete,
        handleDeleteItemConfirm,
        handleAddItem: () => {
            setSelectedItem(null)
            setItemFormOpen(true)
        },
        handleEditItem: (item: AdjustmentItem) => {
            setSelectedItem(item)
            setItemFormOpen(true)
        },
        handleCloseItemForm: () => {
            setItemFormOpen(false)
            setSelectedItem(null)
        },
    }
}
