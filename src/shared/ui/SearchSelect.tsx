import Select from '@/components/ui/Select'
import type { SearchOption } from '@shared/hooks/useSearchOptions'

export interface SearchSelectProps {
    options: SearchOption[]
    value: SearchOption | null
    onChange: (value: number | null) => void
    onSearchChange: (text: string) => void
    onBlur?: () => void
    isLoading?: boolean
    inputId?: string
    placeholder?: string
    isDisabled?: boolean
    isClearable?: boolean
}

/** Select whose options are filtered by the backend as the user types */
const SearchSelect = ({
    onChange,
    onSearchChange,
    ...rest
}: SearchSelectProps) => (
    <Select<SearchOption>
        filterOption={null}
        noOptionsMessage={() => 'Sin resultados'}
        loadingMessage={() => 'Buscando...'}
        onChange={(option) => onChange(option?.value ?? null)}
        onInputChange={(text, { action }) => {
            // Typing searches; closing the menu goes back to the first page
            if (action === 'input-change' || action === 'menu-close') {
                onSearchChange(text)
            }
        }}
        {...rest}
    />
)

export default SearchSelect

/** Props of the entity selects built on SearchSelect (products, customers...) */
export type EntitySelectProps = Omit<
    SearchSelectProps,
    'options' | 'value' | 'onSearchChange' | 'isLoading'
> & {
    value: number | null | undefined
}
