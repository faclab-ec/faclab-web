import StatusBadge from '@/components/shared/StatusBadge'
import {
    WEBHOOK_DISABLED_REASON_LABELS,
    WEBHOOK_ENDPOINT_STATUS_LABELS,
    WEBHOOK_ENDPOINT_STATUS_TONES,
    type WebhookEndpoint,
} from '../model/types'

/** Activo, o desactivado con su motivo */
const EndpointStatusBadge = ({ endpoint }: { endpoint: WebhookEndpoint }) => (
    <StatusBadge tone={WEBHOOK_ENDPOINT_STATUS_TONES[endpoint.status]}>
        {WEBHOOK_ENDPOINT_STATUS_LABELS[endpoint.status]}
        {endpoint.disabledReason &&
            ` · ${WEBHOOK_DISABLED_REASON_LABELS[endpoint.disabledReason]}`}
    </StatusBadge>
)

export default EndpointStatusBadge
