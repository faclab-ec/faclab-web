import SearchSelect, { type EntitySelectProps } from '@shared/ui/SearchSelect'
import { useSearchOptions } from '@shared/hooks/useSearchOptions'
import { useCustomer, useCustomersList } from '../hooks/useCustomers'
import type { Customer } from '../model/types'

const toOption = (customer: Customer) => ({
    value: customer.id,
    label: `${customer.name} (${customer.taxId})`,
})

/** Customer picker that searches by name or tax ID on the server */
const CustomerSelect = ({ value, ...rest }: EntitySelectProps) => {
    const { options, selectedOption, isLoading, setSearch } = useSearchOptions({
        value,
        useList: useCustomersList,
        useItem: useCustomer,
        toOption,
    })

    return (
        <SearchSelect
            placeholder="Buscar cliente por nombre o identificación"
            {...rest}
            options={options}
            value={selectedOption}
            isLoading={isLoading}
            onSearchChange={setSearch}
        />
    )
}

export default CustomerSelect
