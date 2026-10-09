import SearchSelect, { type EntitySelectProps } from '@shared/ui/SearchSelect'
import { useSearchOptions } from '@shared/hooks/useSearchOptions'
import { useSupplier, useSuppliersList } from '../hooks/useSuppliers'
import type { Supplier } from '../model/types'

const toOption = (supplier: Supplier) => ({
    value: supplier.id,
    label: `${supplier.name} (${supplier.taxId})`,
})

type SupplierSelectProps = EntitySelectProps & {
    /** Offer only active suppliers */
    activeOnly?: boolean
}

/** Supplier picker that searches by name or tax ID on the server */
const SupplierSelect = ({
    value,
    activeOnly,
    ...rest
}: SupplierSelectProps) => {
    const { options, selectedOption, isLoading, setSearch } = useSearchOptions({
        value,
        useList: useSuppliersList,
        filters: activeOnly ? { isActive: true } : {},
        useItem: useSupplier,
        toOption,
    })

    return (
        <SearchSelect
            placeholder="Buscar proveedor por nombre o identificación"
            {...rest}
            options={options}
            value={selectedOption}
            isLoading={isLoading}
            onSearchChange={setSearch}
        />
    )
}

export default SupplierSelect
