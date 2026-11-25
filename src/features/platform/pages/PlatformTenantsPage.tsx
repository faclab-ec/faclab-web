import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiOutlinePlus } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { DataTable, PageHeader, StatusBadge } from '@/components/shared'
import type { ColumnDef } from '@/components/shared/DataTable'
import ListSearchInput from '@shared/ui/ListSearchInput'
import { useDebouncedValue } from '@shared/hooks/useDebouncedValue'
import { formatDate } from '@shared/lib/format'
import CreateTenantDialog from '../components/CreateTenantDialog'
import { useTenants } from '../hooks/usePlatform'
import {
    PLATFORM_SUBSCRIPTION_STATUS_LABELS,
    TENANT_STATUS_LABELS,
    TENANT_STATUS_TONES,
    type TenantStatus,
    type TenantSummary,
} from '../model/types'

const PAGE_SIZE = 20

const STATUS_OPTIONS: { value: TenantStatus | ''; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'active', label: TENANT_STATUS_LABELS.active },
    { value: 'suspended', label: TENANT_STATUS_LABELS.suspended },
]

/** Las empresas de la plataforma: lista, filtros y alta (S8.5). */
const PlatformTenantsPage = () => {
    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [status, setStatus] = useState<TenantStatus | ''>('')
    const [page, setPage] = useState(1)
    const [creating, setCreating] = useState(false)
    const q = useDebouncedValue(search, 300)
    const { data, isLoading, error, refetch } = useTenants({
        q: q || undefined,
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
    })

    const columns: ColumnDef<TenantSummary>[] = [
        { header: 'RUC', accessorKey: 'ruc' },
        {
            header: 'Empresa',
            accessorKey: 'legalName',
            cell: ({ row }) => (
                <button
                    type="button"
                    className="text-left font-semibold text-primary hover:underline"
                    onClick={() =>
                        navigate(`/platform/tenants/${row.original.id}`)
                    }
                >
                    {row.original.tradeName || row.original.legalName}
                </button>
            ),
        },
        {
            header: 'Estado',
            accessorKey: 'status',
            cell: ({ row }) => (
                <StatusBadge tone={TENANT_STATUS_TONES[row.original.status]}>
                    {TENANT_STATUS_LABELS[row.original.status]}
                </StatusBadge>
            ),
        },
        {
            header: 'Plan',
            accessorKey: 'plan',
            cell: ({ row }) =>
                row.original.plan
                    ? `${row.original.plan.name}${
                          row.original.subscriptionStatus
                              ? ` · ${
                                    PLATFORM_SUBSCRIPTION_STATUS_LABELS[
                                        row.original.subscriptionStatus
                                    ]
                                }`
                              : ''
                      }`
                    : '—',
        },
        { header: 'Usuarios', accessorKey: 'activeUsers' },
        { header: 'Sucursales', accessorKey: 'activeBranches' },
        {
            header: 'Alta',
            accessorKey: 'createdAt',
            cell: ({ row }) =>
                row.original.createdAt
                    ? formatDate(row.original.createdAt)
                    : '—',
        },
    ]

    return (
        <>
            <PageHeader
                title="Empresas"
                description="Las empresas de la plataforma: su plan, su uso y su estado."
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlinePlus />}
                        onClick={() => setCreating(true)}
                    >
                        Nueva empresa
                    </Button>
                }
            />
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <ListSearchInput
                    value={search}
                    placeholder="Buscar por RUC o nombre"
                    onChange={(value) => {
                        setSearch(value)
                        setPage(1)
                    }}
                />
                <Select
                    size="sm"
                    className="w-full sm:w-48"
                    isSearchable={false}
                    options={STATUS_OPTIONS}
                    value={STATUS_OPTIONS.find((o) => o.value === status)}
                    onChange={(option) => {
                        setStatus((option?.value ?? '') as TenantStatus | '')
                        setPage(1)
                    }}
                />
            </div>
            <DataTable
                columns={columns}
                data={data?.items ?? []}
                loading={isLoading}
                error={error}
                pagingData={{
                    total: data?.total ?? 0,
                    pageIndex: page,
                    pageSize: PAGE_SIZE,
                }}
                onRetry={refetch}
                onPaginationChange={setPage}
            />
            <CreateTenantDialog
                open={creating}
                onClose={() => setCreating(false)}
            />
        </>
    )
}

export default PlatformTenantsPage
