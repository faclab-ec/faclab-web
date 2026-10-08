import { memo, useCallback } from 'react'
import { HiOutlinePhotograph } from 'react-icons/hi'
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
        <div
            className="cursor-pointer border border-gray-200 dark:border-gray-600 rounded-lg
                       overflow-hidden hover:border-primary-400 hover:shadow-md transition-all"
            onClick={handleClick}
        >
            <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {product.image ? (
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <HiOutlinePhotograph className="text-4xl text-gray-400" />
                )}
            </div>

            <div className="p-3">
                <p className="text-sm font-medium line-clamp-2">
                    {product.name}
                </p>
                <p className="text-primary-600 dark:text-primary-400 font-bold mt-1">
                    ${product.salePrice?.toFixed(2) ?? '0.00'}
                </p>
            </div>
        </div>
    )
})

ProductCard.displayName = 'ProductCard'

export default ProductCard
