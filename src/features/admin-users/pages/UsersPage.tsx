import { useState } from 'react'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/shared'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { ROLE_LABELS, ALL_ROLES } from '@/constants/roles.constant'
import type { RoleCode } from '@/constants/roles.constant'
import type { AdminUserResponse } from '@/@types/auth'
import { HiPlus } from 'react-icons/hi'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import generatePassword from '@/utils/generatePassword'
import {
    useAdminUsers,
    useUpdateUserRole,
    useActivateUser,
    useDeactivateUser,
} from '../hooks/useAdminUsers'
import CreateUserModal from '../components/CreateUserModal'
import ResetPasswordModal from '../components/ResetPasswordModal'

const roleOptions = ALL_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
}))

const isActiveOptions = [
    { value: undefined as boolean | undefined, label: 'Todos' },
    { value: true as boolean | undefined, label: 'Activos' },
    { value: false as boolean | undefined, label: 'Inactivos' },
]

const roleFilterOptions = [
    { value: undefined as RoleCode | undefined, label: 'Todos los roles' },
    ...roleOptions.map((o) => ({
        ...o,
        value: o.value as RoleCode | undefined,
    })),
]

const UsersPage = () => {
    const crud = useCrudOperations<AdminUserResponse>()
    const [filterRole, setFilterRole] = useState<RoleCode | undefined>(
        undefined
    )
    const [filterIsActive, setFilterIsActive] = useState<boolean | undefined>(
        undefined
    )

    const [resetDialog, setResetDialog] = useState<{
        open: boolean
        user: AdminUserResponse | null
        defaultPassword: string
    }>({
        open: false,
        user: null,
        defaultPassword: '',
    })
    const [deactivateDialog, setDeactivateDialog] = useState<{
        open: boolean
        userId: number | null
        username: string
    }>({ open: false, userId: null, username: '' })

    const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null)
    const [togglingId, setTogglingId] = useState<number | null>(null)

    const offset = (crud.pageIndex - 1) * crud.pageSize
    const { data: usersData, isLoading } = useAdminUsers({
        limit: crud.pageSize,
        offset,
        role: filterRole,
        isActive: filterIsActive,
    })
    const items = usersData?.data ?? []
    const total = usersData?.total ?? 0

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
        setDeactivateDialog({ open: false, userId: null, username: '' })
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

    const closeDeactivateDialog = () =>
        setDeactivateDialog({ open: false, userId: null, username: '' })

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '—'
        return new Date(dateStr).toLocaleString('es-EC', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const columns: ColumnDef<AdminUserResponse>[] = [
        {
            header: 'Usuario',
            accessorKey: 'username',
            cell: (props) => (
                <div>
                    <p className="font-semibold">
                        {props.row.original.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {props.row.original.email}
                    </p>
                </div>
            ),
        },
        {
            header: 'Rol',
            accessorKey: 'role',
            cell: (props) => {
                const user = props.row.original
                const isUpdating = updatingRoleId === user.id
                return (
                    <Select
                        size="sm"
                        className="min-w-[150px]"
                        isDisabled={isUpdating}
                        options={roleOptions}
                        value={
                            roleOptions.find((o) => o.value === user.role) ??
                            null
                        }
                        onChange={(opt) => {
                            if (opt && opt.value !== user.role) {
                                handleRoleChange(user.id, opt.value as RoleCode)
                            }
                        }}
                    />
                )
            },
        },
        {
            header: 'Estado',
            accessorKey: 'isActive',
            cell: (props) =>
                props.row.original.isActive ? (
                    <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 rounded text-xs font-medium">
                        Activo
                    </span>
                ) : (
                    <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded text-xs font-medium">
                        Inactivo
                    </span>
                ),
        },
        {
            header: 'Último acceso',
            accessorKey: 'lastLoginAt',
            cell: (props) => (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(props.row.original.lastLoginAt)}
                </span>
            ),
        },
        {
            header: 'Acciones',
            id: 'actions',
            cell: (props) => {
                const user = props.row.original
                const isToggling = togglingId === user.id
                return (
                    <div className="flex gap-1 flex-wrap">
                        <Button
                            size="xs"
                            variant="plain"
                            onClick={() =>
                                setResetDialog({
                                    open: true,
                                    user,
                                    defaultPassword: generatePassword(),
                                })
                            }
                        >
                            Resetear
                        </Button>
                        {user.isActive ? (
                            <Button
                                size="xs"
                                variant="plain"
                                loading={isToggling}
                                onClick={() =>
                                    setDeactivateDialog({
                                        open: true,
                                        userId: user.id,
                                        username: user.username,
                                    })
                                }
                            >
                                Desactivar
                            </Button>
                        ) : (
                            <Button
                                size="xs"
                                variant="solid"
                                loading={isToggling}
                                onClick={() => handleActivate(user.id)}
                            >
                                Activar
                            </Button>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <>
            <Card>
                <div className="p-4">
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
                        <div>
                            <h4 className="text-lg font-semibold">Usuarios</h4>
                            <p className="text-sm text-gray-500 mt-1">
                                Gestiona los usuarios del sistema
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Select
                                isClearable
                                size="sm"
                                className="min-w-[160px]"
                                placeholder="Todos los roles"
                                options={roleFilterOptions.slice(1)}
                                value={
                                    roleFilterOptions.find(
                                        (o) => o.value === filterRole
                                    ) ?? null
                                }
                                onChange={(opt) => {
                                    setFilterRole(opt?.value)
                                    crud.onPaginationChange(1, crud.pageSize)
                                }}
                            />
                            <Select
                                size="sm"
                                className="min-w-[130px]"
                                options={isActiveOptions}
                                value={
                                    isActiveOptions.find(
                                        (o) => o.value === filterIsActive
                                    ) ?? isActiveOptions[0]
                                }
                                onChange={(opt) => {
                                    setFilterIsActive(opt?.value)
                                    crud.onPaginationChange(1, crud.pageSize)
                                }}
                            />
                            <Button
                                variant="solid"
                                size="sm"
                                icon={<HiPlus />}
                                onClick={crud.openCreate}
                            >
                                Nuevo usuario
                            </Button>
                        </div>
                    </div>

                    <DataTable
                        columns={columns}
                        data={items}
                        loading={isLoading}
                        pagingData={{
                            total,
                            pageIndex: crud.pageIndex,
                            pageSize: crud.pageSize,
                        }}
                        onPaginationChange={(idx) =>
                            crud.onPaginationChange(idx, crud.pageSize)
                        }
                        onSelectChange={(size) =>
                            crud.onPaginationChange(1, size)
                        }
                    />
                </div>
            </Card>

            <CreateUserModal open={crud.isCreateOpen} onClose={crud.closeAll} />

            {resetDialog.open && (
                <ResetPasswordModal
                    open={resetDialog.open}
                    user={resetDialog.user}
                    defaultPassword={resetDialog.defaultPassword}
                    onClose={() =>
                        setResetDialog({
                            open: false,
                            user: null,
                            defaultPassword: '',
                        })
                    }
                />
            )}

            <ConfirmDialog
                isOpen={deactivateDialog.open}
                type="danger"
                title="Desactivar usuario"
                confirmText="Desactivar"
                cancelText="Cancelar"
                confirmButtonColor="red-600"
                onClose={closeDeactivateDialog}
                onCancel={closeDeactivateDialog}
                onConfirm={handleDeactivateConfirm}
            >
                <p>
                    ¿Desactivar a <strong>{deactivateDialog.username}</strong>?
                    Su sesión activa seguirá funcionando hasta que expire el
                    token.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default UsersPage
