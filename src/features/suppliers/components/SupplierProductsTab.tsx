import { useState } from 'react'
import Button from '@/components/ui/Button'
import StatusBadge from '@/components/shared/StatusBadge'
import Table from '@/components/ui/Table'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import { formatProductLabel, formatCurrency } from '@shared/lib/format'
import {
    useSupplierProducts,
    useSupplierProductMutations,
} from '../hooks/useSupplierProducts'
import SupplierProductForm from './SupplierProductForm'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import type { SupplierProduct } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'

const { Tr, Th, Td, THead, TBody } = Table

interface SupplierProductsTabProps {
    supplierId: number
}

const SupplierProductsTab = ({ supplierId }: SupplierProductsTabProps) => {
    const { data: supplierProducts = [], isLoading } =
        useSupplierProducts(supplierId)
    const { delete: deleteSupplierProduct } =
        useSupplierProductMutations(supplierId)

    const [formOpen, setFormOpen] = useState(false)
    const [selected, setSelected] = useState<SupplierProduct | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [toDelete, setToDelete] = useState<SupplierProduct | null>(null)

    const handleCreate = () => {
        setSelected(null)
        setFormOpen(true)
    }

    const handleEdit = (product: SupplierProduct) => {
        setSelected(product)
        setFormOpen(true)
    }

    const handleCloseForm = () => {
        setFormOpen(false)
        setSelected(null)
    }

    const handleDeleteConfirm = async () => {
        if (!toDelete) return
        try {
            await deleteSupplierProduct.mutateAsync(toDelete.id)
            notifySuccess(
                'Producto eliminado',
                'El producto se eliminó del proveedor correctamente'
            )
            setDeleteOpen(false)
            setToDelete(null)
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el producto')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div>Cargando productos...</div>
            </div>
        )
    }

    return (
        <div className="mt-4">
            <div className="flex items-center justify-end mb-4">
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={handleCreate}
                >
                    Agregar Producto
                </Button>
            </div>

            {supplierProducts.length === 0 ? (
                <EmptyState
                    className="!py-8"
                    title="No hay productos registrados para este proveedor"
                />
            ) : (
                <Table>
                    <THead>
                        <Tr>
                            <Th>Producto</Th>
                            <Th>SKU Proveedor</Th>
                            <Th>Precio de Compra</Th>
                            <Th>Cant. Mín.</Th>
                            <Th>Tiempo Entrega</Th>
                            <Th>Preferido</Th>
                            <Th>Acciones</Th>
                        </Tr>
                    </THead>
                    <TBody>
                        {supplierProducts.map((sp) => (
                            <Tr key={sp.id}>
                                <Td>{formatProductLabel(sp)}</Td>
                                <Td>{sp.supplierSku || '-'}</Td>
                                <Td>
                                    {formatCurrency(Number(sp.purchasePrice))}
                                </Td>
                                <Td>{sp.minOrderQuantity || '-'}</Td>
                                <Td>
                                    {sp.leadTimeDays
                                        ? `${sp.leadTimeDays} días`
                                        : '-'}
                                </Td>
                                <Td>
                                    <StatusBadge
                                        tone={
                                            sp.isPreferred
                                                ? 'success'
                                                : 'neutral'
                                        }
                                    >
                                        {sp.isPreferred ? 'Sí' : 'No'}
                                    </StatusBadge>
                                </Td>
                                <Td>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            aria-label="Editar"
                                            icon={<HiOutlinePencil />}
                                            onClick={() => handleEdit(sp)}
                                        />
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            aria-label="Eliminar"
                                            icon={<HiOutlineTrash />}
                                            onClick={() => {
                                                setToDelete(sp)
                                                setDeleteOpen(true)
                                            }}
                                        />
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            )}

            <SupplierProductForm
                open={formOpen}
                supplierId={supplierId}
                supplierProduct={selected}
                onClose={handleCloseForm}
            />

            <DeleteConfirmDialog
                isOpen={deleteOpen}
                title="Confirmar eliminación"
                message="¿Está seguro que desea eliminar este producto del proveedor? Esta acción no se puede deshacer."
                isPending={deleteSupplierProduct.isPending}
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeleteOpen(false)}
            />
        </div>
    )
}

export default SupplierProductsTab
