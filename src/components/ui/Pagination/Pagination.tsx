import { useMemo, useCallback } from 'react'
import useControllableState from '../hooks/useControllableState'
import Pager from './Pagers'
import Prev from './Prev'
import Next from './Next'
import Total from './Total'
import classNames from 'classnames'
import { useConfig } from '../ConfigProvider'
import type { CommonProps } from '../@types/common'

export interface PaginationProps extends CommonProps {
    currentPage?: number
    displayTotal?: boolean
    onChange?: (pageNumber: number) => void
    pageSize?: number
    total?: number
}

const Pagination = (props: PaginationProps) => {
    const {
        className,
        currentPage = 1,
        displayTotal = false,
        onChange,
        pageSize = 1,
        total = 5,
    } = props

    const { themeColor, primaryColorLevel } = useConfig()

    const getInternalPageCount = useMemo(() => {
        if (typeof total === 'number') {
            return Math.ceil(total / pageSize)
        }
        return null
    }, [total, pageSize])

    const getValidCurrentPage = useCallback(
        (count: number | string) => {
            const value = parseInt(count as string, 10)
            const internalPageCount = getInternalPageCount
            let resetValue
            if (!internalPageCount) {
                if (isNaN(value) || value < 1) {
                    resetValue = 1
                }
            } else {
                if (value < 1) {
                    resetValue = 1
                }
                if (value > internalPageCount) {
                    resetValue = internalPageCount
                }
            }

            if (
                (resetValue === undefined && isNaN(value)) ||
                resetValue === 0
            ) {
                resetValue = 1
            }

            return resetValue === undefined ? value : resetValue
        },
        [getInternalPageCount]
    )

    const [internalCurrentPage, setInternalCurrentPage] =
        useControllableState<number>({
            prop: currentPage,
            defaultProp: getValidCurrentPage(currentPage),
            onChange,
        })

    const onPaginationChange = (val: number) => {
        setInternalCurrentPage(getValidCurrentPage(val))
    }

    const onPrev = useCallback(() => {
        const newPage = (internalCurrentPage ?? 1) - 1
        setInternalCurrentPage(getValidCurrentPage(newPage))
    }, [internalCurrentPage, getValidCurrentPage, setInternalCurrentPage])

    const onNext = useCallback(() => {
        const newPage = (internalCurrentPage ?? 1) + 1
        setInternalCurrentPage(getValidCurrentPage(newPage))
    }, [internalCurrentPage, getValidCurrentPage, setInternalCurrentPage])

    const pagerClass = {
        default: 'pagination-pager',
        inactive: 'pagination-pager-inactive',
        active: `text-white bg-${themeColor}-${primaryColorLevel} hover:bg-${themeColor}-${primaryColorLevel}`,
        disabled: 'pagination-pager-disabled',
    }

    const paginationClass = classNames('pagination', className)

    return (
        <nav className={paginationClass} aria-label="Paginación">
            {displayTotal && <Total total={total} />}
            <Prev
                currentPage={internalCurrentPage ?? 1}
                pagerClass={pagerClass}
                onPrev={onPrev}
            />
            <Pager
                pageCount={getInternalPageCount as number}
                currentPage={internalCurrentPage ?? 1}
                pagerClass={pagerClass}
                onChange={onPaginationChange}
            />
            <Next
                currentPage={internalCurrentPage ?? 1}
                pageCount={getInternalPageCount as number}
                pagerClass={pagerClass}
                onNext={onNext}
            />
        </nav>
    )
}

Pagination.displayName = 'Pagination'

export default Pagination
