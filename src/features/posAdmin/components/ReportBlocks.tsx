import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { formatCurrency } from '@shared/lib/format'
import { paymentMethodLabel } from '../lib/labels'

const { Tr, Th, Td, THead, TBody } = Table

export const StatCard = ({
    label,
    value,
    tone = 'text-gray-800 dark:text-gray-100',
}: {
    label: string
    value: string | number
    tone?: string
}) => (
    <Card>
        <div className="p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
        </div>
    </Card>
)

export const PaymentsByMethodTable = ({
    rows,
}: {
    rows: { paymentMethod: string; count: number; total: number }[]
}) => (
    <Card>
        <div className="p-4">
            <h5 className="mb-4">Por forma de pago</h5>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">Sin pagos</p>
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
        </div>
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
        <div className="p-4">
            <h5 className="mb-4">{title}</h5>
            {rows.length === 0 ? (
                <p className="text-sm text-gray-500">Sin ventas</p>
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
        </div>
    </Card>
)
