import { useState } from 'react'
import { useDebouncedValue } from './useDebouncedValue'

export interface SearchOption {
    value: number
    label: string
}

interface ListQuery<T> {
    data?: { items: T[] }
    isFetching: boolean
}

interface ItemQuery<T> {
    data?: T
}

interface UseSearchOptionsArgs<T, F extends object> {
    /** Id currently selected */
    value: number | null | undefined
    /** List hook of the entity; receives the typed text as `search` */
    useList: (params: F & { search?: string; limit: number }) => ListQuery<T>
    /** Extra list filters, e.g. `{ isActive: true }` */
    filters?: F
    /** Single-item hook of the entity (disabled for id 0) */
    useItem: (id: number) => ItemQuery<T>
    toOption: (item: T) => SearchOption
}

export const SEARCH_PAGE_SIZE = 20

/**
 * Options for a select that searches on the server: the backend filters by the
 * typed text (`?search=`) and returns one page, so the page never loads the
 * whole catalog. The selected value can fall outside that page, so its label
 * is fetched by id.
 */
export const useSearchOptions = <T, F extends object = object>({
    value,
    useList,
    filters,
    useItem,
    toOption,
}: UseSearchOptionsArgs<T, F>) => {
    const [search, setSearch] = useState('')
    const term = useDebouncedValue(search.trim())

    const list = useList({
        ...(filters as F),
        search: term || undefined,
        limit: SEARCH_PAGE_SIZE,
    })
    const options = (list.data?.items ?? []).map(toOption)

    const listed = options.find((option) => option.value === value)
    const selected = useItem(listed || !value ? 0 : value)
    const selectedOption =
        listed ?? (value && selected.data ? toOption(selected.data) : null)

    return {
        options,
        selectedOption,
        isLoading: list.isFetching,
        setSearch,
    }
}
