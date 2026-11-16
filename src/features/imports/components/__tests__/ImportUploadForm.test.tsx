import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import ImportUploadForm from '../ImportUploadForm'
import * as api from '../../api/client'
import type { ImportTemplate } from '../../model/types'

vi.mock('../../api/client')
vi.mock('@shared/ui/notify', () => ({
    notifyWarning: vi.fn(),
    notifyError: vi.fn(),
}))

const TEMPLATES: ImportTemplate[] = [
    {
        kind: 'PRODUCTS',
        fileName: 'productos',
        columns: [
            {
                name: 'sku',
                description: 'Código interno del producto',
                example: 'TOR-0001',
                key: true,
                required: true,
            },
            {
                name: 'precio_venta',
                description: 'Precio de venta',
                example: '0.15',
                key: false,
                required: true,
            },
        ],
    },
]

const renderForm = () => {
    const onSubmit = vi.fn()
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    })
    render(
        <QueryClientProvider client={client}>
            <ImportUploadForm uploading={false} onSubmit={onSubmit} />
        </QueryClientProvider>
    )
    return onSubmit
}

beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.getImportTemplates).mockResolvedValue({
        data: TEMPLATES,
        meta: { requestId: 'r', timestamp: 't' },
    })
})

describe('ImportUploadForm', () => {
    it('shows the columns of the template and sends the chosen file', async () => {
        const onSubmit = renderForm()

        expect(
            await screen.findByText('Código interno del producto')
        ).toBeVisible()
        const submit = screen.getByRole('button', { name: 'Validar archivo' })
        expect(submit).toBeDisabled()

        const file = new File(['sku,precio_venta\nA-1,1\n'], 'productos.csv', {
            type: 'text/csv',
        })
        await userEvent.upload(
            screen.getByLabelText('Archivo a importar'),
            file
        )
        expect(screen.getByText('productos.csv')).toBeVisible()
        await userEvent.click(submit)

        await waitFor(() =>
            expect(onSubmit).toHaveBeenCalledWith({
                kind: 'PRODUCTS',
                mode: 'SKIP',
                file,
            })
        )
    })

    it('refuses a file that is not CSV or XLSX', async () => {
        const { notifyWarning } = await import('@shared/ui/notify')
        renderForm()

        await userEvent.upload(
            screen.getByLabelText('Archivo a importar'),
            new File(['x'], 'productos.xls'),
            { applyAccept: false }
        )

        expect(notifyWarning).toHaveBeenCalledWith(
            'Archivo no admitido',
            expect.stringMatching(/\.xlsx/)
        )
        expect(
            screen.getByRole('button', { name: 'Validar archivo' })
        ).toBeDisabled()
    })
})
