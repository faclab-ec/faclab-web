import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type { Product, ProductInput, ProductListParams } from '../model/types'

const HOST = appConfig.inventoryApiHost

export const getProducts = (params?: ProductListParams) =>
    httpClient.get<PaginatedResponse<Product>>(`${HOST}/products`, { params })

export const getProductById = (id: number) =>
    httpClient.get<DataResponse<Product>>(`${HOST}/products/${id}`)

export const createProduct = (data: ProductInput) =>
    httpClient.post<DataResponse<Product>>(`${HOST}/products`, data)

export const updateProduct = (id: number, data: Partial<ProductInput>) =>
    httpClient.put<DataResponse<Product>>(`${HOST}/products/${id}`, data)

export const deleteProduct = (id: number) =>
    httpClient.delete(`${HOST}/products/${id}`)
