import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useTransferMutations,
    useTransferItemMutations,
} from '../hooks/useTransfers'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import type {
    Transfer,
    TransferItem,
    TransferUpdateInput,
} from '../model/types'

export function useTransferActions(
    transferId: number,
    transfer: Transfer | undefined
) {
    const navigate = useNavigate()

    const {
        update: updateTransfer,
        remove: deleteTransfer,
        confirm: confirmTransfer,
        receive: receiveTransfer,
        cancel: cancelTransfer,
    } = useTransferMutations()
    const { remove: deleteItem } = useTransferItemMutations(transferId)

    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [editData, setEditData] = useState<TransferUpdateInput>({
        notes: '',
        requestedBy: '',
    })
    const [itemFormOpen, setItemFormOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<TransferItem | null>(null)
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
    const [receiveDialogOpen, setReceiveDialogOpen] = useState(false)
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteItemDialog, setDeleteItemDialog] = useState<{
        open: boolean
        item: TransferItem | null
    }>({ open: false, item: null })

    const handleEditTransfer = () => {
        if (transfer) {
            setEditData({
                notes: transfer.notes || '',
                requestedBy: transfer.requestedBy || '',
            })
            setEditDialogOpen(true)
        }
    }

    const handleSaveEdit = async () => {
        try {
            await updateTransfer.mutateAsync({
                id: transferId,
                data: {
                    notes: editData.notes || undefined,
                    requestedBy: editData.requestedBy || undefined,
                },
            })
            notifySuccess(
                'Transferencia actualizada',
                'La transferencia se actualizó correctamente'
            )
            setEditDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al actualizar la transferencia')
        }
    }

    const handleConfirm = async () => {
        try {
            await confirmTransfer.mutateAsync(transferId)
            notifySuccess(
                'Transferencia confirmada',
                'La transferencia se confirmó y el stock fue reservado'
            )
            setConfirmDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al confirmar la transferencia')
        }
    }

    const handleReceive = async () => {
        try {
            await receiveTransfer.mutateAsync(transferId)
            notifySuccess(
                'Transferencia recibida',
                'La transferencia se completó y los movimientos fueron generados'
            )
            setReceiveDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al recibir la transferencia')
        }
    }

    const handleCancel = async () => {
        try {
            await cancelTransfer.mutateAsync(transferId)
            notifySuccess(
                'Transferencia cancelada',
                'La transferencia fue cancelada'
            )
            setCancelDialogOpen(false)
        } catch (error: unknown) {
            notifyError(error, 'Error al cancelar la transferencia')
        }
    }

    const handleDelete = async () => {
        try {
            await deleteTransfer.mutateAsync(transferId)
            notifySuccess(
                'Transferencia eliminada',
                'La transferencia fue eliminada'
            )
            navigate('/transfers')
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar la transferencia')
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
        updateTransfer,
        deleteTransfer,
        confirmTransfer,
        receiveTransfer,
        cancelTransfer,
        deleteItem,
        editDialogOpen,
        setEditDialogOpen,
        editData,
        setEditData,
        itemFormOpen,
        selectedItem,
        confirmDialogOpen,
        setConfirmDialogOpen,
        receiveDialogOpen,
        setReceiveDialogOpen,
        cancelDialogOpen,
        setCancelDialogOpen,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deleteItemDialog,
        setDeleteItemDialog,
        handleEditTransfer,
        handleSaveEdit,
        handleConfirm,
        handleReceive,
        handleCancel,
        handleDelete,
        handleDeleteItemConfirm,
        handleAddItem: () => {
            setSelectedItem(null)
            setItemFormOpen(true)
        },
        handleEditItem: (item: TransferItem) => {
            setSelectedItem(item)
            setItemFormOpen(true)
        },
        handleCloseItemForm: () => {
            setItemFormOpen(false)
            setSelectedItem(null)
        },
    }
}
