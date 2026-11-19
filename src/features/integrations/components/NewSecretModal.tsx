import { useState } from 'react'
import Select from '@/components/ui/Select'
import { FormModal } from '@/components/shared'
import LabeledField from '@/components/shared/LabeledField'

/** Qué pasa con los secretos activos al crear uno nuevo (0 a 90 días) */
const PREVIOUS_OPTIONS = [
    { value: 7 as number | null, label: 'Siguen valiendo 7 días' },
    { value: 1 as number | null, label: 'Siguen valiendo 1 día' },
    { value: 30 as number | null, label: 'Siguen valiendo 30 días' },
    { value: 0 as number | null, label: 'Dejan de valer ahora' },
    { value: null as number | null, label: 'Siguen valiendo hasta revocarlos' },
]

interface NewSecretModalProps {
    isOpen: boolean
    /** Los secretos activos del cliente: con dos, alguno tiene que vencer */
    activeSecrets: number
    isSubmitting: boolean
    onClose: () => void
    onSubmit: (previousExpiresInDays: number | null) => void
}

/**
 * Rotar sin cortar el servicio: el secreto nuevo vale de inmediato y los
 * anteriores siguen valiendo el tiempo que se elija, mientras el integrador
 * cambia su configuración.
 */
const NewSecretModal = ({
    isOpen,
    activeSecrets,
    isSubmitting,
    onClose,
    onSubmit,
}: NewSecretModalProps) => {
    const full = activeSecrets >= 2
    const options = full
        ? PREVIOUS_OPTIONS.filter((o) => o.value !== null)
        : PREVIOUS_OPTIONS
    const [choice, setChoice] = useState<number | null>(7)

    return (
        <FormModal
            isOpen={isOpen}
            title="Nuevo secreto"
            isSubmitting={isSubmitting}
            onClose={onClose}
            onSubmit={() => onSubmit(choice)}
        >
            <p className="mb-4 text-sm">
                El secreto nuevo vale desde ya. Un cliente tiene como máximo dos
                secretos activos.
            </p>
            {activeSecrets > 0 && (
                <LabeledField label="Los secretos activos">
                    <Select
                        options={options}
                        value={options.find((o) => o.value === choice) ?? null}
                        onChange={(option) => setChoice(option?.value ?? 0)}
                    />
                </LabeledField>
            )}
        </FormModal>
    )
}

export default NewSecretModal
