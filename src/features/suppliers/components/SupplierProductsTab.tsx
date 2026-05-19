import { useState } from 'react'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Table from '@/components/ui/Table'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import { getErrorMessage } from '@/utils/getErrorMessage'
import { useProductsList } from '@features/products'
import {
    useSupplierProducts,
    useSupplierProductMutations,
} from '../hooks/useSupplierProducts'
import SupplierProductForm from './SupplierProductForm'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import type { SupplierProduct } from '../model/types'

const { Tr, Th, Td, THead, TBody } = Table

interface SupplierProductsTabProps {
    supplierId: number
}

const SupplierProductsTab = ({ supplierId }: SupplierProductsTabProps) => {
    const { data: supplierProducts = [], isLoading } =
        useSupplierProducts(supplierId)
    const { data: productsData } = useProductsList()
    const products = productsData?.items ?? []
    const { delete: deleteSupplierProduct } =
        useSupplierProductMutations(supplierId)

    const [formOpen, setFormOpen] = useState(false)
    const [selected, setSelected] = useState<SupplierProduct | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [toDelete, setToDelete] = useState<SupplierProduct | null>(null)

    const getProductName = (productId: number) => {
        const product = products.find((p) => p.id === productId)
        return product ? `${product.name} (${product.sku})` : `#${productId}`
    }

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
            toast.push(
                <Notification title="Producto eliminado" type="success">
                    El producto se eliminó del proveedor correctamente
                </Notification>,
                { placement: 'top-end' }
            )
            setDeleteOpen(false)
            setToDelete(null)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al eliminar el producto')}
                </Notification>,
                { placement: 'top-end' }
            )
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
                <div className="text-center py-8 text-gray-500">
                    No hay productos registrados para este proveedor
                </div>
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
                                <Td>{getProductName(sp.productId)}</Td>
                                <Td>{sp.supplierSku || '-'}</Td>
                                <Td>${Number(sp.purchasePrice).toFixed(2)}</Td>
                                <Td>{sp.minOrderQuantity || '-'}</Td>
                                <Td>
                                    {sp.leadTimeDays
                                        ? `${sp.leadTimeDays} días`
                                        : '-'}
                                </Td>
                                <Td>
                                    <Badge
                                        content={sp.isPreferred ? 'Sí' : 'No'}
                                        className={
                                            sp.isPreferred
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                                        }
                                    />
                                </Td>
                                <Td>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            icon={<HiOutlinePencil />}
                                            onClick={() => handleEdit(sp)}
                                        />
                                        <Button
                                            size="sm"
                                            variant="plain"
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
