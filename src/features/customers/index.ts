export type {
    Customer,
    CustomerContact,
    TaxType,
    CustomerListParams,
} from './model/types'
export { TAX_TYPE_LABELS } from './model/types'

export {
    customerSchema,
    type CustomerFormValues,
} from './model/customer.schema'
export { contactSchema, type ContactFormValues } from './model/contact.schema'

export {
    useCustomersList,
    useCustomer,
    useSearchCustomerByTaxId,
    useCustomerMutations,
} from './hooks/useCustomers'
export {
    useCustomerContactsList,
    useCustomerContactMutations,
} from './hooks/useCustomerContacts'

export { default as CustomerSelect } from './components/CustomerSelect'

export { customersRoutes } from './routes'
