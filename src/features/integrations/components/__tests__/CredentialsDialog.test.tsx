import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CredentialsDialog from '../CredentialsDialog'
import { notifySuccess } from '@shared/ui/notify'

vi.mock('@shared/ui/notify', () => ({
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
}))

const CREDENTIALS = {
    title: 'Credenciales de Tienda en línea',
    clientId: 'fl_test_3f2a9c1b0d4e',
    secret: 'secreto-de-prueba',
}

describe('CredentialsDialog', () => {
    beforeEach(() => vi.clearAllMocks())

    it('shows the client id and the secret with a warning', () => {
        render(
            <CredentialsDialog credentials={CREDENTIALS} onClose={vi.fn()} />
        )

        expect(screen.getByLabelText('Client ID')).toHaveValue(
            'fl_test_3f2a9c1b0d4e'
        )
        expect(screen.getByLabelText('Secreto')).toHaveValue(
            'secreto-de-prueba'
        )
        expect(screen.getByRole('alert')).toHaveTextContent(
            'No lo podrás ver de nuevo'
        )
    })

    it('copies the secret to the clipboard', async () => {
        const user = userEvent.setup()
        const writeText = vi
            .spyOn(navigator.clipboard, 'writeText')
            .mockResolvedValue()
        render(
            <CredentialsDialog credentials={CREDENTIALS} onClose={vi.fn()} />
        )

        await user.click(screen.getByRole('button', { name: 'Copiar secreto' }))

        expect(writeText).toHaveBeenCalledWith('secreto-de-prueba')
        expect(notifySuccess).toHaveBeenCalledWith('Secreto copiado')
    })

    it('only closes with its button', async () => {
        const user = userEvent.setup()
        const onClose = vi.fn()
        render(
            <CredentialsDialog credentials={CREDENTIALS} onClose={onClose} />
        )

        expect(
            screen.queryByRole('button', { name: /cerrar/i })
        ).not.toBeInTheDocument()
        await user.click(screen.getByRole('button', { name: 'Ya lo guardé' }))
        expect(onClose).toHaveBeenCalled()
    })

    it('renders nothing without credentials', () => {
        render(<CredentialsDialog credentials={null} onClose={vi.fn()} />)
        expect(screen.queryByText('Secreto')).not.toBeInTheDocument()
    })
})
