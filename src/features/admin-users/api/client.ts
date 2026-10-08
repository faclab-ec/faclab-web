import appConfig from '@/configs/app.config'
import { httpClient } from '@shared/lib/http/httpClient'
import type { DataResponse, PaginatedResponse } from '@/@types/api'
import type {
    AdminUserResponse,
    AdminUserListParams,
    CreateUserRequest,
    UpdateUserRoleRequest,
    ResetUserPasswordRequest,
} from '@/@types/auth'

const BASE = appConfig.adminUsersApiHost

export const listUsers = (params?: AdminUserListParams) =>
    httpClient.get<PaginatedResponse<AdminUserResponse>>(BASE, { params })

export const getUser = (id: number) =>
    httpClient.get<DataResponse<AdminUserResponse>>(`${BASE}/${id}`)

export const createUser = (data: CreateUserRequest) =>
    httpClient.post<DataResponse<AdminUserResponse>>(BASE, data)

export const updateRole = (id: number, data: UpdateUserRoleRequest) =>
    httpClient.put<DataResponse<AdminUserResponse>>(`${BASE}/${id}/role`, data)

export const activateUser = (id: number) =>
    httpClient.post<DataResponse<AdminUserResponse>>(`${BASE}/${id}/activate`)

export const deactivateUser = (id: number) =>
    httpClient.post<DataResponse<AdminUserResponse>>(`${BASE}/${id}/deactivate`)

export const resetPassword = (id: number, data: ResetUserPasswordRequest) =>
    httpClient.post<DataResponse<AdminUserResponse>>(
        `${BASE}/${id}/reset-password`,
        data
    )
