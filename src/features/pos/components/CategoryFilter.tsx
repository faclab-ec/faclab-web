import classNames from 'classnames'
import { useCategoriesList as useCategories } from '@features/categories'
import { usePOSStore } from '../store/usePOSStore'

const chipClass = (selected: boolean) =>
    classNames(
        'shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
        selected
            ? 'border-primary-600 bg-primary-600 text-white'
            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
    )

/** Filtra la grilla por categoría; se desplaza en horizontal si no caben. */
const CategoryFilter = () => {
    const { data } = useCategories({ limit: 100 })
    const selectedCategoryId = usePOSStore((s) => s.selectedCategoryId)
    const setSelectedCategory = usePOSStore((s) => s.setSelectedCategory)

    const categories = data?.items || []

    return (
        <div
            role="group"
            aria-label="Categorías"
            className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1"
        >
            <button
                type="button"
                className={chipClass(selectedCategoryId === null)}
                aria-pressed={selectedCategoryId === null}
                onClick={() => setSelectedCategory(null)}
            >
                Todos
            </button>

            {categories.map((cat) => (
                <button
                    key={cat.id}
                    type="button"
                    className={chipClass(selectedCategoryId === cat.id)}
                    aria-pressed={selectedCategoryId === cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                >
                    {cat.name}
                </button>
            ))}
        </div>
    )
}

export default CategoryFilter
