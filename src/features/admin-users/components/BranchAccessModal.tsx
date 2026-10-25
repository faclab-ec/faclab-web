import { useState } from 'react'
import FormModal from '@/components/shared/FormModal'
import Checkbox from '@/components/ui/Checkbox'
import Spinner from '@/components/ui/Spinner'
import Switcher from '@/components/ui/Switcher'
import { ErrorState } from '@/components/shared'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useBranchesList, type Branch } from '@features/organization'
import type { AdminUserResponse } from '@/@types/auth'
import { useUpdateUserBranches, useUserBranches } from '../hooks/useAdminUsers'

interface BranchAccessModalProps {
    open: boolean
    user: AdminUserResponse
    onClose: () => void
}

const FORM_ID = 'user-branch-access'

/** A qué sucursales puede entrar un usuario en esta empresa. */
const BranchAccessModal = ({ open, user, onClose }: BranchAccessModalProps) => {
    const access = useUserBranches(user.id)
    const branches = useBranchesList({ limit: 1000 })
    const update = useUpdateUserBranches()
    const title = `Sucursales de ${user.fullName || user.username}`

    const error = access.error ?? branches.error
    const loaded = access.data && branches.data

    return (
        <FormModal
            isOpen={open}
            title={title}
            formId={loaded ? FORM_ID : undefined}
            width={520}
            isSubmitting={update.isPending}
            onClose={onClose}
        >
            {error ? (
                <ErrorState
                    error={error}
                    onRetry={() => {
                        access.refetch()
                        branches.refetch()
                    }}
                />
            ) : loaded ? (
                <BranchAccessForm
                    branches={branches.data.items}
                    initialBranchIds={access.data.branchIds}
                    onSubmit={async (branchIds) => {
                        try {
                            await update.mutateAsync({ id: user.id, branchIds })
                            notifySuccess(
                                'Sucursales actualizadas',
                                'Rigen desde su próximo inicio de sesión o renovación de sesión'
                            )
                            onClose()
                        } catch (err) {
                            notifyError(
                                err,
                                'No se pudieron guardar las sucursales'
                            )
                        }
                    }}
                />
            ) : (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            )}
        </FormModal>
    )
}

interface BranchAccessFormProps {
    branches: Branch[]
    /** Vacío: todas */
    initialBranchIds: number[]
    onSubmit: (branchIds: number[]) => void
}

const BranchAccessForm = ({
    branches,
    initialBranchIds,
    onSubmit,
}: BranchAccessFormProps) => {
    const [all, setAll] = useState(initialBranchIds.length === 0)
    const [selected, setSelected] = useState(() => new Set(initialBranchIds))
    const [invalid, setInvalid] = useState(false)

    const toggle = (branchId: number, checked: boolean) => {
        const next = new Set(selected)
        if (checked) next.add(branchId)
        else next.delete(branchId)
        setSelected(next)
        setInvalid(false)
    }

    return (
        <form
            id={FORM_ID}
            onSubmit={(e) => {
                e.preventDefault()
                if (!all && selected.size === 0) {
                    setInvalid(true)
                    return
                }
                onSubmit(all ? [] : [...selected].sort((a, b) => a - b))
            }}
        >
            <div className="mb-4 flex items-center gap-3">
                <Switcher
                    id="all-branches"
                    checked={all}
                    onChange={(checked) => {
                        setAll(checked)
                        setInvalid(false)
                    }}
                />
                <label htmlFor="all-branches">
                    <span className="block font-semibold">
                        Todas las sucursales
                    </span>
                    <span className="block text-sm text-gray-500 dark:text-gray-400">
                        También las que se creen después
                    </span>
                </label>
            </div>
            <fieldset disabled={all} className="flex flex-col gap-2">
                <legend className="sr-only">Sucursales permitidas</legend>
                {branches.map((branch) => (
                    <Checkbox
                        key={branch.id}
                        checked={all || selected.has(branch.id)}
                        disabled={all}
                        onChange={(checked) => toggle(branch.id, checked)}
                    >
                        {branch.establishmentCode} · {branch.name}
                        {!branch.isActive && ' (inactiva)'}
                    </Checkbox>
                ))}
            </fieldset>
            {invalid && (
                <p role="alert" className="mt-3 text-sm text-red-600">
                    Elige al menos una sucursal
                </p>
            )}
        </form>
    )
}

export default BranchAccessModal
