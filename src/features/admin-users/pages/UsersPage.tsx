import { useState } from 'react'
import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { ConfirmDialog } from '@/components/shared'
import { ROLE_LABELS, ALL_ROLES } from '@/constants/roles.constant'
import type { RoleCode } from '@/constants/roles.constant'
import type { AdminUserResponse } from '@/@types/auth'
import { HiPlus } from 'react-icons/hi'
import useCrudOperations from '@shared/hooks/useCrudOperations'
import { useAdminUsers } from '../hooks/useAdminUsers'
import { useAdminUserActions } from '../hooks/useAdminUserActions'
import CreateUserModal from '../components/CreateUserModal'
import ResetPasswordModal from '../components/ResetPasswordModal'
import EditNameModal from '../components/EditNameModal'
import BranchAccessModal from '../components/BranchAccessModal'
import UsersTable from '../components/UsersTable'

const roleFilterOptions = ALL_ROLES.map((role) => ({
    value: role as RoleCode | undefined,
    label: ROLE_LABELS[role],
}))

const isActiveOptions = [
    { value: undefined as boolean | undefined, label: 'Todos' },
    { value: true as boolean | undefined, label: 'Activos' },
    { value: false as boolean | undefined, label: 'Inactivos' },
]

const UsersPage = () => {
    const crud = useCrudOperations<AdminUserResponse>()
    const [filterRole, setFilterRole] = useState<RoleCode | undefined>(
        undefined
    )
    const [filterIsActive, setFilterIsActive] = useState<boolean | undefined>(
        undefined
    )

    const offset = (crud.pageIndex - 1) * crud.pageSize
    const { data: usersData, isLoading } = useAdminUsers({
        limit: crud.pageSize,
        offset,
        role: filterRole,
        isActive: filterIsActive,
    })
    const items = usersData?.items ?? []
    const total = usersData?.pagination.total ?? 0

    const actions = useAdminUserActions()

    return (
        <>
            <PageHeader
                title="Usuarios"
                description="Gestiona los usuarios del sistema"
                actions={
                    <>
                        <Select
                            isClearable
                            size="sm"
                            className="min-w-[160px]"
                            placeholder="Todos los roles"
                            options={roleFilterOptions}
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
                    </>
                }
            />
            <Card>
                <UsersTable
                    items={items}
                    isLoading={isLoading}
                    pageIndex={crud.pageIndex}
                    pageSize={crud.pageSize}
                    total={total}
                    updatingRoleId={actions.updatingRoleId}
                    togglingId={actions.togglingId}
                    onPaginationChange={(idx) =>
                        crud.onPaginationChange(idx, crud.pageSize)
                    }
                    onSelectChange={(size) => crud.onPaginationChange(1, size)}
                    onRoleChange={actions.handleRoleChange}
                    onReset={actions.openReset}
                    onEditName={actions.openEditName}
                    onBranches={actions.openBranches}
                    onDeactivate={actions.openDeactivate}
                    onActivate={actions.handleActivate}
                />
            </Card>

            <CreateUserModal open={crud.isCreateOpen} onClose={crud.closeAll} />

            {actions.nameDialog.user && (
                <EditNameModal
                    open={actions.nameDialog.open}
                    user={actions.nameDialog.user}
                    onClose={actions.closeEditName}
                />
            )}

            {actions.branchesDialog.user && (
                <BranchAccessModal
                    open={actions.branchesDialog.open}
                    user={actions.branchesDialog.user}
                    onClose={actions.closeBranches}
                />
            )}

            {actions.resetDialog.open && (
                <ResetPasswordModal
                    open={actions.resetDialog.open}
                    user={actions.resetDialog.user}
                    defaultPassword={actions.resetDialog.defaultPassword}
                    onClose={actions.closeReset}
                />
            )}

            <ConfirmDialog
                isOpen={actions.deactivateDialog.open}
                type="danger"
                title="Desactivar usuario"
                confirmText="Desactivar"
                cancelText="Cancelar"
                confirmButtonColor="red-600"
                onClose={actions.closeDeactivate}
                onCancel={actions.closeDeactivate}
                onConfirm={actions.handleDeactivateConfirm}
            >
                <p>
                    ¿Desactivar a{' '}
                    <strong>{actions.deactivateDialog.username}</strong>? Su
                    sesión activa seguirá funcionando hasta que expire el token.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default UsersPage
