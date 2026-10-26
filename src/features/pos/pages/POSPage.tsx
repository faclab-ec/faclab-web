import ShiftGuard from '../components/ShiftGuard'
import TerminalGuard from '../components/TerminalGuard'
import POSLayout from '../components/POSLayout'

const POSPage = () => {
    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900">
            <TerminalGuard>
                <ShiftGuard>
                    <POSLayout />
                </ShiftGuard>
            </TerminalGuard>
        </div>
    )
}

export default POSPage
