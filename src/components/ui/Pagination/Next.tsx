import classNames from 'classnames'
import { HiChevronRight } from 'react-icons/hi'
import type { CommonProps } from '../@types/common'
import type { MouseEvent } from 'react'

interface NextProps extends CommonProps {
    currentPage: number
    pageCount: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
    }
    onNext: (e: MouseEvent<HTMLButtonElement>) => void
}

const Next = (props: NextProps) => {
    const { currentPage, pageCount, pagerClass, onNext } = props

    const disabled = currentPage === pageCount || pageCount === 0

    const pagerNextClass = classNames(
        pagerClass.default,
        'pagination-pager-next',
        disabled ? pagerClass.disabled : pagerClass.inactive
    )

    return (
        <button
            type="button"
            className={pagerNextClass}
            aria-label="Página siguiente"
            disabled={disabled}
            onClick={onNext}
        >
            <HiChevronRight />
        </button>
    )
}

export default Next
