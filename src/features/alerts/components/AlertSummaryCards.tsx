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
    const cards = [
        {
            tab: 'low_stock',
            label: 'Stock Bajo',
            count: counts.lowStock,
            colorClass:
                'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
            textClass: 'text-amber-700 dark:text-amber-300',
            countClass: 'text-amber-600 dark:text-amber-400',
        },
        {
            tab: 'out_of_stock',
            label: 'Sin Stock',
            count: counts.outOfStock,
            colorClass:
                'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20',
            textClass: 'text-red-700 dark:text-red-300',
            countClass: 'text-red-600 dark:text-red-400',
        },
        {
            tab: 'reorder_point',
            label: 'Punto de Reorden',
            count: counts.reorderPoint,
            colorClass:
                'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
            textClass: 'text-blue-700 dark:text-blue-300',
            countClass: 'text-blue-600 dark:text-blue-400',
        },
        {
            tab: 'expiring_soon',
            label: 'Por Vencer',
            count: counts.expiringLots,
            colorClass:
                'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20',
            textClass: 'text-orange-700 dark:text-orange-300',
            countClass: 'text-orange-600 dark:text-orange-400',
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map((card) => (
                <button
                    key={card.tab}
                    className={`border rounded-lg p-4 text-left cursor-pointer transition-all hover:shadow-md ${
                        card.colorClass
                    } ${
                        activeTab === card.tab
                            ? 'ring-2 ring-offset-1 ring-current'
                            : ''
                    }`}
                    onClick={() => onSelect(card.tab)}
                >
                    <p className={`text-sm font-medium ${card.textClass}`}>
                        {card.label}
                    </p>
                    <p className={`text-3xl font-bold mt-1 ${card.countClass}`}>
                        {card.count}
                    </p>
                </button>
            ))}
        </div>
    )
}

export default AlertSummaryCards
