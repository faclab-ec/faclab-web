import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import { formatCurrency } from '@shared/lib/format'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import type { PurchaseOrder, PurchaseOrderItem } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'

const { Tr, Th, Td, THead, TBody, TFoot } = Table

type Props = {
    items: PurchaseOrderItem[]
    itemsLoading: boolean
    isDraft: boolean
    order: PurchaseOrder
    getProductName: (productId: number) => string
    onAdd: () => void
    onEdit: (item: PurchaseOrderItem) => void
    onDeleteItem: (item: PurchaseOrderItem) => void
}

export const PurchaseOrderItems = ({
    items,
    itemsLoading,
    isDraft,
    order,
    getProductName,
    onAdd,
    onEdit,
    onDeleteItem,
}: Props) => (
    <Card>
        <div className="flex items-center justify-between mb-4">
            <h5>Items de la Orden ({items.length})</h5>
            {isDraft && (
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={onAdd}
                >
                    Agregar Item
                </Button>
            )}
        </div>

        {itemsLoading ? (
            <div className="flex justify-center items-center h-32">
                <div>Cargando items...</div>
            </div>
        ) : items.length === 0 ? (
            <EmptyState className="!py-8" title="No hay items en esta orden" />
        ) : (
            <Table>
                <THead>
                    <Tr>
                        <Th>Producto</Th>
                        <Th>Cant. Pedida</Th>
                        <Th>Cant. Recibida</Th>
                        <Th>Cant. Pendiente</Th>
                        <Th>Costo Unitario</Th>
                        <Th>Subtotal</Th>
                        {isDraft && <Th>Acciones</Th>}
                    </Tr>
                </THead>
                <TBody>
                    {items.map((item) => {
                        const pending =
                            item.quantityOrdered - item.quantityReceived
                        const subtotal = item.unitCost * item.quantityOrdered
                        return (
                            <Tr key={item.id}>
                                <Td>{getProductName(item.productId)}</Td>
                                <Td>{item.quantityOrdered}</Td>
                                <Td>{item.quantityReceived}</Td>
                                <Td>
                                    {pending > 0 ? (
                                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                                            {pending}
                                        </span>
                                    ) : (
                                        <span className="text-emerald-600 dark:text-emerald-400">
                                            0
                                        </span>
                                    )}
                                </Td>
                                <Td>{formatCurrency(item.unitCost)}</Td>
                                <Td className="font-medium">
                                    {formatCurrency(subtotal)}
                                </Td>
                                {isDraft && (
                                    <Td>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                aria-label="Editar"
                                                icon={<HiOutlinePencil />}
                                                onClick={() => onEdit(item)}
                                            />
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                aria-label="Eliminar"
                                                icon={<HiOutlineTrash />}
                                                onClick={() =>
                                                    onDeleteItem(item)
                                                }
                                            />
                                        </div>
                                    </Td>
                                )}
                            </Tr>
                        )
                    })}
                </TBody>
                <TFoot>
                    <Tr>
                        <Td
                            colSpan={isDraft ? 6 : 5}
                            className="text-right font-medium"
                        >
                            Total
                        </Td>
                        <Td className="font-semibold">
                            {formatCurrency(order.total)}
                        </Td>
                        {isDraft && <Td />}
                    </Tr>
                </TFoot>
            </Table>
        )}
    </Card>
)
