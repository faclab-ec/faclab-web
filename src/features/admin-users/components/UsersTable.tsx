import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { ROLE_LABELS, ALL_ROLES } from '@/constants/roles.constant'
import type { RoleCode } from '@/constants/roles.constant'
import type { AdminUserResponse } from '@/@types/auth'
import { ActiveBadge } from '@/components/shared/StatusBadge'

const roleOptions = ALL_ROLES.map((role) => ({
    value: role,
    label: ROLE_LABELS[role],
}))

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

interface UsersTableProps {
    items: AdminUserResponse[]
    isLoading: boolean
    pageIndex: number
    pageSize: number
    total: number
    onPaginationChange: (idx: number) => void
    onSelectChange: (size: number) => void
    updatingRoleId: number | null
    togglingId: number | null
    onRoleChange: (userId: number, role: RoleCode) => void
    onReset: (user: AdminUserResponse) => void
    onEditName: (user: AdminUserResponse) => void
    onBranches: (user: AdminUserResponse) => void
    onDeactivate: (user: AdminUserResponse) => void
    onActivate: (userId: number) => void
}

const UsersTable = ({
    items,
    isLoading,
    pageIndex,
    pageSize,
    total,
    onPaginationChange,
    onSelectChange,
    updatingRoleId,
    togglingId,
    onRoleChange,
    onReset,
    onEditName,
    onBranches,
    onDeactivate,
    onActivate,
}: UsersTableProps) => {
    const columns: ColumnDef<AdminUserResponse>[] = [
        {
            header: 'Usuario',
            accessorKey: 'username',
            cell: (props) => {
                const user = props.row.original
                return (
                    <div>
                        <p className="font-semibold">
                            {user.fullName || user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.fullName
                                ? `${user.username} · ${user.email}`
                                : user.email}
                        </p>
                    </div>
                )
            },
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
                                onRoleChange(user.id, opt.value as RoleCode)
                            }
                        }}
                    />
                )
            },
        },
        {
            header: 'Estado',
            accessorKey: 'isActive',
            cell: (props) => (
                <ActiveBadge active={props.row.original.isActive} />
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
                            onClick={() => onEditName(user)}
                        >
                            Editar nombre
                        </Button>
                        <Button
                            size="xs"
                            variant="plain"
                            onClick={() => onBranches(user)}
                        >
                            Sucursales
                        </Button>
                        <Button
                            size="xs"
                            variant="plain"
                            onClick={() => onReset(user)}
                        >
                            Resetear
                        </Button>
                        {user.isActive ? (
                            <Button
                                size="xs"
                                variant="plain"
                                loading={isToggling}
                                onClick={() => onDeactivate(user)}
                            >
                                Desactivar
                            </Button>
                        ) : (
                            <Button
                                size="xs"
                                variant="solid"
                                loading={isToggling}
                                onClick={() => onActivate(user.id)}
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
        <DataTable
            columns={columns}
            data={items}
            loading={isLoading}
            pagingData={{ total, pageIndex, pageSize }}
            onPaginationChange={(idx) => onPaginationChange(idx)}
            onSelectChange={(size) => onSelectChange(size)}
        />
    )
}

export default UsersTable
