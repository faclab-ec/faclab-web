import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { SEARCH_PAGE_SIZE, useSearchOptions } from '../useSearchOptions'

interface Item {
    id: number
    name: string
}

const ITEMS: Item[] = [
    { id: 1, name: 'Laptop' },
    { id: 2, name: 'Mouse' },
]

const toOption = (item: Item) => ({ value: item.id, label: item.name })

const useList = vi.fn()
const useItem = vi.fn()

const render = (value: number | null, filters?: { isActive: boolean }) =>
    renderHook(
        ({ value }) =>
            useSearchOptions({ value, useList, useItem, toOption, filters }),
        { initialProps: { value } }
    )

beforeEach(() => {
    vi.useFakeTimers()
    useList.mockReset().mockReturnValue({
        data: { items: ITEMS },
        isFetching: false,
    })
    useItem.mockReset().mockReturnValue({ data: undefined })
})

afterEach(() => {
    vi.useRealTimers()
})

describe('useSearchOptions', () => {
    it('lists the first page without a search term', () => {
        const { result } = render(null, { isActive: true })

        expect(useList).toHaveBeenLastCalledWith({
            isActive: true,
            search: undefined,
            limit: SEARCH_PAGE_SIZE,
        })
        expect(result.current.options).toEqual([
            { value: 1, label: 'Laptop' },
            { value: 2, label: 'Mouse' },
        ])
    })

    it('searches once the user stops typing', () => {
        const { result } = render(null)

        act(() => result.current.setSearch('  lap '))
        expect(useList).toHaveBeenLastCalledWith(
            expect.objectContaining({ search: undefined })
        )

        act(() => vi.advanceTimersByTime(300))
        expect(useList).toHaveBeenLastCalledWith(
            expect.objectContaining({ search: 'lap' })
        )
    })

    it('takes the selected label from the page when it is there', () => {
        const { result } = render(2)

        expect(result.current.selectedOption).toEqual({
            value: 2,
            label: 'Mouse',
        })
        expect(useItem).toHaveBeenLastCalledWith(0)
    })

    it('fetches the selected item when it is outside the page', () => {
        useItem.mockReturnValue({ data: { id: 9, name: 'Monitor' } })

        const { result } = render(9)

        expect(useItem).toHaveBeenLastCalledWith(9)
        expect(result.current.selectedOption).toEqual({
            value: 9,
            label: 'Monitor',
        })
    })
})
