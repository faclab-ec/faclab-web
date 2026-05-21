import { useState } from 'react'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import type { AdminUserResponse } from '@/@types/auth'
import type { RoleCode } from '@/constants/roles.constant'
import generatePassword from '../lib/generatePassword'
import {
    useUpdateUserRole,
    useActivateUser,
    useDeactivateUser,
} from './useAdminUsers'

interface ResetDialogState {
    open: boolean
    user: AdminUserResponse | null
    defaultPassword: string
}

interface DeactivateDialogState {
    open: boolean
    userId: number | null
    username: string
}

const closedReset: ResetDialogState = {
    open: false,
    user: null,
    defaultPassword: '',
}

const closedDeactivate: DeactivateDialogState = {
    open: false,
    userId: null,
    username: '',
}

export function useAdminUserActions() {
    const [resetDialog, setResetDialog] =
        useState<ResetDialogState>(closedReset)
    const [deactivateDialog, setDeactivateDialog] =
        useState<DeactivateDialogState>(closedDeactivate)
    const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const updateRole = useUpdateUserRole()
    const activateUser = useActivateUser()
    const deactivateUser = useDeactivateUser()

    const handleRoleChange = async (userId: number, role: RoleCode) => {
        setUpdatingRoleId(userId)
        try {
            await updateRole.mutateAsync({ id: userId, role })
            notifySuccess('Rol actualizado')
        } catch (err) {
            notifyError(err, 'Error al actualizar el rol')
        } finally {
            setUpdatingRoleId(null)
        }
    }

    const handleActivate = async (userId: number) => {
        setTogglingId(userId)
        try {
            await activateUser.mutateAsync(userId)
            notifySuccess('Usuario activado')
        } catch (err) {
            notifyError(err, 'Error al activar el usuario')
        } finally {
            setTogglingId(null)
        }
    }

    const handleDeactivateConfirm = async () => {
        if (!deactivateDialog.userId) return
        const userId = deactivateDialog.userId
        setDeactivateDialog(closedDeactivate)
        setTogglingId(userId)
        try {
            await deactivateUser.mutateAsync(userId)
            notifySuccess('Usuario desactivado')
        } catch (err) {
            notifyError(err, 'Error al desactivar el usuario')
        } finally {
            setTogglingId(null)
        }
    }

    const openReset = (user: AdminUserResponse) =>
        setResetDialog({
            open: true,
            user,
            defaultPassword: generatePassword(),
        })
    const closeReset = () => setResetDialog(closedReset)

    const openDeactivate = (user: AdminUserResponse) =>
        setDeactivateDialog({
            open: true,
            userId: user.id,
            username: user.username,
        })
    const closeDeactivate = () => setDeactivateDialog(closedDeactivate)

    return {
        resetDialog,
        deactivateDialog,
        updatingRoleId,
        togglingId,
        handleRoleChange,
        handleActivate,
        handleDeactivateConfirm,
        openReset,
        closeReset,
        openDeactivate,
        closeDeactivate,
    }
}
