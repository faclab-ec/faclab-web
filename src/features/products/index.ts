export type { Product, ProductInput, ProductListParams } from './model/types'

export { productSchema, type ProductFormValues } from './model/product.schema'

export {
    useProductsList,
    useProduct,
    useProductMutations,
} from './hooks/useProducts'

export { default as ProductSelect } from './components/ProductSelect'

export { productsRoutes } from './routes'
