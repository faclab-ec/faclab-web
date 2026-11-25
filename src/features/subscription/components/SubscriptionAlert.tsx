import Alert from '@/components/ui/Alert'
import { useSession } from '@/stores'
import { subscriptionNotice } from '../model/types'

interface SubscriptionAlertProps {
    rounded?: boolean
    className?: string
}

/**
 * Says when the company's subscription isn't active (it can only read), when
 * its trial is about to end, or when this month's documents reached the plan.
 * It comes from `/api/auth/me`: every role sees it, without another request.
 */
const SubscriptionAlert = ({
    rounded = true,
    className,
}: SubscriptionAlertProps) => {
    const notice = subscriptionNotice(useSession()?.subscription)
    if (!notice) return null
    return (
        <Alert
            showIcon
            type={notice.type}
            title={notice.title}
            rounded={rounded}
            className={className}
        >
            {notice.message}
        </Alert>
    )
}

export default SubscriptionAlert
