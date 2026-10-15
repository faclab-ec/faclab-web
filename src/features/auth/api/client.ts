import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { DataResponse } from '@/@types/api'
import type {
    ChangePasswordRequest,
    LoginRequest,
    LoginResponse,
    MeResponse,
} from '@/@types/auth'

const AUTH = appConfig.authApiHost

// El refresh no vive aquí: usa `refreshSession` de @shared/lib/auth/session,
// que deduplica las llamadas y guarda el access token en el store.
//
// Login, refresh y logout van con `withCredentials`: el backend responde (o
// lee) la cookie HttpOnly del refresh token. El resto de llamadas no la
// necesita, y faclab-invoicing no acepta credenciales por CORS.

export const apiLogin = (body: LoginRequest) =>
    httpClient.post<DataResponse<LoginResponse>>(`${AUTH}/login`, body, {
        withCredentials: true,
    })

export const apiMe = () =>
    httpClient.get<DataResponse<MeResponse>>(`${AUTH}/me`)

export const apiChangePassword = (body: ChangePasswordRequest) =>
    httpClient.post<void>(`${AUTH}/change-password`, body)

// Revoca la sesión en el servidor y borra la cookie del refresh token
export const apiLogout = () =>
    httpClient.post<void>(`${AUTH}/logout`, undefined, {
        withCredentials: true,
    })
