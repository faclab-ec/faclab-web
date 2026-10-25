import { useState } from 'react'
import { notifySuccess, notifyError, notifyWarning } from '@shared/ui/notify'
import { isApiError } from '@/utils/errors/ApiError'
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

interface NameDialogState {
    open: boolean
    user: AdminUserResponse | null
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

const closedName: NameDialogState = { open: false, user: null }

type BranchesDialogState = NameDialogState

const closedDeactivate: DeactivateDialogState = {
    open: false,
    userId: null,
    username: '',
}

// faclab-core rejects leaving the system without an active admin
const notifyUserError = (err: unknown, title: string) =>
    isApiError(err) && err.code === 'LAST_ADMIN'
        ? notifyWarning(title, 'Debe quedar al menos un administrador activo')
        : notifyError(err, title)

export function useAdminUserActions() {
    const [resetDialog, setResetDialog] =
        useState<ResetDialogState>(closedReset)
    const [deactivateDialog, setDeactivateDialog] =
        useState<DeactivateDialogState>(closedDeactivate)
    const [nameDialog, setNameDialog] = useState<NameDialogState>(closedName)
    const [branchesDialog, setBranchesDialog] =
        useState<BranchesDialogState>(closedName)
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
            notifyUserError(err, 'Error al actualizar el rol')
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
            notifyUserError(err, 'Error al desactivar el usuario')
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

    const openEditName = (user: AdminUserResponse) =>
        setNameDialog({ open: true, user })
    const closeEditName = () => setNameDialog(closedName)

    const openBranches = (user: AdminUserResponse) =>
        setBranchesDialog({ open: true, user })
    const closeBranches = () => setBranchesDialog(closedName)

    return {
        resetDialog,
        deactivateDialog,
        nameDialog,
        branchesDialog,
        updatingRoleId,
        togglingId,
        handleRoleChange,
        handleActivate,
        handleDeactivateConfirm,
        openReset,
        closeReset,
        openDeactivate,
        closeDeactivate,
        openEditName,
        closeEditName,
        openBranches,
        closeBranches,
    }
}
