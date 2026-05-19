import Card from '@/components/ui/Card'
import { formatCurrency, formatDate, formatDatetime } from '@shared/lib/format'
import type { Sale } from '../model/types'

interface Customer {
    id: number
    name: string
}

interface SaleInfoCardProps {
    sale: Sale
    customers: Customer[]
}

const SaleInfoCard = ({ sale, customers }: SaleInfoCardProps) => {
    const getCustomerName = (customerId: number) => {
        const c = customers.find((c) => c.id === customerId)
        return c ? c.name : `#${customerId}`
    }

    return (
        <Card>
            <h5 className="mb-4">Información de la Venta</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <p className="text-sm text-gray-500">Cliente</p>
                    <p className="font-medium">
                        {getCustomerName(sale.customerId)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Fecha de Venta</p>
                    <p className="font-medium">
                        {sale.saleDate ? formatDate(sale.saleDate) : '-'}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Creado por</p>
                    <p className="font-medium">{sale.createdBy ?? '-'}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Fecha de Creación</p>
                    <p className="font-medium">
                        {formatDatetime(sale.createdAt)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">
                        Última Actualización
                    </p>
                    <p className="font-medium">
                        {sale.updatedAt ? formatDatetime(sale.updatedAt) : '-'}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-600">
                <div>
                    <p className="text-sm text-gray-500">Subtotal</p>
                    <p className="font-medium">
                        {formatCurrency(sale.subtotal)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Descuento</p>
                    <p className="font-medium">
                        {formatCurrency(sale.discount)}
                    </p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Impuestos</p>
                    <p className="font-medium">{formatCurrency(sale.tax)}</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-semibold">
                        {formatCurrency(sale.total)}
                    </p>
                </div>
            </div>
            {sale.notes && (
                <div className="mt-4 pt-4 border-t dark:border-gray-600">
                    <p className="text-sm text-gray-500">Notas</p>
                    <p className="font-medium">{sale.notes}</p>
                </div>
            )}
        </Card>
    )
}

export default SaleInfoCard
