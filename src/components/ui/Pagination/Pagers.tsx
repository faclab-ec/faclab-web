import { useState, useCallback, useMemo } from 'react'
import classNames from 'classnames'
import {
    HiOutlineChevronDoubleLeft,
    HiOutlineDotsHorizontal,
    HiChevronDoubleRight,
} from 'react-icons/hi'

const PAGER_COUNT = 7

type More = 'nextMore' | 'prevMore'

type MoreProps = {
    className: string
    onArrow: (more: More) => void
}

const NextMore = ({ className, onArrow }: MoreProps) => {
    const [quickNextArrowIcon, setQuickNextArrowIcon] = useState(false)

    return (
        <li>
            <button
                type="button"
                className={className}
                aria-label="Avanzar 5 páginas"
                onMouseEnter={() => {
                    setQuickNextArrowIcon(true)
                }}
                onMouseLeave={() => {
                    setQuickNextArrowIcon(false)
                }}
                onClick={() => onArrow('nextMore')}
            >
                {quickNextArrowIcon ? (
                    <HiChevronDoubleRight />
                ) : (
                    <HiOutlineDotsHorizontal />
                )}
            </button>
        </li>
    )
}

const PrevMore = ({ className, onArrow }: MoreProps) => {
    const [quickPrevArrowIcon, setQuickPrevArrowIcon] = useState(false)

    return (
        <li>
            <button
                type="button"
                className={className}
                aria-label="Retroceder 5 páginas"
                onMouseEnter={() => {
                    setQuickPrevArrowIcon(true)
                }}
                onMouseLeave={() => {
                    setQuickPrevArrowIcon(false)
                }}
                onClick={() => onArrow('prevMore')}
            >
                {quickPrevArrowIcon ? (
                    <HiOutlineChevronDoubleLeft />
                ) : (
                    <HiOutlineDotsHorizontal />
                )}
            </button>
        </li>
    )
}

type PagersProps = {
    pageCount: number
    currentPage: number
    pagerClass: {
        default: string
        inactive: string
        active: string
        disabled: string
    }
    onChange: (page: number) => void
}

const Pagers = (props: PagersProps) => {
    const { pageCount, currentPage, onChange, pagerClass } = props

    let showPrevMore = false
    let showNextMore = false
    if (pageCount > PAGER_COUNT) {
        if (currentPage > PAGER_COUNT - 2) showPrevMore = true
        if (currentPage < pageCount - 2) showNextMore = true
        if (currentPage >= pageCount - 3 && currentPage <= pageCount)
            showNextMore = false
        if (currentPage >= 1 && currentPage <= 4) showPrevMore = false
    }

    const onPagerClick = (value: number) => {
        let newPage = value

        if (newPage < 1) {
            newPage = 1
        }
        if (newPage > pageCount) {
            newPage = pageCount
        }

        if (newPage !== currentPage) {
            onChange(newPage)
        }
    }

    const onArrowClick = useCallback(
        (e: More) => {
            let newPage = currentPage
            if (e === 'nextMore') {
                newPage = currentPage + 5
            }
            if (e === 'prevMore') {
                newPage = currentPage - 5
            }
            onChange(newPage)
        },
        [currentPage, onChange]
    )

    const getPages = useMemo(() => {
        const pagerArray = []
        if (showPrevMore && !showNextMore) {
            const startPage = pageCount - (PAGER_COUNT - 2)
            for (let i = startPage; i < pageCount; i++) {
                pagerArray.push(i)
            }
        } else if (!showPrevMore && showNextMore) {
            for (let i = 2; i < PAGER_COUNT; i++) {
                pagerArray.push(i)
            }
        } else if (showPrevMore && showNextMore) {
            const offset = Math.floor(PAGER_COUNT / 2) - 1
            const maxRange =
                currentPage >= pageCount - 2 && currentPage <= pageCount
            for (
                let i = currentPage - offset;
                i <= currentPage + (maxRange ? 0 : offset);
                i++
            ) {
                pagerArray.push(i)
            }
        } else {
            for (let i = 2; i < pageCount; i++) {
                pagerArray.push(i)
            }
        }
        if (pagerArray.length > PAGER_COUNT - 2) {
            return []
        }

        return pagerArray
    }, [showPrevMore, showNextMore, currentPage, pageCount])

    const getPagerClass = (index: number) => {
        return classNames(
            pagerClass.default,
            currentPage === index ? pagerClass.active : pagerClass.inactive
        )
    }

    const renderPager = (page: number) => (
        <li key={page}>
            <button
                type="button"
                className={getPagerClass(page)}
                aria-label={`Página ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                onClick={() => onPagerClick(page)}
            >
                {page}
            </button>
        </li>
    )

    return (
        <ul className="flex items-center">
            {pageCount > 0 && renderPager(1)}
            {showPrevMore && (
                <PrevMore
                    className={classNames(
                        pagerClass.default,
                        pagerClass.inactive
                    )}
                    onArrow={(arrow) => onArrowClick(arrow)}
                />
            )}
            {getPages.map((pager) => renderPager(pager))}
            {showNextMore && (
                <NextMore
                    className={classNames(
                        pagerClass.default,
                        pagerClass.inactive
                    )}
                    onArrow={(arrow) => onArrowClick(arrow)}
                />
            )}
            {pageCount > 1 && renderPager(pageCount)}
        </ul>
    )
}

export default Pagers
