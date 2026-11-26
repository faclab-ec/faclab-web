import {
    request,
    type APIRequestContext,
    type APIResponse,
} from '@playwright/test'
import { SEED, env } from './env'

/**
 * Lecturas por la API para la preparación y para esperar los estados
 * asíncronos. Va aparte del navegador: ni su sesión ni sus trazas.
 */
export interface Sale {
    status: string
    invoiceStatus: string | null
    total: number
}

export interface Discrepancy {
    saleId: number
    kind: string
    sale: { invoiceRequestedAt: string | null }
}

export interface InvoiceDocument {
    id: string
    /** Código del SRI: 01 factura, 04 nota de crédito */
    docType: string
    status: string
    accessCode: string | null
    issue: { code: string; message: string } | null
}

export interface InvoicingStatus {
    ready: boolean
    issues: { code: string; message?: string }[]
    pendingInvoices: number
    invoicesWithIssues: number
}

// Solo reintenta ECONNRESET: una consulta que reutiliza la conexión justo
// cuando el servidor la cierra por inactiva (uvicorn, a los 5 s)
const READ = { maxRetries: 2 }

async function data<T>(response: APIResponse): Promise<T> {
    if (!response.ok()) {
        throw new Error(
            `${response.url()} respondió ${response.status()}: ${await response.text()}`
        )
    }
    return (await response.json()).data as T
}

export class Api {
    private constructor(
        private readonly http: APIRequestContext,
        private readonly token: string
    ) {}

    /** Entra a la empresa de la prueba, como lo haría la web */
    static async signIn(): Promise<Api> {
        const http = await request.newContext()
        const login = await data<{
            selectionToken: string
            tenants: { id: string; ruc: string }[]
        }>(
            await http.post(`${env.apiUrl}/api/auth/login`, {
                data: { username: env.username, password: env.password },
            })
        )
        const tenant = login.tenants.find((t) => t.ruc === env.ruc)
        if (!tenant) throw new Error(`La semilla no creó la empresa ${env.ruc}`)
        const session = await data<{ accessToken: string }>(
            await http.post(`${env.apiUrl}/api/auth/select-tenant`, {
                data: { tenantId: tenant.id },
                headers: { Authorization: `Bearer ${login.selectionToken}` },
            })
        )
        return new Api(http, session.accessToken)
    }

    private get headers() {
        return { Authorization: `Bearer ${this.token}` }
    }

    private async core<T>(path: string): Promise<T> {
        return data<T>(
            await this.http.get(`${env.apiUrl}/api${path}`, {
                ...READ,
                headers: this.headers,
            })
        )
    }

    private async invoicing<T>(path: string): Promise<T> {
        return data<T>(
            await this.http.get(`${env.invoicingUrl}/api${path}`, {
                ...READ,
                headers: this.headers,
            })
        )
    }

    sale(id: number) {
        return this.core<Sale>(`/admin/sales/${id}`)
    }

    openDiscrepancies() {
        return this.core<Discrepancy[]>(
            '/admin/invoice-discrepancies?limit=500'
        )
    }

    documentsOfSale(saleId: number) {
        return this.invoicing<InvoiceDocument[]>(`/invoices/by-sale/${saleId}`)
    }

    /** El XML que se envió al SRI */
    async documentXml(id: string) {
        return (await this.invoicing<{ xml: string }>(`/invoices/${id}`)).xml
    }

    invoicingStatus() {
        return this.invoicing<InvoicingStatus>('/invoicing/status')
    }

    /**
     * El emisor de la empresa en faclab-invoicing: perfil fiscal en pruebas y
     * su certificado de firma. La semilla de faclab-core no lo cubre.
     */
    async setUpIssuer(certificate: Buffer) {
        const profile = {
            taxId: env.ruc,
            name: SEED.company,
            tradeName: SEED.company,
            mainAddress: 'Av. 10 de Agosto N37-45, Quito',
            accountingRequired: true,
            environment: 1,
            emissionType: 1,
        }
        const url = `${env.invoicingUrl}/api`
        const headers = this.headers
        await data(
            await this.http.put(`${url}/company-config`, {
                headers,
                data: profile,
            })
        )
        const { id } = await data<{ id: string }>(
            await this.http.post(`${url}/certificates`, {
                headers,
                // La contraseña antes que el archivo: invoicing lee los campos
                // que llegaron antes de él
                multipart: {
                    password: env.p12Password,
                    file: {
                        name: 'e2e.p12',
                        mimeType: 'application/x-pkcs12',
                        buffer: certificate,
                    },
                },
            })
        )
        await data(
            await this.http.put(`${url}/company-config`, {
                headers,
                data: { ...profile, signingCertId: id },
            })
        )
        if (env.sequenceStart) {
            for (const docType of ['01', '04']) {
                await data(
                    await this.http.put(`${url}/sequences/001/001`, {
                        headers,
                        data: { nextSequence: env.sequenceStart, docType },
                    })
                )
            }
        }
    }

    dispose() {
        return this.http.dispose()
    }
}
