import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    useTransferMutations,
    useTransferItemMutations,
} from '../hooks/useTransfers'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
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
            toast.push(
                <Notification title="Transferencia actualizada" type="success">
                    La transferencia se actualizó correctamente
                </Notification>,
                { placement: 'top-end' }
            )
            setEditDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(
                        error,
                        'Error al actualizar la transferencia'
                    )}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleConfirm = async () => {
        try {
            await confirmTransfer.mutateAsync(transferId)
            toast.push(
                <Notification title="Transferencia confirmada" type="success">
                    La transferencia se confirmó y el stock fue reservado
                </Notification>,
                { placement: 'top-end' }
            )
            setConfirmDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(
                        error,
                        'Error al confirmar la transferencia'
                    )}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleReceive = async () => {
        try {
            await receiveTransfer.mutateAsync(transferId)
            toast.push(
                <Notification title="Transferencia recibida" type="success">
                    La transferencia se completó y los movimientos fueron
                    generados
                </Notification>,
                { placement: 'top-end' }
            )
            setReceiveDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(
                        error,
                        'Error al recibir la transferencia'
                    )}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleCancel = async () => {
        try {
            await cancelTransfer.mutateAsync(transferId)
            toast.push(
                <Notification title="Transferencia cancelada" type="success">
                    La transferencia fue cancelada
                </Notification>,
                { placement: 'top-end' }
            )
            setCancelDialogOpen(false)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(
                        error,
                        'Error al cancelar la transferencia'
                    )}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    const handleDelete = async () => {
        try {
            await deleteTransfer.mutateAsync(transferId)
            toast.push(
                <Notification title="Transferencia eliminada" type="success">
                    La transferencia fue eliminada
                </Notification>,
                { placement: 'top-end' }
            )
            navigate('/transfers')
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(
                        error,
                        'Error al eliminar la transferencia'
                    )}
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
