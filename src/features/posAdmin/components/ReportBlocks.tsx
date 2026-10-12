import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { formatCurrency } from '@shared/lib/format'
import { paymentMethodLabel } from '../lib/labels'
import EmptyState from '@/components/shared/EmptyState'

const { Tr, Th, Td, THead, TBody } = Table

export const PaymentsByMethodTable = ({
    rows,
}: {
    rows: { paymentMethod: string; count: number; total: number }[]
}) => (
    <Card>
        <h5 className="mb-4">Por forma de pago</h5>
        {rows.length === 0 ? (
            <EmptyState className="!py-6" title="Sin pagos" />
        ) : (
            <Table>
                <THead>
                    <Tr>
                        <Th>Forma de pago</Th>
                        <Th>Pagos</Th>
                        <Th>Total</Th>
                    </Tr>
                </THead>
                <TBody>
                    {rows.map((row) => (
                        <Tr key={row.paymentMethod}>
                            <Td>{paymentMethodLabel(row.paymentMethod)}</Td>
                            <Td>{row.count}</Td>
                            <Td>{formatCurrency(row.total)}</Td>
                        </Tr>
                    ))}
                </TBody>
            </Table>
        )}
    </Card>
)

export const ProductsSoldTable = ({
    title,
    rows,
}: {
    title: string
    rows: {
        productName: string
        sku: string
        quantity: number
        total: number
    }[]
}) => (
    <Card>
        <h5 className="mb-4">{title}</h5>
        {rows.length === 0 ? (
            <EmptyState className="!py-6" title="Sin ventas" />
        ) : (
            <Table>
                <THead>
                    <Tr>
                        <Th>Producto</Th>
                        <Th>SKU</Th>
                        <Th>Cantidad</Th>
                        <Th>Total</Th>
                    </Tr>
                </THead>
                <TBody>
                    {rows.map((row) => (
                        <Tr key={row.sku}>
                            <Td>{row.productName}</Td>
                            <Td className="font-mono text-sm">{row.sku}</Td>
                            <Td>{row.quantity}</Td>
                            <Td>{formatCurrency(row.total)}</Td>
                        </Tr>
                    ))}
                </TBody>
            </Table>
        )}
    </Card>
)
