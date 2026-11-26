import { readFile } from 'node:fs/promises'
import { expect } from '@playwright/test'
import { Api } from './api'
import { env } from './env'

/** Deja la empresa lista para facturar antes de abrir el navegador */
export default async function globalSetup() {
    const api = await Api.signIn()
    try {
        if (!(await api.invoicingStatus().catch(() => null))?.ready) {
            await api.setUpIssuer(await readFile(env.p12Path))
        }
        // invoicing guarda la disponibilidad del emisor hasta un minuto. Quedan
        // avisos esperados (ambiente de pruebas); ningún error
        await expect
            .poll(async () => (await api.invoicingStatus()).ready, {
                message: 'el emisor no quedó listo para facturar',
                timeout: 90_000,
                intervals: [1_000, 2_000],
            })
            .toBe(true)
    } finally {
        await api.dispose()
    }
}
