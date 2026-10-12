import { useState } from 'react'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import Switcher from '@/components/ui/Switcher'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { usePOSStore } from '../store/usePOSStore'
import { useCartTotals } from '../hooks/useCartTotals'
import { usePOSCustomerSearch, useQuickCreateCustomer } from '../hooks/usePOS'
import { HiOutlineUser } from 'react-icons/hi'
import { TAX_TYPE_LABELS, type TaxType } from '@features/customers'
import LabeledField from '@/components/shared/LabeledField'

const FINAL_CONSUMER_MAX = 50

const CustomerSelector = () => {
    const {
        customerId,
        customerName,
        isFinalConsumer,
        setCustomer,
        setFinalConsumer,
    } = usePOSStore()
    const { total } = useCartTotals()
    const finalConsumerBlocked = total > FINAL_CONSUMER_MAX
    const [dialogOpen, setDialogOpen] = useState(false)
    const [taxId, setTaxId] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newName, setNewName] = useState('')
    const [newTaxId, setNewTaxId] = useState('')
    const [newTaxType, setNewTaxType] = useState<TaxType>(1)

    const { data: foundCustomer, isLoading: searching } =
        usePOSCustomerSearch(taxId)
    const quickCreate = useQuickCreateCustomer()

    const handleToggleFinalConsumer = (checked: boolean) => {
        if (checked) {
            setCustomer(null, null)
            setFinalConsumer(true)
        } else {
            setFinalConsumer(false)
        }
    }

    const handleSelectCustomer = (id: number, name: string) => {
        setCustomer(id, name)
        setDialogOpen(false)
        resetForm()
    }

    const handleCreateCustomer = async () => {
        try {
            const customer = await quickCreate.mutateAsync({
                name: newName,
                taxId: newTaxId,
                taxType: newTaxType,
            })
            handleSelectCustomer(customer.id, customer.name)
            notifySuccess('Cliente creado')
        } catch (error: unknown) {
            notifyError(error, 'Error al crear cliente')
        }
    }

    const resetForm = () => {
        setTaxId('')
        setShowCreateForm(false)
        setNewName('')
        setNewTaxId('')
        setNewTaxType(1)
    }

    const handleClose = () => {
        setDialogOpen(false)
        resetForm()
    }

    return (
        <>
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <label
                            htmlFor="pos-final-consumer"
                            className={`text-sm select-none ${
                                finalConsumerBlocked
                                    ? 'text-gray-400 dark:text-gray-600'
                                    : 'text-gray-600 dark:text-gray-400 cursor-pointer'
                            }`}
                        >
                            Consumidor final
                        </label>
                        {finalConsumerBlocked && (
                            <p className="text-xs text-amber-500">
                                Requerido para montos {'>'} $
                                {FINAL_CONSUMER_MAX}
                            </p>
                        )}
                    </div>
                    <Switcher
                        id="pos-final-consumer"
                        checked={isFinalConsumer && !finalConsumerBlocked}
                        disabled={finalConsumerBlocked}
                        onChange={handleToggleFinalConsumer}
                    />
                </div>

                {(!isFinalConsumer || finalConsumerBlocked) && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                            <div
                                className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${
                                    customerId
                                        ? 'bg-primary-100 dark:bg-primary-500/20'
                                        : 'bg-gray-100 dark:bg-gray-700'
                                }`}
                            >
                                <HiOutlineUser
                                    className={`text-sm ${
                                        customerId
                                            ? 'text-primary-600'
                                            : 'text-gray-400'
                                    }`}
                                />
                            </div>
                            {customerId ? (
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {customerName}
                                    </p>
                                    <button
                                        className="text-xs text-red-500 hover:underline"
                                        onClick={() => setCustomer(null, null)}
                                    >
                                        Quitar
                                    </button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">
                                    Sin cliente
                                </p>
                            )}
                        </div>
                        <Button
                            size="xs"
                            variant={customerId ? 'default' : 'solid'}
                            onClick={() => setDialogOpen(true)}
                        >
                            {customerId ? 'Cambiar' : 'Buscar'}
                        </Button>
                    </div>
                )}
            </div>

            <Dialog
                isOpen={dialogOpen}
                width={400}
                overlayClassName="!z-[60]"
                onClose={handleClose}
            >
                <h4 className="text-lg font-bold mb-4">Buscar Cliente</h4>

                <div className="space-y-4">
                    <LabeledField label="RUC / Cedula">
                        <Input
                            value={taxId}
                            placeholder="Ingrese RUC o cedula..."
                            onChange={(e) => setTaxId(e.target.value)}
                        />
                    </LabeledField>

                    {searching && (
                        <p className="text-sm text-gray-500">Buscando...</p>
                    )}

                    {foundCustomer && (
                        <div className="p-3 border border-gray-200 dark:border-gray-600 rounded-lg flex items-center justify-between">
                            <div>
                                <p className="font-medium">
                                    {foundCustomer.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {foundCustomer.taxType}:{' '}
                                    {foundCustomer.taxId}
                                </p>
                            </div>
                            <Button
                                size="xs"
                                variant="solid"
                                onClick={() =>
                                    handleSelectCustomer(
                                        foundCustomer.id,
                                        foundCustomer.name
                                    )
                                }
                            >
                                Seleccionar
                            </Button>
                        </div>
                    )}

                    {taxId.length >= 5 && !searching && !foundCustomer && (
                        <div className="text-center py-3">
                            <p className="text-sm text-gray-500 mb-2">
                                No se encontro cliente
                            </p>
                            {!showCreateForm && (
                                <Button
                                    size="sm"
                                    variant="twoTone"
                                    onClick={() => {
                                        setShowCreateForm(true)
                                        setNewTaxId(taxId)
                                    }}
                                >
                                    Crear cliente rapido
                                </Button>
                            )}
                        </div>
                    )}

                    {showCreateForm && (
                        <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <h5 className="text-sm font-bold">Nuevo Cliente</h5>
                            <Input
                                value={newName}
                                placeholder="Nombre completo"
                                onChange={(e) => setNewName(e.target.value)}
                            />
                            <Input
                                value={newTaxId}
                                placeholder="RUC / Cedula"
                                onChange={(e) => setNewTaxId(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={
                                        newTaxType === 1 ? 'solid' : 'default'
                                    }
                                    onClick={() => setNewTaxType(1)}
                                >
                                    {TAX_TYPE_LABELS[1]}
                                </Button>
                                <Button
                                    size="sm"
                                    variant={
                                        newTaxType === 2 ? 'solid' : 'default'
                                    }
                                    onClick={() => setNewTaxType(2)}
                                >
                                    {TAX_TYPE_LABELS[2]}
                                </Button>
                            </div>
                            <Button
                                block
                                size="sm"
                                variant="solid"
                                loading={quickCreate.isPending}
                                disabled={!newName || !newTaxId}
                                onClick={handleCreateCustomer}
                            >
                                Crear y Seleccionar
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 mt-6">
                    <Button block variant="default" onClick={handleClose}>
                        Cancelar
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default CustomerSelector
