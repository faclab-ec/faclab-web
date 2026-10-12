import { usePOSProducts, usePOSSearchProducts } from '../hooks/usePOS'
import { usePOSStore } from '../store/usePOSStore'
import ProductCard from './ProductCard'
import Skeleton from '@/components/ui/Skeleton'
import EmptyState from '@/components/shared/EmptyState'
import { HiOutlineSearch } from 'react-icons/hi'

const ProductGrid = () => {
    const searchTerm = usePOSStore((s) => s.searchTerm)
    const selectedCategoryId = usePOSStore((s) => s.selectedCategoryId)

    const { data: allProducts, isLoading: allLoading } = usePOSProducts()
    const { data: searchResults, isLoading: searchLoading } =
        usePOSSearchProducts(searchTerm)

    const isSearching = searchTerm.length >= 2
    const isLoading = isSearching ? searchLoading : allLoading

    const products = isSearching
        ? searchResults || []
        : (allProducts || []).filter(
              (p) =>
                  selectedCategoryId === null ||
                  p.categoryId === selectedCategoryId
          )

    if (isLoading) {
        return (
            <div
                aria-label="Cargando"
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            >
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                    >
                        <Skeleton height={120} className="!rounded-none" />
                        <div className="p-3 space-y-2">
                            <Skeleton height={16} />
                            <Skeleton height={20} width="60%" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <EmptyState
                icon={<HiOutlineSearch />}
                title="No se encontraron productos"
                description="Prueba con otro nombre, SKU o categoría."
            />
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {products.map((product) => (
                <ProductCard key={product.id} product={product} />
            ))}
        </div>
    )
}

export default ProductGrid
