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
import StatusBadge from '@/components/shared/StatusBadge'
import { LogoMark } from '@/components/template/Logo'

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
        <header className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex min-w-0 items-center gap-3">
                <LogoMark
                    size={30}
                    className="hidden shrink-0 text-gray-900 dark:text-white sm:block"
                />
                <div className="min-w-0">
                    <h1 className="truncate text-base leading-tight">
                        Hola, {shift.cashierName}
                    </h1>
                    <p className="hidden truncate text-xs text-gray-500 first-letter:uppercase dark:text-gray-400 sm:block">
                        {formattedDate}
                    </p>
                </div>
                <StatusBadge tone="success" className="shrink-0">
                    Turno #{shift.id}
                </StatusBadge>
                <InvoicingStatusChip />
            </div>

            <span className="hidden text-xl font-semibold tabular-nums text-gray-700 dark:text-gray-200 xl:block">
                {formattedTime}
            </span>

            {/* En pantallas pequeñas solo queda el ícono; el nombre va en aria-label */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                {canRefund && (
                    <Button
                        size="sm"
                        variant="plain"
                        aria-label="Devolución"
                        icon={<HiOutlineReceiptRefund />}
                        onClick={onOpenRefund}
                    >
                        <span className="hidden md:inline">Devolución</span>
                    </Button>
                )}
                <Button
                    size="sm"
                    variant="plain"
                    aria-label="Caja"
                    icon={<HiOutlineCash />}
                    onClick={onOpenCashMovement}
                >
                    <span className="hidden md:inline">Caja</span>
                </Button>
                <Button
                    size="sm"
                    variant="default"
                    aria-label="Cerrar turno"
                    icon={<HiOutlineLockClosed />}
                    onClick={onOpenCloseShift}
                >
                    <span className="hidden md:inline">Cerrar turno</span>
                </Button>
                {!isCashier && (
                    <Button
                        size="sm"
                        variant="default"
                        aria-label="Administración"
                        icon={<HiOutlineHome />}
                        onClick={() => navigate('/home')}
                    >
                        <span className="hidden md:inline">Administración</span>
                    </Button>
                )}
            </div>
        </header>
    )
}

export default POSHeader
