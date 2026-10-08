import { httpClient } from '@shared/lib/http/httpClient'
import appConfig from '@/configs/app.config'
import type { PaginatedResponse, DataResponse } from '@/@types/api'
import type {
    Customer,
    CustomerContact,
    CustomerListParams,
} from '../model/types'
import type { CustomerFormValues } from '../model/customer.schema'
import type { ContactFormValues } from '../model/contact.schema'

const HOST = appConfig.inventoryApiHost

export const getCustomers = (params?: CustomerListParams) =>
    httpClient.get<PaginatedResponse<Customer>>(`${HOST}/customers`, { params })

export const getCustomer = (id: number) =>
    httpClient.get<DataResponse<Customer>>(`${HOST}/customers/${id}`)

export const searchCustomerByTaxId = (taxId: string) =>
    httpClient.get<DataResponse<Customer>>(
        `${HOST}/customers/search/by-tax-id`,
        {
            params: { taxId },
        }
    )

export const createCustomer = (data: CustomerFormValues) =>
    httpClient.post<DataResponse<Customer>>(`${HOST}/customers`, data)

export const updateCustomer = (id: number, data: CustomerFormValues) =>
    httpClient.put<DataResponse<Customer>>(`${HOST}/customers/${id}`, data)

export const deleteCustomer = (id: number) =>
    httpClient.delete(`${HOST}/customers/${id}`)

export const activateCustomer = (id: number) =>
    httpClient.post<DataResponse<Customer>>(`${HOST}/customers/${id}/activate`)

export const deactivateCustomer = (id: number) =>
    httpClient.post<DataResponse<Customer>>(
        `${HOST}/customers/${id}/deactivate`
    )

export const getCustomerContacts = (customerId: number) =>
    httpClient.get<DataResponse<CustomerContact[]>>(
        `${HOST}/customers/${customerId}/contacts`
    )

export const createCustomerContact = (
    customerId: number,
    data: ContactFormValues
) =>
    httpClient.post<DataResponse<CustomerContact>>(
        `${HOST}/customers/${customerId}/contacts`,
        data
    )

export const updateCustomerContact = (id: number, data: ContactFormValues) =>
    httpClient.put<DataResponse<CustomerContact>>(
        `${HOST}/customer-contacts/${id}`,
        data
    )

export const deleteCustomerContact = (id: number) =>
    httpClient.delete(`${HOST}/customer-contacts/${id}`)
