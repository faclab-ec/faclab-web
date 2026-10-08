export type AppConfig = {
    apiPrefix: string
    apiBaseUrl: string
    authApiHost: string
    adminUsersApiHost: string
    authenticatedEntryPath: string
    unAuthenticatedEntryPath: string
    tourPath: string
    locale: string
    enableMock: boolean
    inventoryApiHost: string
    posApiHost: string
    invoicingApiHost: string
}

const apiBaseUrl =
    (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
    'http://localhost:3000'

const invoicingApiUrl =
    (import.meta.env.VITE_INVOICING_API_URL as string | undefined) ??
    'http://localhost:3173'

const appConfig: AppConfig = {
    apiPrefix: '',
    apiBaseUrl,
    authApiHost: `${apiBaseUrl}/api/auth`,
    adminUsersApiHost: `${apiBaseUrl}/api/admin/users`,
    authenticatedEntryPath: '/home',
    unAuthenticatedEntryPath: '/sign-in',
    tourPath: '/',
    locale: 'en',
    enableMock: false,
    inventoryApiHost: `${apiBaseUrl}/api/admin`,
    posApiHost: `${apiBaseUrl}/api/pos`,
    invoicingApiHost: invoicingApiUrl,
}

export default appConfig
