import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    Supplier,
    SupplierContact,
    SupplierProduct,
    SupplierListParams,
} from '../model/types'
import type { SupplierFormValues } from '../model/supplier.schema'
import type { SupplierProductFormValues } from '../model/supplierProduct.schema'
import type { ContactFormValues } from '@features/customers'

const HOST = appConfig.inventoryApiHost

// --- Suppliers ---

export const getSuppliers = (params?: SupplierListParams) =>
    httpClient.get<PaginatedResponse<Supplier>>(`${HOST}/suppliers`, { params })

export const getSupplier = (id: number) =>
    httpClient.get<DataResponse<Supplier>>(`${HOST}/suppliers/${id}`)

export const createSupplier = (data: SupplierFormValues) =>
    httpClient.post<DataResponse<Supplier>>(`${HOST}/suppliers`, data)

export const updateSupplier = (id: number, data: SupplierFormValues) =>
    httpClient.put<DataResponse<Supplier>>(`${HOST}/suppliers/${id}`, data)

export const deleteSupplier = (id: number) =>
    httpClient.delete(`${HOST}/suppliers/${id}`)

export const activateSupplier = (id: number) =>
    httpClient.post<DataResponse<Supplier>>(`${HOST}/suppliers/${id}/activate`)

export const deactivateSupplier = (id: number) =>
    httpClient.post<DataResponse<Supplier>>(
        `${HOST}/suppliers/${id}/deactivate`
    )

// --- Contacts ---

export const getSupplierContacts = (supplierId: number) =>
    httpClient.get<DataResponse<SupplierContact[]>>(
        `${HOST}/suppliers/${supplierId}/contacts`
    )

export const getSupplierContact = (id: number) =>
    httpClient.get<DataResponse<SupplierContact>>(
        `${HOST}/supplier-contacts/${id}`
    )

export const createSupplierContact = (
    supplierId: number,
    data: ContactFormValues
) =>
    httpClient.post<DataResponse<SupplierContact>>(
        `${HOST}/suppliers/${supplierId}/contacts`,
        data
    )

export const updateSupplierContact = (id: number, data: ContactFormValues) =>
    httpClient.put<DataResponse<SupplierContact>>(
        `${HOST}/supplier-contacts/${id}`,
        data
    )

export const deleteSupplierContact = (id: number) =>
    httpClient.delete(`${HOST}/supplier-contacts/${id}`)

// --- Supplier Products ---

export const getSupplierProducts = (supplierId: number) =>
    httpClient.get<DataResponse<SupplierProduct[]>>(
        `${HOST}/suppliers/${supplierId}/products`
    )

export const getSupplierProductsByProduct = (productId: number) =>
    httpClient.get<DataResponse<SupplierProduct[]>>(
        `${HOST}/supplier-products/by-product/${productId}`
    )

export const createSupplierProduct = (
    supplierId: number,
    data: SupplierProductFormValues
) =>
    httpClient.post<DataResponse<SupplierProduct>>(
        `${HOST}/suppliers/${supplierId}/products`,
        data
    )

export const updateSupplierProduct = (
    id: number,
    data: SupplierProductFormValues
) =>
    httpClient.put<DataResponse<SupplierProduct>>(
        `${HOST}/supplier-products/${id}`,
        data
    )

export const deleteSupplierProduct = (id: number) =>
    httpClient.delete(`${HOST}/supplier-products/${id}`)
