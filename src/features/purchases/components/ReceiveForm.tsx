import { useEffect } from 'react'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import { ControlledSelect } from '@/components/ui/Form/controlled'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { useReceivePurchaseOrder } from '../hooks/usePurchaseOrders'
import { useLocationsList } from '@features/locations'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
import { dateToIsoStartOfDay } from '@shared/lib/dateToIsoStartOfDay'
import { useForm, useFieldArray, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
    receiveFormSchema,
    type ReceiveFormValues,
} from '../model/receivePurchaseOrder.schema'
import type { PurchaseOrderItem } from '../model/types'

const { Tr, Th, Td, THead, TBody } = Table

interface ReceiveFormProps {
    open: boolean
    onClose: () => void
    orderId: number
    items: PurchaseOrderItem[]
    getProductName: (productId: number) => string
}

const ReceiveForm = ({
    open,
    onClose,
    orderId,
    items,
    getProductName,
}: ReceiveFormProps) => {
    const receiveMutation = useReceivePurchaseOrder()
    const { data: locationsData } = useLocationsList({ limit: 100 })
    const locations = locationsData?.items ?? []

    const locationOptions = [
        { value: null as number | null, label: 'Sin ubicación' },
        ...locations.map((l) => ({
            value: l.id as number | null,
            label: `${l.name} (${l.code})`,
        })),
    ]

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors },
    } = useForm<ReceiveFormValues>({
        resolver: zodResolver(receiveFormSchema),
        defaultValues: { items: [], notes: '', receivedAt: '' },
    })

    const { fields } = useFieldArray({ control, name: 'items' })
    const watchedItems = useWatch({ control, name: 'items' })

    useEffect(() => {
        if (open) {
            const pendingItems = items
                .filter(
                    (item) => item.quantityOrdered - item.quantityReceived > 0
                )
                .map((item) => ({
                    purchaseOrderItemId: item.id,
                    productId: item.productId,
                    quantityOrdered: item.quantityOrdered,
                    quantityReceived: item.quantityReceived,
                    quantityPending:
                        item.quantityOrdered - item.quantityReceived,
                    quantityToReceive: 0,
                    locationId: null,
                    lotNumber: '',
                    serialNumbers: '',
                }))
            reset({
                items: pendingItems,
                notes: '',
                receivedAt: '',
            })
        }
    }, [open, items, reset])

    const isPending = receiveMutation.isPending

    const handleClose = () => {
        if (!isPending) {
            onClose()
        }
    }

    const onSubmit = async (values: ReceiveFormValues) => {
        const filteredItems = values.items
            .filter((item) => item.quantityToReceive > 0)
            .map((item) => ({
                purchaseOrderItemId: item.purchaseOrderItemId,
                quantityReceived: item.quantityToReceive,
                locationId: item.locationId ?? undefined,
                lotNumber: item.lotNumber || undefined,
                serialNumbers: item.serialNumbers
                    ? item.serialNumbers
                          .split(',')
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0)
                    : undefined,
            }))

        try {
            await receiveMutation.mutateAsync({
                id: orderId,
                data: {
                    items: filteredItems,
                    notes: values.notes || undefined,
                    receivedAt: dateToIsoStartOfDay(values.receivedAt),
                },
            })

            toast.push(
                <Notification title="Mercancía recibida" type="success">
                    La recepción se registró correctamente
                </Notification>,
                { placement: 'top-end' }
            )

            onClose()
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al registrar la recepción')}
                </Notification>,
                { placement: 'top-end' }
            )
        }
    }

    return (
        <Dialog
            isOpen={open}
            width={900}
            onClose={handleClose}
            onRequestClose={handleClose}
        >
            <div className="flex flex-col h-full justify-between">
                <h5 className="mb-4">Recibir Mercancía</h5>

                <form className="flex-1" onSubmit={handleSubmit(onSubmit)}>
                    <div className="max-h-[60vh] overflow-y-auto pr-1">
                        {fields.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No hay items pendientes de recepción
                            </div>
                        ) : (
                            <Table>
                                <THead>
                                    <Tr>
                                        <Th>Producto</Th>
                                        <Th>Pedida</Th>
                                        <Th>Recibida</Th>
                                        <Th>Pendiente</Th>
                                        <Th>Cant. a Recibir</Th>
                                        <Th>Ubicación</Th>
                                        <Th>Lote</Th>
                                        <Th>Nros. de Serie</Th>
                                    </Tr>
                                </THead>
                                <TBody>
                                    {fields.map((field, index) => {
                                        const itemError =
                                            errors.items?.[index]
                                                ?.quantityToReceive
                                        return (
                                            <Tr key={field.id}>
                                                <Td>
                                                    <span className="text-sm">
                                                        {getProductName(
                                                            field.productId
                                                        )}
                                                    </span>
                                                </Td>
                                                <Td>{field.quantityOrdered}</Td>
                                                <Td>
                                                    {field.quantityReceived}
                                                </Td>
                                                <Td>
                                                    <span className="font-medium text-amber-600 dark:text-amber-400">
                                                        {field.quantityPending}
                                                    </span>
                                                </Td>
                                                <Td>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        max={
                                                            field.quantityPending
                                                        }
                                                        size="sm"
                                                        className="w-20"
                                                        invalid={!!itemError}
                                                        {...register(
                                                            `items.${index}.quantityToReceive`,
                                                            {
                                                                setValueAs: (
                                                                    v
                                                                ) =>
                                                                    v === '' ||
                                                                    v ===
                                                                        null ||
                                                                    v ===
                                                                        undefined
                                                                        ? 0
                                                                        : parseInt(
                                                                              String(
                                                                                  v
                                                                              ),
                                                                              10
                                                                          ) ||
                                                                          0,
                                                            }
                                                        )}
                                                    />
                                                    {itemError?.message && (
                                                        <p className="text-xs text-red-500 mt-1">
                                                            {itemError.message}
                                                        </p>
                                                    )}
                                                </Td>
                                                <Td>
                                                    <ControlledSelect
                                                        name={`items.${index}.locationId`}
                                                        control={control}
                                                        options={
                                                            locationOptions
                                                        }
                                                        size="sm"
                                                        className="w-40"
                                                        placeholder="Ubicación"
                                                    />
                                                </Td>
                                                <Td>
                                                    <Input
                                                        size="sm"
                                                        className="w-28"
                                                        placeholder="Lote"
                                                        {...register(
                                                            `items.${index}.lotNumber`
                                                        )}
                                                    />
                                                </Td>
                                                <Td>
                                                    <Input
                                                        size="sm"
                                                        className="w-36"
                                                        placeholder="SN1, SN2, ..."
                                                        {...register(
                                                            `items.${index}.serialNumbers`
                                                        )}
                                                    />
                                                </Td>
                                            </Tr>
                                        )
                                    })}
                                </TBody>
                            </Table>
                        )}

                        {errors.items?.root?.message && (
                            <p className="text-sm text-red-500 mt-2">
                                {errors.items.root.message}
                            </p>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Fecha de Recepción
                                </label>
                                <Input
                                    type="date"
                                    {...register('receivedAt')}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Notas
                                </label>
                                <Input
                                    textArea
                                    placeholder="Observaciones de la recepción"
                                    {...register('notes')}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            disabled={isPending}
                            onClick={handleClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isPending}
                            disabled={
                                !watchedItems?.some(
                                    (i) => i.quantityToReceive > 0
                                )
                            }
                        >
                            Confirmar Recepción
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default ReceiveForm
