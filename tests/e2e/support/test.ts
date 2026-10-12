import { test as base, expect } from '@playwright/test'
import type { Session } from '@/@types/auth'
import { MockApi } from './mockApi'
import { signInAs, type SessionOptions } from './session'

interface Fixtures {
    /** API simulada de la prueba; ver `mockApi.ts`. */
    api: MockApi
    /** Errores de consola y excepciones no capturadas vistos durante la prueba. */
    consoleErrors: string[]
    /** Deja la sesión iniciada antes de abrir la app. */
    signIn: (options?: SessionOptions) => Promise<Session>
}

export const test = base.extend<Fixtures>({
    api: async ({ page }, use) => {
        const api = await MockApi.attach(page)

        await use(api)

        expect(
            api.unhandled,
            'La app llamó a endpoints que la prueba no simuló'
        ).toEqual([])
    },

    // Automático: ninguna prueba pasa con errores en la consola del navegador.
    consoleErrors: [
        async ({ page, api }, use) => {
            const errors: string[] = []

            page.on('pageerror', (error) => {
                errors.push(`Excepción no capturada: ${error.message}`)
            })
            page.on('console', (message) => {
                if (message.type() !== 'error') return
                // El navegador registra cada respuesta 4xx/5xx; solo se
                // toleran las que la propia prueba pidió simular.
                if (api.failedOnPurpose.has(message.location().url)) return
                errors.push(`console.error: ${message.text()}`)
            })

            await use(errors)

            expect(errors, 'Errores en la consola del navegador').toEqual([])
        },
        { auto: true },
    ],

    signIn: async ({ page, api }, use) => {
        await use((options) => signInAs(page, api, options))
    },
})

export { expect }
