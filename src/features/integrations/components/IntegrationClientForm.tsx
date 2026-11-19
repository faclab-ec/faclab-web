import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Input from '@/components/ui/Input'
import { FormContainer, FormItem } from '@/components/ui/Form'
import { ControlledSwitcher } from '@/components/ui/Form/controlled'
import type { Branch } from '@features/organization'
import {
    integrationClientSchema,
    toIntegrationClientInput,
    MAX_ALLOWED_NETWORKS,
    type IntegrationClientFormValues,
} from '../model/schemas'
import { SCOPES, SCOPE_LABELS } from '../model/types'
import CheckboxList from './CheckboxList'
import type { IntegrationClientInput } from '../api/client'
import type { IntegrationClient } from '../model/types'

interface IntegrationClientFormProps {
    formId: string
    client: IntegrationClient | null
    branches: Branch[]
    isSubmitting?: boolean
    onSubmit: (data: IntegrationClientInput) => void
}

/** Nombre, scopes, sucursales y redes de un cliente (crear y editar). */
const IntegrationClientForm = ({
    formId,
    client,
    branches,
    isSubmitting = false,
    onSubmit,
}: IntegrationClientFormProps) => {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<IntegrationClientFormValues>({
        resolver: zodResolver(integrationClientSchema),
        defaultValues: {
            name: client?.name ?? '',
            scopes: client?.scopes ?? [],
            allBranches: !client?.branchIds,
            branchIds: client?.branchIds ?? [],
            allowedIps: (client?.allowedIps ?? []).join('\n'),
        },
    })
    const allBranches = useWatch({ control, name: 'allBranches' })

    return (
        <form
            id={formId}
            onSubmit={handleSubmit((values) =>
                onSubmit(toIntegrationClientInput(values))
            )}
        >
            <FormContainer>
                <FormItem
                    asterisk
                    htmlFor="client-name"
                    label="Nombre"
                    invalid={!!errors.name}
                    errorMessage={errors.name?.message}
                >
                    <Input
                        id="client-name"
                        placeholder="Ej: Tienda en línea"
                        disabled={isSubmitting}
                        invalid={!!errors.name}
                        {...register('name')}
                    />
                </FormItem>

                <FormItem
                    asterisk
                    label="Permisos (scopes)"
                    invalid={!!errors.scopes}
                    errorMessage={errors.scopes?.message}
                >
                    <Controller
                        name="scopes"
                        control={control}
                        render={({ field }) => (
                            <CheckboxList
                                legend="Permisos (scopes)"
                                disabled={isSubmitting}
                                value={field.value}
                                options={SCOPES.map((scope) => ({
                                    value: scope,
                                    label: (
                                        <span className="font-mono text-sm">
                                            {scope}
                                        </span>
                                    ),
                                    hint: SCOPE_LABELS[scope],
                                }))}
                                onChange={field.onChange}
                            />
                        )}
                    />
                </FormItem>

                <FormItem
                    htmlFor="client-allBranches"
                    label="Todas las sucursales"
                    extra={
                        <span className="ml-2 text-xs text-gray-500">
                            también las que se creen después
                        </span>
                    }
                >
                    <ControlledSwitcher
                        name="allBranches"
                        control={control}
                        disabled={isSubmitting}
                    />
                </FormItem>
                {!allBranches && (
                    <FormItem
                        label="Sucursales"
                        invalid={!!errors.branchIds}
                        errorMessage={errors.branchIds?.message}
                    >
                        <Controller
                            name="branchIds"
                            control={control}
                            render={({ field }) => (
                                <CheckboxList
                                    legend="Sucursales del cliente"
                                    disabled={isSubmitting}
                                    value={field.value}
                                    options={branches.map((branch) => ({
                                        value: branch.id,
                                        label: `${branch.establishmentCode} · ${
                                            branch.name
                                        }${
                                            branch.isActive ? '' : ' (inactiva)'
                                        }`,
                                    }))}
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </FormItem>
                )}

                <FormItem
                    htmlFor="client-allowedIps"
                    label="Redes de origen"
                    invalid={!!errors.allowedIps}
                    errorMessage={errors.allowedIps?.message}
                    extra={
                        <span className="ml-2 text-xs text-gray-500">
                            opcional: una IP o red CIDR por línea, hasta{' '}
                            {MAX_ALLOWED_NETWORKS}; vacío, desde cualquiera
                        </span>
                    }
                >
                    <Input
                        textArea
                        id="client-allowedIps"
                        className="font-mono"
                        placeholder={'203.0.113.7\n198.51.100.0/24'}
                        disabled={isSubmitting}
                        invalid={!!errors.allowedIps}
                        {...register('allowedIps')}
                    />
                </FormItem>
            </FormContainer>
        </form>
    )
}

export default IntegrationClientForm
