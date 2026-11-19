import {
    WEBHOOK_EVENT_LABELS,
    WEBHOOK_EVENT_SCOPES,
    WEBHOOK_EVENT_TYPES,
    type IntegrationClient,
    type WebhookEventType,
} from '../model/types'
import CheckboxList from './CheckboxList'

interface EventTypesFieldProps {
    value: WebhookEventType[]
    /** El cliente dueño: solo recibe los eventos de lo que puede leer */
    owner: IntegrationClient | null
    disabled?: boolean
    onChange: (value: WebhookEventType[]) => void
}

/** Los eventos del webhook, con el scope que necesita el cliente dueño. */
const EventTypesField = ({
    value,
    owner,
    disabled,
    onChange,
}: EventTypesFieldProps) => (
    <CheckboxList
        legend="Eventos"
        disabled={disabled}
        value={value}
        options={WEBHOOK_EVENT_TYPES.map((type) => {
            const scope = WEBHOOK_EVENT_SCOPES[type]
            const missing = !!owner && !owner.scopes.includes(scope)
            return {
                value: type,
                label: (
                    <>
                        {WEBHOOK_EVENT_LABELS[type]}{' '}
                        <span className="font-mono text-xs text-gray-500">
                            {type}
                        </span>
                    </>
                ),
                hint: missing ? `El cliente no tiene ${scope}` : undefined,
                // Se puede desmarcar uno que quedó sin scope, no marcarlo
                disabled: missing && !value.includes(type),
            }
        })}
        onChange={onChange}
    />
)

export default EventTypesField
