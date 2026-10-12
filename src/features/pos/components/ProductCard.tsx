import { memo, useCallback } from 'react'
import { HiOutlinePhotograph } from 'react-icons/hi'
import { formatCurrency } from '@shared/lib/format'
import { usePOSStore } from '../store/usePOSStore'
import type { POSProduct } from '../model/types'

interface ProductCardProps {
    product: POSProduct
}

const ProductCard = memo(({ product }: ProductCardProps) => {
    const addItem = usePOSStore((s) => s.addItem)

    const handleClick = useCallback(() => {
        addItem({
            productId: product.id,
            name: product.name,
            sku: product.sku,
            salePrice: product.salePrice ?? 0,
            taxCode: product.taxCode,
        })
    }, [addItem, product])

    return (
        <button
            type="button"
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-card transition duration-150 hover:border-primary-400 hover:shadow-pop active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:shadow-none"
            onClick={handleClick}
        >
            <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-100 dark:bg-gray-700/60">
                {product.image ? (
                    <img
                        src={product.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <HiOutlinePhotograph
                        aria-hidden="true"
                        className="text-4xl text-gray-300 dark:text-gray-500"
                    />
                )}
            </div>

            <div className="flex flex-1 flex-col justify-between gap-1 p-3">
                <p className="line-clamp-2 text-sm font-medium text-gray-800 dark:text-gray-100">
                    {product.name}
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-50">
                    {formatCurrency(product.salePrice ?? 0)}
                </p>
            </div>
        </button>
    )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard
