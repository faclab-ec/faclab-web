import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type {
    PaginatedResponse,
    DataResponse,
    PaginationParams,
} from '@/@types/api'
import type { Category } from '../model/types'
import type { CategoryFormValues } from '../model/category.schema'

const HOST = appConfig.inventoryApiHost

export const getCategories = (params?: PaginationParams) =>
    httpClient.get<PaginatedResponse<Category>>(`${HOST}/categories`, {
        params,
    })

export const getCategoryById = (id: number) =>
    httpClient.get<DataResponse<Category>>(`${HOST}/categories/${id}`)

export const createCategory = (data: CategoryFormValues) =>
    httpClient.post<DataResponse<Category>>(`${HOST}/categories`, data)

export const updateCategory = (id: number, data: Partial<CategoryFormValues>) =>
    httpClient.put<DataResponse<Category>>(`${HOST}/categories/${id}`, data)

export const deleteCategory = (id: number) =>
    httpClient.delete(`${HOST}/categories/${id}`)
