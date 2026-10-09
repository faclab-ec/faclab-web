import SearchSelect, { type EntitySelectProps } from '@shared/ui/SearchSelect'
import { useSearchOptions } from '@shared/hooks/useSearchOptions'
import { useProduct, useProductsList } from '../hooks/useProducts'
import type { Product } from '../model/types'

const toOption = (product: Product) => ({
    value: product.id,
    label: `${product.name} (${product.sku})`,
})

/** Product picker that searches by name, SKU or barcode on the server */
const ProductSelect = ({ value, ...rest }: EntitySelectProps) => {
    const { options, selectedOption, isLoading, setSearch } = useSearchOptions({
        value,
        useList: useProductsList,
        useItem: useProduct,
        toOption,
    })

    return (
        <SearchSelect
            placeholder="Buscar producto por nombre, SKU o código"
            {...rest}
            options={options}
            value={selectedOption}
            isLoading={isLoading}
            onSearchChange={setSearch}
        />
    )
}

export default ProductSelect
