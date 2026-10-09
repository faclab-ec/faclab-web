import { useNavigate } from 'react-router-dom'
import Header from '@/components/template/Header'
import SidePanel from '@/components/template/SidePanel'
import UserDropdown from '@/components/template/UserDropdown'
import SideNavToggle from '@/components/template/SideNavToggle'
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
            <SidePanel />
            <UserDropdown hoverable={false} />
        </>
    )
}

const ModernLayout = () => {
    return (
        <div className="app-layout-modern flex flex-auto flex-col">
            <div className="flex flex-auto min-w-0">
                <SideNav />
                <div className="flex flex-col flex-auto min-h-screen min-w-0 relative w-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
                    <Header
                        className="border-b border-gray-200 dark:border-gray-700"
                        headerEnd={<HeaderActionsEnd />}
                        headerStart={<HeaderActionsStart />}
                    />
                    {/* Before selling: invoices can't go out until this is fixed */}
                    <InvoicingReadinessAlert
                        rounded={false}
                        className="border-b border-gray-200 dark:border-gray-700"
                    />
                    <View />
                </div>
            </div>
        </div>
    )
}

export default ModernLayout
