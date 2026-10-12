import Card from '@/components/ui/Card'
import { TAX_TYPE_LABELS } from '../model/types'
import type { Supplier } from '../model/types'

interface SupplierInfoCardProps {
    supplier: Supplier
}

const SupplierInfoCard = ({ supplier }: SupplierInfoCardProps) => (
    <Card>
        <h5 className="mb-4">Información del Proveedor</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
                <p className="text-sm text-gray-500">Identificación</p>
                <p className="font-medium">{supplier.taxId}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Tipo de identificación</p>
                <p className="font-medium">
                    {TAX_TYPE_LABELS[supplier.taxType]}
                </p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{supplier.email || '-'}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Teléfono</p>
                <p className="font-medium">{supplier.phone || '-'}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Ciudad</p>
                <p className="font-medium">{supplier.city || '-'}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">País</p>
                <p className="font-medium">{supplier.country || '-'}</p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Términos de Pago</p>
                <p className="font-medium">
                    {supplier.paymentTerms
                        ? `${supplier.paymentTerms} días`
                        : '-'}
                </p>
            </div>
            <div>
                <p className="text-sm text-gray-500">Tiempo de Entrega</p>
                <p className="font-medium">
                    {supplier.leadTimeDays
                        ? `${supplier.leadTimeDays} días`
                        : '-'}
                </p>
            </div>
        </div>
        {supplier.address && (
            <div className="mt-4">
                <p className="text-sm text-gray-500">Dirección</p>
                <p className="font-medium">{supplier.address}</p>
            </div>
        )}
        {supplier.notes && (
            <div className="mt-4">
                <p className="text-sm text-gray-500">Notas</p>
                <p className="font-medium">{supplier.notes}</p>
            </div>
        )}
    </Card>
)

export default SupplierInfoCard
