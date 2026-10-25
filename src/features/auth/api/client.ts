import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { DataResponse } from '@/@types/api'
import type {
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
    SelectTenantRequest,
    TokenPair,
} from '@/@types/auth'

const AUTH = appConfig.authApiHost

// El refresh no vive aquí: usa `refreshSession` de @shared/lib/auth/session,
// que deduplica las llamadas y guarda el access token en el store.
//
// Login, select-tenant, refresh y logout van con `withCredentials`: el backend responde (o
// lee) la cookie HttpOnly del refresh token. El resto de llamadas no la
// necesita, y faclab-invoicing no acepta credenciales por CORS.

export const apiLogin = (body: LoginRequest) =>
    httpClient.post<DataResponse<LoginResponse>>(`${AUTH}/login`, body, {
        withCredentials: true,
    })

/**
 * Abre la sesión en una empresa. Tras el login se autentica con el token de
 * selección; para cambiar de empresa, con el access token vigente (lo pone el
 * interceptor), y el backend cierra la sesión anterior.
 */
export const apiSelectTenant = (
    body: SelectTenantRequest,
    selectionToken?: string
) =>
    httpClient.post<DataResponse<TokenPair>>(`${AUTH}/select-tenant`, body, {
        withCredentials: true,
        headers: selectionToken
            ? { Authorization: `Bearer ${selectionToken}` }
            : undefined,
    })

/**
 * Con `accessToken`, lee la sesión de un token que todavía no está en el
 * store (el de la empresa recién elegida).
 */
export const apiMe = (accessToken?: string) =>
    httpClient.get<DataResponse<MeResponse>>(`${AUTH}/me`, {
        headers: accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : undefined,
    })

export const apiChangePassword = (body: ChangePasswordRequest) =>
    httpClient.post<void>(`${AUTH}/change-password`, body)

// Revoca la sesión en el servidor y borra la cookie del refresh token
export const apiLogout = () =>
    httpClient.post<void>(`${AUTH}/logout`, undefined, {
        withCredentials: true,
    })
