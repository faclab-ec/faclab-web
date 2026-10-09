export type {
    Supplier,
    SupplierContact,
    SupplierProduct,
    TaxType,
    SupplierListParams,
} from './model/types'
export { TAX_TYPE_LABELS } from './model/types'

export {
    supplierSchema,
    taxTypeSchema,
    type SupplierFormValues,
} from './model/supplier.schema'
export {
    supplierProductSchema,
    type SupplierProductFormValues,
} from './model/supplierProduct.schema'

export {
    useSuppliersList,
    useSupplier,
    useSupplierMutations,
} from './hooks/useSuppliers'
export {
    useSupplierContacts,
    useSupplierContactMutations,
} from './hooks/useSupplierContacts'
export {
    useSupplierProducts,
    useSupplierProductsByProduct,
    useSupplierProductMutations,
} from './hooks/useSupplierProducts'

export { default as SupplierSelect } from './components/SupplierSelect'

export { suppliersRoutes } from './routes'
