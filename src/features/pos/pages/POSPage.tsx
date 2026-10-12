import ShiftGuard from '../components/ShiftGuard'
import POSLayout from '../components/POSLayout'

const POSPage = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900">
            <ShiftGuard>
                <POSLayout />
            </ShiftGuard>
        </div>
    )
}

export default POSPage
