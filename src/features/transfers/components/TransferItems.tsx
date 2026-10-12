import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import type { TransferItem } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'

const { Tr, Th, Td, THead, TBody } = Table

type Props = {
    items: TransferItem[]
    itemsLoading: boolean
    isDraft: boolean
    getProductName: (productId: number) => string
    onAdd: () => void
    onEdit: (item: TransferItem) => void
    onDeleteItem: (item: TransferItem) => void
}

export const TransferItems = ({
    items,
    itemsLoading,
    isDraft,
    getProductName,
    onAdd,
    onEdit,
    onDeleteItem,
}: Props) => (
    <Card>
        <div className="flex items-center justify-between mb-4">
            <h5>Items de la Transferencia ({items.length})</h5>
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
            <EmptyState
                className="!py-8"
                title="No hay items en esta transferencia"
            />
        ) : (
            <Table>
                <THead>
                    <Tr>
                        <Th>Producto</Th>
                        <Th>Cantidad</Th>
                        <Th>Lote</Th>
                        <Th>Notas</Th>
                        {isDraft && <Th>Acciones</Th>}
                    </Tr>
                </THead>
                <TBody>
                    {items.map((item) => (
                        <Tr key={item.id}>
                            <Td>{getProductName(item.productId)}</Td>
                            <Td>{item.quantity}</Td>
                            <Td>{item.lotId ? `#${item.lotId}` : '-'}</Td>
                            <Td>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {item.notes || '-'}
                                </span>
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
                                            onClick={() => onDeleteItem(item)}
                                        />
                                    </div>
                                </Td>
                            )}
                        </Tr>
                    ))}
                </TBody>
            </Table>
        )}
    </Card>
)
