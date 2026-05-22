import { useState, useMemo } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import {
    usePOSStore,
    getCartSubtotal,
    getCartDiscountAmount,
    getCartTotal,
} from '../store/usePOSStore'
import type { DiscountType } from '../model/types'

interface DiscountDialogProps {
    isOpen: boolean
    onClose: () => void
}

const DiscountDialog = ({ isOpen, onClose }: DiscountDialogProps) => {
    const {
        cartItems,
        discountType: currentType,
        discountValue: currentValue,
        applyDiscount,
        clearDiscount,
    } = usePOSStore()

    const hasExistingDiscount = currentType !== null && currentValue > 0

    const [type, setType] = useState<DiscountType>(() =>
        isOpen && hasExistingDiscount ? currentType! : 'PERCENTAGE'
    )
    const [value, setValue] = useState<string>(() =>
        isOpen && hasExistingDiscount ? currentValue.toString() : ''
    )

    const [prevIsOpen, setPrevIsOpen] = useState(isOpen)
    if (prevIsOpen !== isOpen) {
        setPrevIsOpen(isOpen)
        if (isOpen) {
            setType(hasExistingDiscount ? currentType! : 'PERCENTAGE')
            setValue(hasExistingDiscount ? currentValue.toString() : '')
        }
    }

    const numValue = Number(value) || 0

    const { previewAmount, newTotal } = useMemo(() => {
        const subtotal = getCartSubtotal(cartItems)
        return {
            previewAmount: getCartDiscountAmount(subtotal, type, numValue),
            newTotal: getCartTotal(cartItems, type, numValue),
        }
    }, [cartItems, type, numValue])

    const handleApply = () => {
        if (numValue > 0) {
            applyDiscount(type, numValue)
        }
        onClose()
    }

    const handleClear = () => {
        clearDiscount()
        onClose()
    }

    return (
        <Dialog
            isOpen={isOpen}
            width={400}
            overlayClassName="!z-[60]"
            onClose={onClose}
        >
            <h4 className="text-lg font-bold mb-4">Aplicar Descuento</h4>

            <div className="flex gap-2 mb-4">
                <Button
                    block
                    variant={type === 'PERCENTAGE' ? 'solid' : 'default'}
                    onClick={() => setType('PERCENTAGE')}
                >
                    Porcentaje (%)
                </Button>
                <Button
                    block
                    variant={type === 'AMOUNT' ? 'solid' : 'default'}
                    onClick={() => setType('AMOUNT')}
                >
                    Monto ($)
                </Button>
            </div>

            <Input
                type="number"
                step="any"
                value={value}
                placeholder="0"
                suffix={type === 'PERCENTAGE' ? '%' : '$'}
                onChange={(e) => setValue(e.target.value)}
            />

            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Descuento: ${previewAmount.toFixed(2)}
                </p>
                <p className="font-bold">Nuevo total: ${newTotal.toFixed(2)}</p>
            </div>

            <div className="flex gap-2 mt-4">
                {hasExistingDiscount && (
                    <Button
                        variant="plain"
                        className="text-red-500"
                        onClick={handleClear}
                    >
                        Quitar
                    </Button>
                )}
                <Button block variant="default" onClick={onClose}>
                    Cancelar
                </Button>
                <Button
                    block
                    variant="solid"
                    disabled={numValue <= 0}
                    onClick={handleApply}
                >
                    Aplicar
                </Button>
            </div>
        </Dialog>
    )
}

export default DiscountDialog
