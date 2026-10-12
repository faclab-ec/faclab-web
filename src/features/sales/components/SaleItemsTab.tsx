import Table from '@/components/ui/Table'
import { formatCurrency, formatProductLabel } from '@shared/lib/format'
import { useSaleItems } from '../hooks/useSales'
import EmptyState from '@/components/shared/EmptyState'

const { Tr, Th, Td, THead, TBody, TFoot } = Table

interface SaleItemsTabProps {
    saleId: number
}

const SaleItemsTab = ({ saleId }: SaleItemsTabProps) => {
    const { data: items = [], isLoading } = useSaleItems(saleId)

    const itemsTotal = items.reduce((sum, item) => sum + item.subtotal, 0)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div>Cargando items...</div>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <EmptyState className="!py-8" title="No hay items en esta venta" />
        )
    }

    return (
        <Table>
            <THead>
                <Tr>
                    <Th>Producto</Th>
                    <Th>Cantidad</Th>
                    <Th>Precio Unitario</Th>
                    <Th>Descuento (%)</Th>
                    <Th>Subtotal</Th>
                </Tr>
            </THead>
            <TBody>
                {items.map((item) => (
                    <Tr key={item.id}>
                        <Td>{formatProductLabel(item)}</Td>
                        <Td>{item.quantity}</Td>
                        <Td>{formatCurrency(item.unitPrice)}</Td>
                        <Td>{item.discount > 0 ? `${item.discount}%` : '-'}</Td>
                        <Td className="font-medium">
                            {formatCurrency(item.subtotal)}
                        </Td>
                    </Tr>
                ))}
            </TBody>
            <TFoot>
                <Tr>
                    <Td colSpan={4} className="text-right font-medium">
                        Total Items
                    </Td>
                    <Td className="font-semibold">
                        {formatCurrency(itemsTotal)}
                    </Td>
                </Tr>
            </TFoot>
        </Table>
    )
}

export default SaleItemsTab
