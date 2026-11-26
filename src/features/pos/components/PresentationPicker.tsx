import Dialog from '@/components/ui/Dialog'
import { formatCurrency } from '@shared/lib/format'
import { formatQuantity } from '@shared/lib/quantity'
import type { ProductPresentation } from '@features/products'
import type { POSProduct } from '../model/types'

interface PresentationPickerProps {
    product: POSProduct
    presentations: ProductPresentation[]
    isOpen: boolean
    onClose: () => void
    onPick: (presentation: ProductPresentation) => void
}

/** Elige en qué se vende el producto: por unidad, por caja, por rollo (S5.2) */
const PresentationPicker = ({
    product,
    presentations,
    isOpen,
    onClose,
    onPick,
}: PresentationPickerProps) => (
    <Dialog
        isOpen={isOpen}
        width={420}
        contentLabel={`Presentación de ${product.name}`}
        // Sobre la pantalla del POS (z-50), como sus demás diálogos
        overlayClassName="!z-[60]"
        onClose={onClose}
        onRequestClose={onClose}
    >
        <h5 className="mb-1 pr-8">{product.name}</h5>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            ¿En qué presentación se vende?
        </p>
        <ul className="flex flex-col gap-2">
            {presentations.map((presentation) => (
                <li key={presentation.id}>
                    <button
                        type="button"
                        className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-left transition hover:border-primary-400 hover:bg-primary-50 dark:border-gray-700 dark:hover:bg-gray-700"
                        onClick={() => onPick(presentation)}
                    >
                        <span>
                            <span className="block font-medium">
                                {presentation.name}
                            </span>
                            {!presentation.isBase && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatQuantity(
                                        presentation.factor,
                                        product.unitSymbol
                                    )}
                                </span>
                            )}
                        </span>
                        <span className="font-semibold">
                            {formatCurrency(
                                presentation.isBase
                                    ? product.salePrice ?? 0
                                    : presentation.effectiveSalePrice ?? 0
                            )}
                        </span>
                    </button>
                </li>
            ))}
        </ul>
    </Dialog>
)

export default PresentationPicker
