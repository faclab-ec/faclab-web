import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Tabs from '@/components/ui/Tabs'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useSupplier } from '../hooks/useSuppliers'
import SupplierInfoCard from '../components/SupplierInfoCard'
import SupplierContactsTab from '../components/SupplierContactsTab'
import SupplierProductsTab from '../components/SupplierProductsTab'

const { TabList, TabNav, TabContent } = Tabs

const SupplierDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const supplierId = parseInt(id || '0')

    const { data: supplier, isLoading } = useSupplier(supplierId)

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div>Cargando...</div>
            </div>
        )
    }

    if (!supplier) {
        return (
            <div className="flex flex-col items-center justify-center h-96">
                <h4 className="mb-4">Proveedor no encontrado</h4>
                <Button
                    variant="solid"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/suppliers')}
                >
                    Volver a Proveedores
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="plain"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate('/suppliers')}
                    />
                    <h3>{supplier.name}</h3>
                    <Badge
                        content={supplier.isActive ? 'Activo' : 'Inactivo'}
                        className={
                            supplier.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                        }
                    />
                </div>
            </div>

            <SupplierInfoCard supplier={supplier} />

            <Card>
                <Tabs defaultValue="contacts" variant="underline">
                    <TabList>
                        <TabNav value="contacts">Contactos</TabNav>
                        <TabNav value="products">Productos</TabNav>
                    </TabList>

                    <TabContent value="contacts">
                        <SupplierContactsTab supplierId={supplierId} />
                    </TabContent>

                    <TabContent value="products">
                        <SupplierProductsTab supplierId={supplierId} />
                    </TabContent>
                </Tabs>
            </Card>
        </div>
    )
}

export default SupplierDetailPage
