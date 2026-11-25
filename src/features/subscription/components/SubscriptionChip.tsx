import { useSession } from '@/stores'
import { subscriptionNotice } from '../model/types'

const CHIP_CLASSES = {
    danger: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300',
    warning:
        'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
} as const

const CHIP_TEXT = {
    danger: 'Solo consulta',
    warning: 'Límite de comprobantes',
    info: 'Prueba por terminar',
} as const

/**
 * Compact version of the subscription notice for the POS, which hides the app
 * layout. Hover shows why.
 */
const SubscriptionChip = () => {
    const notice = subscriptionNotice(useSession()?.subscription)
    if (!notice) return null
    return (
        <span
            className={`px-2 py-1 text-xs rounded-full font-medium ${
                CHIP_CLASSES[notice.type]
            }`}
            title={`${notice.title}. ${notice.message}`}
        >
            {CHIP_TEXT[notice.type]}
        </span>
    )
}

export default SubscriptionChip
