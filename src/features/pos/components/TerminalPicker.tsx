import { useNavigate } from 'react-router-dom'
import classNames from 'classnames'
import { HiOutlineDesktopComputer } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { EmptyState } from '@/components/shared'
import LabeledField from '@/components/shared/LabeledField'
import type { BranchSummary } from '@/@types/auth'
import type { PosTerminal } from '../model/types'

const branchLabel = (branch: BranchSummary) =>
    `${branch.establishmentCode} · ${branch.name}`

interface TerminalPickerProps {
    branch: BranchSummary
    /** Sucursales a las que puede entrar el usuario */
    branches: BranchSummary[]
    /** Cajas activas de `branch` */
    terminals: PosTerminal[]
    currentId?: number | null
    onSelectBranch: (branchId: number) => void
    onSelect: (terminal: PosTerminal) => void
    /** Sin él, el botón secundario vuelve al inicio */
    onCancel?: () => void
}

/** Vincula este navegador a una caja de la sucursal. */
const TerminalPicker = ({
    branch,
    branches,
    terminals,
    currentId,
    onSelectBranch,
    onSelect,
    onCancel,
}: TerminalPickerProps) => {
    const navigate = useNavigate()
    const branchOptions = branches.map((b) => ({
        value: b.id,
        label: branchLabel(b),
    }))

    return (
        <div className="flex h-full items-center justify-center overflow-y-auto p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-pop dark:border-gray-700 dark:bg-gray-800 sm:p-8">
                <h1 className="mb-1 text-center text-xl">Elige la caja</h1>
                <p className="mb-6 text-center text-gray-500 dark:text-gray-400">
                    Este navegador queda vinculado a la caja que elijas
                </p>

                {branches.length > 1 ? (
                    <LabeledField label="Sucursal" className="mb-4">
                        <Select
                            isSearchable={false}
                            options={branchOptions}
                            value={branchOptions.find(
                                (o) => o.value === branch.id
                            )}
                            onChange={(option) =>
                                option && onSelectBranch(option.value)
                            }
                        />
                    </LabeledField>
                ) : (
                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                        Sucursal:{' '}
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {branchLabel(branch)}
                        </span>
                    </p>
                )}

                {terminals.length === 0 ? (
                    <EmptyState
                        className="py-6"
                        icon={<HiOutlineDesktopComputer />}
                        title="La sucursal no tiene cajas activas"
                        description="Un administrador puede crearlas en Configuración, Sucursales."
                    />
                ) : (
                    <ul aria-label="Cajas" className="flex flex-col gap-2">
                        {terminals.map((terminal) => {
                            const isCurrent = terminal.id === currentId
                            return (
                                <li key={terminal.id}>
                                    <button
                                        type="button"
                                        aria-current={isCurrent || undefined}
                                        className={classNames(
                                            'flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors duration-150',
                                            isCurrent
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10'
                                                : 'border-gray-200 hover:border-primary-400 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700/50'
                                        )}
                                        onClick={() => onSelect(terminal)}
                                    >
                                        <HiOutlineDesktopComputer
                                            aria-hidden="true"
                                            className="shrink-0 text-2xl text-gray-400"
                                        />
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate font-semibold text-gray-900 dark:text-gray-50">
                                                {terminal.name}
                                            </span>
                                            <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                                                {terminal.code}
                                            </span>
                                        </span>
                                        {isCurrent && (
                                            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
                                                Actual
                                            </span>
                                        )}
                                    </button>
                                </li>
                            )
                        })}
                    </ul>
                )}

                <Button
                    block
                    type="button"
                    variant="default"
                    className="mt-6"
                    onClick={onCancel ?? (() => navigate('/home'))}
                >
                    {onCancel ? 'Cancelar' : 'Volver al inicio'}
                </Button>
            </div>
        </div>
    )
}

export default TerminalPicker
