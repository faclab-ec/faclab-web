import { useState } from 'react'
import DataTable, { ColumnDef } from '@/components/shared/DataTable'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import LabeledField from '@/components/shared/LabeledField'
import PageHeader from '@/components/shared/PageHeader'
import { HiOutlineEye } from 'react-icons/hi'
import { formatDatetime } from '@shared/lib/format'
import { useAdminUsers } from '@features/admin-users'
import { useBranchesList } from '@features/organization'
import { useAuditLog } from '../hooks/useAuditLog'
import AuditEntryDialog from '../components/AuditEntryDialog'
import {
    AUDIT_ACTIONS,
    AUDIT_ACTION_LABELS,
    AUDIT_RESOURCE_LABELS,
    AUDIT_SOURCE_LABELS,
    type AuditAction,
    type AuditEntry,
} from '../model/types'

interface Option<T> {
    value: T | undefined
    label: string
}

const ALL = 'Todos'

const actionOptions: Option<AuditAction>[] = [
    { value: undefined, label: ALL },
    ...AUDIT_ACTIONS.map((action) => ({
        value: action,
        label: AUDIT_ACTION_LABELS[action],
    })),
]

const resourceOptions: Option<string>[] = [
    { value: undefined, label: ALL },
    ...Object.entries(AUDIT_RESOURCE_LABELS).map(([value, label]) => ({
        value,
        label,
    })),
]

const AuditLogPage = () => {
    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')
    const [actorId, setActorId] = useState<number | undefined>()
    const [action, setAction] = useState<AuditAction | undefined>()
    const [resourceType, setResourceType] = useState<string | undefined>()
    const [branchId, setBranchId] = useState<number | undefined>()
    const [pageIndex, setPageIndex] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [selected, setSelected] = useState<AuditEntry | null>(null)

    const { data, isLoading, error, refetch } = useAuditLog({
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
        actorId,
        action,
        resourceType,
        branchId,
        limit: pageSize,
        offset: (pageIndex - 1) * pageSize,
    })
    const entries = data?.items ?? []
    const total = data?.pagination?.total ?? 0

    const { data: users } = useAdminUsers({ limit: 1000 })
    const { data: branches } = useBranchesList({ limit: 1000 })

    const userOptions: Option<number>[] = [
        { value: undefined, label: ALL },
        ...(users?.items ?? []).map((user) => ({
            value: user.id,
            label: user.fullName
                ? `${user.fullName} (${user.username})`
                : user.username,
        })),
    ]
    const branchOptions: Option<number>[] = [
        { value: undefined, label: 'Todas' },
        ...(branches?.items ?? []).map((branch) => ({
            value: branch.id,
            label: `${branch.establishmentCode} · ${branch.name}`,
        })),
    ]
    const branchName = (id: number | null) =>
        id === null
            ? '—'
            : branchOptions.find((option) => option.value === id)?.label ??
              `#${id}`

    const filtered =
        <T,>(set: (value: T | undefined) => void) =>
        (option: Option<T> | null) => {
            set(option?.value)
            setPageIndex(1)
        }

    const clearFilters = () => {
        setFromDate('')
        setToDate('')
        setActorId(undefined)
        setAction(undefined)
        setResourceType(undefined)
        setBranchId(undefined)
        setPageIndex(1)
    }

    const columns: ColumnDef<AuditEntry>[] = [
        {
            header: 'Fecha',
            id: 'occurredAt',
            cell: (props) => (
                <span className="whitespace-nowrap text-sm">
                    {formatDatetime(props.row.original.occurredAt)}
                </span>
            ),
        },
        {
            header: 'Usuario',
            id: 'actor',
            cell: (props) => {
                const entry = props.row.original
                return entry.actorName ?? AUDIT_SOURCE_LABELS[entry.source]
            },
        },
        {
            header: 'Acción',
            id: 'action',
            cell: (props) =>
                AUDIT_ACTION_LABELS[props.row.original.action] ??
                props.row.original.action,
        },
        {
            header: 'Recurso',
            id: 'resource',
            cell: (props) => {
                const entry = props.row.original
                const kind =
                    AUDIT_RESOURCE_LABELS[entry.resourceType] ??
                    entry.resourceType
                return entry.resourceId ? `${kind} #${entry.resourceId}` : kind
            },
        },
        {
            header: 'Sucursal',
            id: 'branch',
            cell: (props) => branchName(props.row.original.branchId),
        },
        {
            header: 'Detalle',
            id: 'actions',
            cell: (props) => (
                <Button
                    size="sm"
                    variant="plain"
                    aria-label="Ver detalle"
                    icon={<HiOutlineEye />}
                    onClick={() => setSelected(props.row.original)}
                />
            ),
        },
    ]

    return (
        <>
            <PageHeader
                title="Bitácora de auditoría"
                description="Operaciones sensibles de la empresa: quién las hizo, sobre qué y qué cambió. Las entradas no se modifican ni se borran."
                actions={
                    <Button size="sm" onClick={clearFilters}>
                        Limpiar filtros
                    </Button>
                }
            />
            <Card className="mb-4">
                <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <LabeledField label="Desde">
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value)
                                setPageIndex(1)
                            }}
                        />
                    </LabeledField>
                    <LabeledField label="Hasta">
                        <Input
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value)
                                setPageIndex(1)
                            }}
                        />
                    </LabeledField>
                    <LabeledField label="Usuario">
                        <Select
                            options={userOptions}
                            value={userOptions.find((o) => o.value === actorId)}
                            onChange={filtered(setActorId)}
                        />
                    </LabeledField>
                    <LabeledField label="Acción">
                        <Select
                            options={actionOptions}
                            value={actionOptions.find(
                                (o) => o.value === action
                            )}
                            onChange={filtered(setAction)}
                        />
                    </LabeledField>
                    <LabeledField label="Recurso">
                        <Select
                            options={resourceOptions}
                            value={resourceOptions.find(
                                (o) => o.value === resourceType
                            )}
                            onChange={filtered(setResourceType)}
                        />
                    </LabeledField>
                    <LabeledField label="Sucursal">
                        <Select
                            options={branchOptions}
                            value={branchOptions.find(
                                (o) => o.value === branchId
                            )}
                            onChange={filtered(setBranchId)}
                        />
                    </LabeledField>
                </div>
            </Card>

            <Card bodyClass="p-0">
                <DataTable
                    columns={columns}
                    data={entries}
                    loading={isLoading}
                    error={error}
                    pagingData={{ total, pageIndex, pageSize }}
                    onRetry={refetch}
                    onPaginationChange={setPageIndex}
                    onSelectChange={(size) => {
                        setPageSize(size)
                        setPageIndex(1)
                    }}
                />
            </Card>

            <AuditEntryDialog
                entry={selected}
                branchName={branchName}
                onClose={() => setSelected(null)}
            />
        </>
    )
}

export default AuditLogPage
