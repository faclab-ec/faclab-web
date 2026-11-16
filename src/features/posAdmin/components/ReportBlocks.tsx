import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { formatCurrency } from '@shared/lib/format'
import { paymentMethodLabel } from '../lib/labels'
import EmptyState from '@/components/shared/EmptyState'
import { formatQuantity } from '@shared/lib/quantity'
import type { ShiftClosing } from '@features/pos'

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
                            <Td>{formatQuantity(row.quantity)}</Td>
                            <Td>{formatCurrency(row.total)}</Td>
                        </Tr>
                    ))}
                </TBody>
            </Table>
        )}
    </Card>
)

const differenceClass = (difference: number) =>
    difference === 0
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-red-600 dark:text-red-400'

/** El arqueo guardado en el cierre Z (S5.9), medio por medio */
export const ClosingCountTable = ({ closing }: { closing: ShiftClosing }) => (
    <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h5>Arqueo del cierre {closing.number}</h5>
            <span className="text-xs text-gray-500 dark:text-gray-400">
                Justificación sobre{' '}
                {formatCurrency(closing.justificationThreshold)}
            </span>
        </div>
        <Table>
            <THead>
                <Tr>
                    <Th>Forma de pago</Th>
                    <Th>Esperado</Th>
                    <Th>Contado</Th>
                    <Th>Diferencia</Th>
                    <Th>Justificación</Th>
                </Tr>
            </THead>
            <TBody>
                {closing.counts.map((count) => (
                    <Tr key={count.paymentMethod}>
                        <Td>{paymentMethodLabel(count.paymentMethod)}</Td>
                        <Td>{formatCurrency(count.expected)}</Td>
                        <Td>{formatCurrency(count.counted)}</Td>
                        <Td className={differenceClass(count.difference)}>
                            {formatCurrency(count.difference)}
                        </Td>
                        <Td>{count.justification ?? '-'}</Td>
                    </Tr>
                ))}
            </TBody>
        </Table>
    </Card>
)
