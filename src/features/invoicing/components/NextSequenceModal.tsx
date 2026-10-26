import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import FormModal from '@/components/shared/FormModal'
import { FormContainer, FormItem } from '@/components/ui/Form'
import Input from '@/components/ui/Input'
import { makeNumberRegister } from '@/components/ui/Form/utils'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useSetNextSequence } from '../hooks/useInvoicing'
import { INVOICING_ERROR_MESSAGES } from '../model/errors'
import {
    nextSequenceSchema,
    type NextSequenceFormValues,
} from '../model/schemas'
import type { SequenceRow } from '../model/sequences'

interface NextSequenceModalProps {
    row: SequenceRow
    onClose: () => void
}

const FORM_ID = 'next-sequence'

/** Dónde continúa la numeración de un punto de emisión; nunca retrocede. */
const NextSequenceModal = ({ row, onClose }: NextSequenceModalProps) => {
    const setNext = useSetNextSequence()
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<NextSequenceFormValues>({
        resolver: zodResolver(nextSequenceSchema),
        defaultValues: { nextSequence: row.nextSequence },
    })
    const numberRegister = makeNumberRegister(register)
    const series = `${row.establishment}-${row.emissionPoint}`

    const onSubmit = async ({ nextSequence }: NextSequenceFormValues) => {
        try {
            await setNext.mutateAsync({
                establishment: row.establishment,
                emissionPoint: row.emissionPoint,
                nextSequence,
            })
            notifySuccess(
                'Secuencial actualizado',
                `La próxima factura ${series} lleva el número ${nextSequence}`
            )
            onClose()
        } catch (err) {
            notifyError(err, 'No se pudo cambiar el secuencial', {
                messages: INVOICING_ERROR_MESSAGES,
            })
        }
    }

    return (
        <FormModal
            isOpen
            title={`Secuencial ${series}`}
            formId={FORM_ID}
            width={440}
            isSubmitting={setNext.isPending}
            onClose={onClose}
        >
            <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
                <FormContainer>
                    <p className="mb-4 text-gray-500 dark:text-gray-400">
                        {row.lastSequence
                            ? `Último número emitido: ${row.lastSequence}.`
                            : 'Todavía no emite facturas.'}{' '}
                        Por ejemplo, para continuar la numeración de un sistema
                        anterior. No puede volver a un número ya emitido.
                    </p>
                    <FormItem
                        asterisk
                        label="Siguiente número"
                        invalid={!!errors.nextSequence}
                        errorMessage={errors.nextSequence?.message}
                    >
                        <Input
                            type="number"
                            min={1}
                            invalid={!!errors.nextSequence}
                            {...numberRegister('nextSequence', {
                                integer: true,
                            })}
                        />
                    </FormItem>
                </FormContainer>
            </form>
        </FormModal>
    )
}

export default NextSequenceModal
