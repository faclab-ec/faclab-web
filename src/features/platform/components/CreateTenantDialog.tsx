import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import { FormContainer, FormItem } from '@/components/ui/Form'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import { useCreateTenant, usePlans } from '../hooks/usePlatform'
import { PLATFORM_ERROR_MESSAGES, type CreatedTenant } from '../model/types'

const schema = z.object({
    ruc: z.string().regex(/^\d{13}$/, 'El RUC tiene 13 dígitos'),
    legalName: z.string().min(1, 'Requerido').max(300),
    tradeName: z.string().max(300).optional(),
    adminUsername: z.string().min(3, 'Mínimo 3 caracteres').max(64),
    adminEmail: z.string().email('Correo inválido').max(128),
    adminFullName: z.string().max(64).optional(),
    branchAddress: z.string().max(300).optional(),
    planCode: z.string().nullable().optional(),
    trialDays: z.string().regex(/^\d*$/, 'Solo números').optional(),
})
type FormValues = z.infer<typeof schema>

const clean = (value: string | undefined) => value?.trim() || undefined

interface Props {
    open: boolean
    onClose: () => void
}

/**
 * Da de alta una empresa y su administrador (S8.5). La contraseña temporal
 * del administrador se muestra una sola vez, al terminar.
 */
const CreateTenantDialog = ({ open, onClose }: Props) => {
    const create = useCreateTenant()
    const { data: plans = [] } = usePlans()
    const [created, setCreated] = useState<CreatedTenant | null>(null)
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: { planCode: null },
    })

    const close = () => {
        if (create.isPending) return
        setCreated(null)
        reset()
        onClose()
    }

    const submit = async (values: FormValues) => {
        try {
            const result = await create.mutateAsync({
                ruc: values.ruc,
                legalName: values.legalName.trim(),
                tradeName: clean(values.tradeName),
                adminUsername: values.adminUsername.trim(),
                adminEmail: values.adminEmail.trim(),
                adminFullName: clean(values.adminFullName),
                branchAddress: clean(values.branchAddress),
                planCode: values.planCode || undefined,
                trialDays: values.trialDays
                    ? Number(values.trialDays)
                    : undefined,
            })
            notifySuccess(
                result.tenantCreated ? 'Empresa creada' : 'Empresa actualizada'
            )
            setCreated(result)
        } catch (err) {
            notifyError(err, 'No se pudo crear la empresa', {
                messages: PLATFORM_ERROR_MESSAGES,
            })
        }
    }

    return (
        <Dialog
            contentLabel="Nueva empresa"
            isOpen={open}
            width={560}
            shouldCloseOnEsc={!create.isPending}
            shouldCloseOnOverlayClick={!create.isPending}
            onClose={close}
            onRequestClose={close}
        >
            {created ? (
                <div>
                    <h5 className="mb-4">Empresa lista</h5>
                    {created.adminPassword ? (
                        <Alert showIcon type="warning" className="mb-4">
                            Entrega esta contraseña temporal al administrador.
                            Solo se muestra ahora y debe cambiarla al ingresar:
                            <p className="mt-2 select-all font-mono text-base font-semibold">
                                {created.adminPassword}
                            </p>
                        </Alert>
                    ) : (
                        <Alert showIcon type="info" className="mb-4">
                            El administrador ya existía: ingresa con su
                            contraseña de siempre.
                        </Alert>
                    )}
                    <div className="text-right">
                        <Button variant="solid" onClick={close}>
                            Listo
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                    <h5 className="mb-4">Nueva empresa</h5>
                    <form onSubmit={handleSubmit(submit)}>
                        <FormContainer>
                            <FormItem
                                label="RUC"
                                invalid={!!errors.ruc}
                                errorMessage={errors.ruc?.message}
                            >
                                <Input
                                    inputMode="numeric"
                                    maxLength={13}
                                    invalid={!!errors.ruc}
                                    {...register('ruc')}
                                />
                            </FormItem>
                            <FormItem
                                label="Razón social"
                                invalid={!!errors.legalName}
                                errorMessage={errors.legalName?.message}
                            >
                                <Input
                                    invalid={!!errors.legalName}
                                    {...register('legalName')}
                                />
                            </FormItem>
                            <FormItem label="Nombre comercial (opcional)">
                                <Input {...register('tradeName')} />
                            </FormItem>
                            <FormItem
                                label="Usuario del administrador"
                                invalid={!!errors.adminUsername}
                                errorMessage={errors.adminUsername?.message}
                            >
                                <Input
                                    autoComplete="off"
                                    invalid={!!errors.adminUsername}
                                    {...register('adminUsername')}
                                />
                            </FormItem>
                            <FormItem
                                label="Correo del administrador"
                                invalid={!!errors.adminEmail}
                                errorMessage={errors.adminEmail?.message}
                            >
                                <Input
                                    type="email"
                                    autoComplete="off"
                                    invalid={!!errors.adminEmail}
                                    {...register('adminEmail')}
                                />
                            </FormItem>
                            <FormItem label="Nombre completo del administrador (opcional)">
                                <Input {...register('adminFullName')} />
                            </FormItem>
                            <FormItem label="Dirección de la matriz (opcional)">
                                <Input {...register('branchAddress')} />
                            </FormItem>
                            <FormItem label="Plan">
                                <ControlledSelect
                                    name="planCode"
                                    control={control}
                                    placeholder="El plan por defecto"
                                    options={[
                                        {
                                            value: null,
                                            label: 'El plan por defecto',
                                        },
                                        ...plans.map((plan) => ({
                                            value: plan.code,
                                            label: plan.name,
                                        })),
                                    ]}
                                />
                            </FormItem>
                            <FormItem
                                label="Días de prueba (opcional)"
                                invalid={!!errors.trialDays}
                                errorMessage={errors.trialDays?.message}
                            >
                                <Input
                                    inputMode="numeric"
                                    invalid={!!errors.trialDays}
                                    {...register('trialDays')}
                                />
                            </FormItem>
                        </FormContainer>
                        <div className="mt-6 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="plain"
                                disabled={create.isPending}
                                onClick={close}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="solid"
                                loading={create.isPending}
                            >
                                Crear empresa
                            </Button>
                        </div>
                    </form>
                </>
            )}
        </Dialog>
    )
}

export default CreateTenantDialog
