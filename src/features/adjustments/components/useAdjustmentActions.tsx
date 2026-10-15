import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useAdjustmentMutations,
    useAdjustmentItemMutations,
} from '../hooks/useAdjustments'
import { notifySuccess, notifyError } from '@shared/ui/notify'
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
                },
            })
            notifySuccess(
                'Ajuste actualizado',
                'El ajuste se actualizó correctamente'
            )
            setEditDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al actualizar el ajuste')
        }
    }

    const handleConfirm = async () => {
        try {
            await confirmAdjustment.mutateAsync(adjustmentId)
            notifySuccess(
                'Ajuste confirmado',
                'El ajuste se confirmó y los movimientos de inventario fueron generados'
            )
            setConfirmDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al confirmar el ajuste')
        }
    }

    const handleCancel = async () => {
        try {
            await cancelAdjustment.mutateAsync(adjustmentId)
            notifySuccess('Ajuste cancelado', 'El ajuste fue cancelado')
            setCancelDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al cancelar el ajuste')
        }
    }

    const handleDelete = async () => {
        try {
            await deleteAdjustment.mutateAsync(adjustmentId)
            notifySuccess('Ajuste eliminado', 'El ajuste fue eliminado')
            navigate('/adjustments')
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el ajuste')
        }
    }

    const handleDeleteItemConfirm = async () => {
        if (!deleteItemDialog.item) return
        try {
            await deleteItem.mutateAsync(deleteItemDialog.item.id)
            notifySuccess('Item eliminado', 'El item fue eliminado')
            setDeleteItemDialog({ open: false, item: null })
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el item')
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
