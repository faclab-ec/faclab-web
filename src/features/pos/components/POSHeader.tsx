import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import { useShift } from './useShift'
import {
    HiOutlineCash,
    HiOutlineLockClosed,
    HiOutlineHome,
    HiOutlineReceiptRefund,
} from 'react-icons/hi'
import { useCan, useHasRole } from '@/stores'
import { ROLE } from '@/constants/roles.constant'
import { InvoicingStatusChip } from '@features/invoicing'

interface POSHeaderProps {
    onOpenCloseShift?: () => void
    onOpenCashMovement?: () => void
    onOpenRefund?: () => void
}

const POSHeader = ({
    onOpenCloseShift,
    onOpenCashMovement,
    onOpenRefund,
}: POSHeaderProps) => {
    const navigate = useNavigate()
    const shift = useShift()
    const [currentTime, setCurrentTime] = useState(new Date())
    const canRefund = useCan('refund:approve')
    const isCashier = useHasRole(ROLE.CASHIER)

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000)
        return () => clearInterval(timer)
    }, [])

    const formattedDate = currentTime.toLocaleDateString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    const formattedTime = currentTime.toLocaleTimeString('es-EC', {
        hour: '2-digit',
        minute: '2-digit',
    })

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex items-center gap-4">
                <div>
                    <h2 className="font-semibold text-lg leading-tight">
                        Bienvenido, {shift.cashierName}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {formattedDate}
                    </p>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 font-medium">
                    Turno #{shift.id}
                </span>
                <InvoicingStatusChip />
            </div>

            <span className="text-2xl font-bold text-gray-700 dark:text-gray-300 hidden md:block">
                {formattedTime}
            </span>

            <div className="flex items-center gap-2">
                {canRefund && (
                    <Button
                        size="sm"
                        variant="plain"
                        icon={<HiOutlineReceiptRefund />}
                        onClick={onOpenRefund}
                    >
                        Devolución
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="plain"
                    icon={<HiOutlineCash />}
                    onClick={onOpenCashMovement}
                >
                    Caja
                </Button>
                <Button
                    size="sm"
                    variant="default"
                    icon={<HiOutlineLockClosed />}
                    onClick={onOpenCloseShift}
                >
                    Cerrar Turno
                </Button>
                {!isCashier && (
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlineHome />}
                        onClick={() => navigate('/home')}
                    >
                        Administración
                    </Button>
                )}
            </div>
        </div>
    )
}

export default POSHeader
