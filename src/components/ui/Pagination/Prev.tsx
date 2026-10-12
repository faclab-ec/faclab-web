import classNames from 'classnames'
import { HiChevronLeft } from 'react-icons/hi'
import type { CommonProps } from '../@types/common'
import type { MouseEvent } from 'react'

interface PrevProps extends CommonProps {
    currentPage: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
    }
    onPrev: (e: MouseEvent<HTMLButtonElement>) => void
}

const Prev = (props: PrevProps) => {
    const { currentPage, pagerClass, onPrev } = props

    const disabled = currentPage <= 1

    const pagerPrevClass = classNames(
        pagerClass.default,
        'pagination-pager-prev',
        disabled ? pagerClass.disabled : pagerClass.inactive
    )

    return (
        <button
            type="button"
            className={pagerPrevClass}
            aria-label="Página anterior"
            disabled={disabled}
            onClick={onPrev}
        >
            <HiChevronLeft />
        </button>
    )
}

export default Prev
