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
// que deduplica las llamadas y guarda los tokens en el store.

export const apiLogin = (body: LoginRequest) =>
    httpClient.post<DataResponse<LoginResponse>>(`${AUTH}/login`, body)

export const apiMe = () =>
    httpClient.get<DataResponse<MeResponse>>(`${AUTH}/me`)

export const apiChangePassword = (body: ChangePasswordRequest) =>
    httpClient.post<void>(`${AUTH}/change-password`, body)
