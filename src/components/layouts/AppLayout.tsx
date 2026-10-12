import { useNavigate } from 'react-router-dom'
import Header from '@/components/template/Header'
import UserDropdown from '@/components/template/UserDropdown'
import SideNavToggle from '@/components/template/SideNavToggle'
import ThemeModeToggle from '@/components/template/ThemeModeToggle'
import MobileNav from '@/components/template/MobileNav'
import SideNav from '@/components/template/SideNav'
import Button from '@/components/ui/Button'
import View from '@app/AppViews'
import { HiOutlineShoppingCart } from 'react-icons/hi'
import { useCan } from '@/stores'
import { InvoicingReadinessAlert } from '@features/invoicing'

const HeaderActionsStart = () => {
    return (
        <>
            <MobileNav />
            <SideNavToggle />
        </>
    )
}

const HeaderActionsEnd = () => {
    const navigate = useNavigate()
    const canOperatePOS = useCan('pos:operate')

    return (
        <>
            {canOperatePOS && (
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlineShoppingCart />}
                    onClick={() => navigate('/pos')}
                >
                    POS
                </Button>
            )}
            <ThemeModeToggle />
            <UserDropdown />
        </>
    )
}

/** Estructura de la app con sesión iniciada: navegación, cabecera y página. */
const AppLayout = () => {
    return (
        <div className="app-layout flex flex-auto min-w-0">
            <SideNav />
            <div className="relative flex min-h-screen w-full min-w-0 flex-auto flex-col">
                <Header
                    headerEnd={<HeaderActionsEnd />}
                    headerStart={<HeaderActionsStart />}
                />
                {/* Before selling: invoices can't go out until this is fixed */}
                <InvoicingReadinessAlert
                    rounded={false}
                    className="border-x-0 border-t-0"
                />
                <View />
            </div>
        </div>
    )
}

export default AppLayout
