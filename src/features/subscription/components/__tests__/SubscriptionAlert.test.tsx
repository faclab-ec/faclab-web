import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Session, SessionSubscription } from '@/@types/auth'
import SubscriptionAlert from '../SubscriptionAlert'
import SubscriptionChip from '../SubscriptionChip'

const session = (subscription?: SessionSubscription): Session => ({
    id: 1,
    username: 'ana',
    fullName: null,
    role: 1,
    permissions: [],
    mustChangePassword: false,
    tenant: {
        id: 't',
        ruc: '1799999990001',
        legalName: 'Ferretería',
        tradeName: null,
    },
    tenants: [],
    branches: [],
    subscription,
})

const suspended: SessionSubscription = {
    planName: 'Básico',
    status: 'suspended',
    trialEndsAt: null,
    readOnly: true,
    documentsLimitReached: false,
}

describe('SubscriptionAlert', () => {
    afterEach(() => useAuthStore.setState({ session: null }))

    it('tells a suspended company it can only read', () => {
        useAuthStore.setState({ session: session(suspended) })

        render(<SubscriptionAlert />)

        expect(
            screen.getByText(
                'La suscripción está suspendida: la empresa solo puede consultar'
            )
        ).toBeInTheDocument()
    })

    it('shows nothing for an active company or an older core', () => {
        useAuthStore.setState({
            session: session({
                ...suspended,
                status: 'active',
                readOnly: false,
            }),
        })
        const { container } = render(<SubscriptionAlert />)
        expect(container).toBeEmptyDOMElement()

        useAuthStore.setState({ session: session(undefined) })
        const older = render(<SubscriptionChip />)
        expect(older.container).toBeEmptyDOMElement()
    })

    it('marks the POS of a suspended company', () => {
        useAuthStore.setState({ session: session(suspended) })

        render(<SubscriptionChip />)

        expect(screen.getByText('Solo consulta')).toHaveAttribute(
            'title',
            expect.stringContaining('solo puede consultar')
        )
    })
})
