import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import Tabs from '@/components/ui/Tabs'
import { HiOutlineArrowLeft } from 'react-icons/hi'
import { useSupplier } from '../hooks/useSuppliers'
import SupplierInfoCard from '../components/SupplierInfoCard'
import SupplierContactsTab from '../components/SupplierContactsTab'
import SupplierProductsTab from '../components/SupplierProductsTab'
import PageHeader from '@/components/shared/PageHeader'
import EmptyState from '@/components/shared/EmptyState'

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
            <EmptyState
                className="min-h-[24rem]"
                title="Proveedor no encontrado"
                action={
                    <Button
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate('/suppliers')}
                    >
                        Volver a Proveedores
                    </Button>
                }
            />
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                className="!mb-1"
                title={supplier.name}
                badge={
                    <>
                        <ActiveBadge active={supplier.isActive} />
                    </>
                }
                onBack={() => navigate('/suppliers')}
            />

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
