import Card from '@/components/ui/Card'
import { formatDatetime } from '@shared/lib/format'
import type { PurchaseOrder, PurchaseReceipt } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'

type Props = {
    order: PurchaseOrder
    receipts: PurchaseReceipt[]
}

export const PurchaseOrderReceipts = ({ order, receipts }: Props) => {
    if (order.status === 'draft') return null

    return (
        <Card>
            <h5 className="mb-4">Recepciones ({receipts.length})</h5>
            {receipts.length === 0 ? (
                <EmptyState
                    className="!py-8"
                    title="No hay recepciones registradas"
                />
            ) : (
                <div className="space-y-3">
                    {receipts.map((receipt) => (
                        <div
                            key={receipt.id}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">
                                        Recepción #{receipt.id}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {receipt.receivedAt
                                            ? formatDatetime(receipt.receivedAt)
                                            : receipt.createdAt
                                            ? formatDatetime(receipt.createdAt)
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                            {receipt.notes && (
                                <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">
                                    {receipt.notes}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
