import {
    useMemo,
    useRef,
    useEffect,
    useState,
    useImperativeHandle,
} from 'react'
import classNames from 'classnames'
import Table from '@/components/ui/Table'
import Pagination from '@/components/ui/Pagination'
import Select from '@/components/ui/Select'
import Checkbox from '@/components/ui/Checkbox'
import TableRowSkeleton from './loaders/TableRowSkeleton'
import Loading from './Loading'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    ColumnDef,
    ColumnSort,
    Row,
    CellContext,
} from '@tanstack/react-table'
import type { SkeletonProps } from '@/components/ui/Skeleton'
import type { ForwardedRef, ChangeEvent, ReactNode, Ref } from 'react'
import type { CheckboxProps } from '@/components/ui/Checkbox'

export type OnSortParam = { order: 'asc' | 'desc' | ''; key: string | number }

type DataTableProps<T> = {
    columns: ColumnDef<T>[]
    data?: unknown[]
    loading?: boolean
    /** Error de la consulta: en lugar de una tabla vacía se avisa del fallo */
    error?: unknown
    onRetry?: () => void
    /** Qué mostrar cuando no hay filas (por defecto, un aviso genérico) */
    emptyState?: ReactNode
    onCheckBoxChange?: (checked: boolean, row: T) => void
    onIndeterminateCheckBoxChange?: (checked: boolean, rows: Row<T>[]) => void
    onPaginationChange?: (page: number) => void
    onSelectChange?: (num: number) => void
    /** El orden lo resuelve el servidor: sin este callback no hay ordenamiento */
    onSort?: (sort: OnSortParam) => void
    pageSizes?: number[]
    selectable?: boolean
    skeletonAvatarColumns?: number[]
    skeletonAvatarProps?: SkeletonProps
    pagingData?: {
        total: number
        pageIndex: number
        pageSize: number
    }
}

type CheckBoxChangeEvent = ChangeEvent<HTMLInputElement>

interface IndeterminateCheckboxProps extends Omit<CheckboxProps, 'onChange'> {
    onChange: (event: CheckBoxChangeEvent) => void
    indeterminate: boolean
    onCheckBoxChange?: (event: CheckBoxChangeEvent) => void
    onIndeterminateCheckBoxChange?: (event: CheckBoxChangeEvent) => void
}

const { Tr, Th, Td, THead, TBody, Sorter } = Table

const SKELETON_ROWS = 5

const IndeterminateCheckbox = (props: IndeterminateCheckboxProps) => {
    const {
        indeterminate,
        onChange,
        onCheckBoxChange,
        onIndeterminateCheckBoxChange,
        ...rest
    } = props

    const ref = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (typeof indeterminate === 'boolean' && ref.current) {
            ref.current.indeterminate = !rest.checked && indeterminate
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, indeterminate])

    const handleChange = (e: CheckBoxChangeEvent) => {
        onChange(e)
        onCheckBoxChange?.(e)
        onIndeterminateCheckBoxChange?.(e)
    }

    return (
        <Checkbox
            ref={ref}
            className="mb-0"
            onChange={(_, e) => handleChange(e)}
            {...rest}
        />
    )
}

const ARIA_SORT = {
    asc: 'ascending',
    desc: 'descending',
} as const

export type DataTableResetHandle = {
    resetSorting: () => void
    resetSelected: () => void
}

function DataTable<T>(
    props: DataTableProps<T> & { ref?: Ref<DataTableResetHandle> }
) {
    const {
        skeletonAvatarColumns,
        columns: columnsProp = [],
        data = [],
        loading = false,
        error,
        onRetry,
        emptyState,
        onCheckBoxChange,
        onIndeterminateCheckBoxChange,
        onPaginationChange,
        onSelectChange,
        onSort,
        pageSizes = [10, 25, 50, 100],
        ref,
        selectable = false,
        skeletonAvatarProps,
        pagingData = {
            total: 0,
            pageIndex: 1,
            pageSize: 10,
        },
    } = props

    const { pageSize, pageIndex, total } = pagingData

    const [sorting, setSorting] = useState<ColumnSort[] | null>(null)

    const pageSizeOption = useMemo(
        () =>
            pageSizes.map((number) => ({
                value: number,
                label: `${number} / página`,
            })),
        [pageSizes]
    )

    const handleCheckBoxChange = (checked: boolean, row: T) => {
        if (!loading) {
            onCheckBoxChange?.(checked, row)
        }
    }

    const handleIndeterminateCheckBoxChange = (
        checked: boolean,
        rows: Row<T>[]
    ) => {
        if (!loading) {
            onIndeterminateCheckBoxChange?.(checked, rows)
        }
    }

    const handlePaginationChange = (page: number) => {
        if (!loading) {
            onPaginationChange?.(page)
        }
    }

    const handleSelectChange = (value?: number) => {
        if (!loading) {
            onSelectChange?.(Number(value))
        }
    }

    useEffect(() => {
        if (Array.isArray(sorting)) {
            const sortOrder =
                sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : ''
            const id = sorting.length > 0 ? sorting[0].id : ''
            onSort?.({ order: sortOrder, key: id })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sorting])

    const finalColumns: ColumnDef<T>[] = useMemo(() => {
        const columns = columnsProp

        if (selectable) {
            return [
                {
                    id: 'select',
                    header: ({ table }) => (
                        <IndeterminateCheckbox
                            checked={table.getIsAllRowsSelected()}
                            indeterminate={table.getIsSomeRowsSelected()}
                            onChange={table.getToggleAllRowsSelectedHandler()}
                            onIndeterminateCheckBoxChange={(e) => {
                                handleIndeterminateCheckBoxChange(
                                    e.target.checked,
                                    table.getRowModel().rows
                                )
                            }}
                        />
                    ),
                    cell: ({ row }) => (
                        <IndeterminateCheckbox
                            checked={row.getIsSelected()}
                            disabled={!row.getCanSelect()}
                            indeterminate={row.getIsSomeSelected()}
                            onChange={row.getToggleSelectedHandler()}
                            onCheckBoxChange={(e) =>
                                handleCheckBoxChange(
                                    e.target.checked,
                                    row.original
                                )
                            }
                        />
                    ),
                },
                ...columns,
            ]
        }
        return columns
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columnsProp, selectable])

    // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table v8 returns non-memoizable functions; React Compiler skip is expected.
    const table = useReactTable({
        data,
        // eslint-disable-next-line  @typescript-eslint/no-explicit-any
        columns: finalColumns as ColumnDef<unknown | object | any[], any>[],
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: true,
        manualSorting: true,
        // Un encabezado ordenable que no ordena nada confunde: solo se
        // ofrece cuando la página envía el orden al servidor.
        enableSorting: !!onSort,
        onSortingChange: (sorter) => {
            setSorting(sorter as ColumnSort[])
        },
        state: {
            sorting: sorting as ColumnSort[],
        },
    })

    const resetSorting = () => {
        table.resetSorting()
    }

    const resetSelected = () => {
        table.toggleAllRowsSelected(false)
    }

    useImperativeHandle(ref as ForwardedRef<DataTableResetHandle>, () => ({
        resetSorting,
        resetSelected,
    }))

    if (error && !loading) {
        return <ErrorState error={error} onRetry={onRetry} />
    }

    const isFirstLoad = loading && data.length === 0
    const isEmpty = !loading && data.length === 0
    const columnCount = (finalColumns as Array<T>).length
    const firstRow = total === 0 ? 0 : (pageIndex - 1) * pageSize + 1
    const lastRow = Math.min(pageIndex * pageSize, total)

    return (
        <Loading loading={loading && data.length !== 0} type="cover">
            <div className="overflow-hidden rounded-t-xl">
                <Table aria-busy={loading}>
                    <THead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <Tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    const canSort = header.column.getCanSort()
                                    const sorted = header.column.getIsSorted()
                                    const label = header.isPlaceholder
                                        ? null
                                        : flexRender(
                                              header.column.columnDef.header,
                                              header.getContext()
                                          )

                                    return (
                                        <Th
                                            key={header.id}
                                            colSpan={header.colSpan}
                                            aria-sort={
                                                sorted
                                                    ? ARIA_SORT[sorted]
                                                    : undefined
                                            }
                                        >
                                            {canSort ? (
                                                <button
                                                    type="button"
                                                    className={classNames(
                                                        'inline-flex items-center gap-1 uppercase tracking-wider',
                                                        loading &&
                                                            'pointer-events-none'
                                                    )}
                                                    onClick={header.column.getToggleSortingHandler()}
                                                >
                                                    {label}
                                                    <Sorter sort={sorted} />
                                                </button>
                                            ) : (
                                                label
                                            )}
                                        </Th>
                                    )
                                })}
                            </Tr>
                        ))}
                    </THead>
                    {isFirstLoad ? (
                        <TableRowSkeleton
                            columns={columnCount}
                            rows={Math.min(pageSize, SKELETON_ROWS)}
                            avatarInColumns={skeletonAvatarColumns}
                            avatarProps={skeletonAvatarProps}
                        />
                    ) : (
                        <TBody>
                            {isEmpty && (
                                <Tr>
                                    <Td colSpan={columnCount} className="!p-0">
                                        {emptyState ?? <EmptyState />}
                                    </Td>
                                </Tr>
                            )}
                            {table
                                .getRowModel()
                                .rows.slice(0, pageSize)
                                .map((row) => {
                                    return (
                                        <Tr key={row.id}>
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => {
                                                    return (
                                                        <Td key={cell.id}>
                                                            {flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext()
                                                            )}
                                                        </Td>
                                                    )
                                                })}
                                        </Tr>
                                    )
                                })}
                        </TBody>
                    )}
                </Table>
            </div>
            {total > 0 && (
                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-gray-500 dark:text-gray-400">
                        Mostrando {firstRow}–{lastRow} de {total}
                    </p>
                    <div className="flex flex-wrap items-center gap-3">
                        <Pagination
                            pageSize={pageSize}
                            currentPage={pageIndex}
                            total={total}
                            onChange={handlePaginationChange}
                        />
                        <div style={{ minWidth: 132 }}>
                            <Select
                                aria-label="Filas por página"
                                size="sm"
                                menuPlacement="top"
                                isSearchable={false}
                                value={pageSizeOption.filter(
                                    (option) => option.value === pageSize
                                )}
                                options={pageSizeOption}
                                onChange={(option) =>
                                    handleSelectChange(option?.value)
                                }
                            />
                        </div>
                    </div>
                </div>
            )}
        </Loading>
    )
}

export type { ColumnDef, Row, CellContext }
export default DataTable
