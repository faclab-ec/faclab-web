import { useId } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { notifyError, notifySuccess } from '@shared/ui/notify'

interface SecretValueProps {
    label: string
    value: string
    /** Qué se copió, para el aviso ("Secreto copiado") */
    copiedMessage?: string
}

/** Un valor para copiar (secreto, client_id), en un campo de solo lectura. */
const SecretValue = ({
    label,
    value,
    copiedMessage = 'Copiado',
}: SecretValueProps) => {
    const id = useId()

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value)
            notifySuccess(copiedMessage)
        } catch (err) {
            notifyError(err, 'No se pudo copiar: selecciónalo y cópialo a mano')
        }
    }

    return (
        <div>
            <label htmlFor={id} className="form-label mb-1.5">
                {label}
            </label>
            <div className="flex gap-2">
                <Input
                    readOnly
                    id={id}
                    className="font-mono"
                    value={value}
                    onFocus={(e) => e.currentTarget.select()}
                />
                <Button
                    type="button"
                    variant="solid"
                    aria-label={`Copiar ${label.toLowerCase()}`}
                    onClick={copy}
                >
                    Copiar
                </Button>
            </div>
        </div>
    )
}

export default SecretValue
