import {
    HiOutlineBan,
    HiOutlineClock,
    HiOutlineRefresh,
    HiOutlineTrendingDown,
} from 'react-icons/hi'
import StatCard from '@/components/shared/StatCard'
import type { ReactNode } from 'react'
import type { StatusTone } from '@shared/lib/statusTone'

interface AlertCounts {
    lowStock: number
    outOfStock: number
    reorderPoint: number
    expiringLots: number
}

interface AlertSummaryCardsProps {
    counts: AlertCounts
    activeTab: string
    onSelect: (tab: string) => void
}

const AlertSummaryCards = ({
    counts,
    activeTab,
    onSelect,
}: AlertSummaryCardsProps) => {
    const cards: {
        tab: string
        label: string
        count: number
        tone: StatusTone
        icon: ReactNode
    }[] = [
        {
            tab: 'low_stock',
            label: 'Stock bajo',
            count: counts.lowStock,
            tone: 'warning',
            icon: <HiOutlineTrendingDown />,
        },
        {
            tab: 'out_of_stock',
            label: 'Sin stock',
            count: counts.outOfStock,
            tone: 'danger',
            icon: <HiOutlineBan />,
        },
        {
            tab: 'reorder_point',
            label: 'Punto de reorden',
            count: counts.reorderPoint,
            tone: 'info',
            icon: <HiOutlineRefresh />,
        },
        {
            tab: 'expiring_soon',
            label: 'Por vencer',
            count: counts.expiringLots,
            tone: 'warning',
            icon: <HiOutlineClock />,
        },
    ]

    return (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {cards.map((card) => (
                <StatCard
                    key={card.tab}
                    label={card.label}
                    value={card.count}
                    icon={card.icon}
                    tone={card.count > 0 ? card.tone : 'neutral'}
                    selected={activeTab === card.tab}
                    onClick={() => onSelect(card.tab)}
                />
            ))}
        </div>
    )
}

export default AlertSummaryCards
