import StatCard from '@/components/shared/StatCard'
import type { StatusTone } from '@shared/lib/statusTone'
import {
    IMPORT_ROW_ACTION_LABELS,
    type ImportCounts as Counts,
    type ImportRowAction,
} from '../model/types'

const CARDS: {
    action: ImportRowAction
    key: keyof Counts
    tone: StatusTone
}[] = [
    { action: 'CREATE', key: 'create', tone: 'success' },
    { action: 'UPDATE', key: 'update', tone: 'info' },
    { action: 'UNCHANGED', key: 'unchanged', tone: 'neutral' },
    { action: 'SKIP', key: 'skip', tone: 'neutral' },
    { action: 'ERROR', key: 'error', tone: 'danger' },
]

interface ImportCountsProps {
    counts: Counts
    /** Sin la tarjeta de errores (lo que hizo el worker) */
    withoutErrors?: boolean
}

/** Filas por acción: lo que haría el archivo o lo que hizo el worker */
const ImportCounts = ({ counts, withoutErrors }: ImportCountsProps) => (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {CARDS.filter((card) => !(withoutErrors && card.key === 'error')).map(
            (card) => (
                <StatCard
                    key={card.key}
                    label={IMPORT_ROW_ACTION_LABELS[card.action]}
                    tone={card.tone}
                    value={counts[card.key].toLocaleString('es-EC')}
                />
            )
        )}
    </div>
)

export default ImportCounts
