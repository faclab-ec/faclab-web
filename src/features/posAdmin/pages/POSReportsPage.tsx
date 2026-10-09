import { useState } from 'react'
import Card from '@/components/ui/Card'
import Tabs from '@/components/ui/Tabs'
import Table from '@/components/ui/Table'
import Spinner from '@/components/ui/Spinner'
import { formatCurrency } from '@shared/lib/format'
import { useByPaymentMethodReport, useDailyReport } from '@features/pos'
import {
    PaymentsByMethodTable,
    ProductsSoldTable,
    StatCard,
} from '../components/ReportBlocks'
import { paymentMethodLabel } from '../lib/labels'

const { TabList, TabNav, TabContent } = Tabs
const { Tr, Th, Td, THead, TBody } = Table

// YYYY-MM-DD in the browser's time zone
const isoDate = (date: Date) => date.toLocaleDateString('en-CA')
const today = () => isoDate(new Date())
const firstOfMonth = () => {
    const now = new Date()
    return isoDate(new Date(now.getFullYear(), now.getMonth(), 1))
}

const DateInput = ({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (value: string) => void
}) => (
    <div>
        <label className="block text-sm font-medium mb-2">{label}</label>
        <input
            type="date"
            className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
)

const DailyTab = () => {
    const [date, setDate] = useState(today)
    const { data: report, isLoading } = useDailyReport(date)

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DateInput label="Día" value={date} onChange={setDate} />
            </div>
            {isLoading || !report ? (
                <div className="flex justify-center py-8">
                    <Spinner size={30} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        <StatCard label="Ventas" value={report.totalSales} />
                        <StatCard
                            label="Total vendido"
                            value={formatCurrency(report.totalAmount)}
                            tone="text-emerald-600 dark:text-emerald-400"
                        />
                        <StatCard
                            label="Devoluciones"
                            value={`${
                                report.refundSummary.count
                            } · ${formatCurrency(report.refundSummary.total)}`}
                            tone="text-red-600 dark:text-red-400"
                        />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <PaymentsByMethodTable rows={report.paymentsByMethod} />
                        <ProductsSoldTable
                            title="Productos más vendidos"
                            rows={report.topProducts}
                        />
                    </div>
                </>
            )}
        </div>
    )
}

const ByPaymentMethodTab = () => {
    const [fromDate, setFromDate] = useState(firstOfMonth)
    const [toDate, setToDate] = useState(today)
    const { data: rows = [], isLoading } = useByPaymentMethodReport(
        fromDate,
        toDate
    )
    const total = rows.reduce((sum, row) => sum + row.totalAmount, 0)

    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DateInput
                    label="Desde"
                    value={fromDate}
                    onChange={setFromDate}
                />
                <DateInput label="Hasta" value={toDate} onChange={setToDate} />
            </div>
            <Card>
                <div className="p-4">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Spinner size={30} />
                        </div>
                    ) : rows.length === 0 ? (
                        <p className="text-sm text-gray-500">
                            Sin ventas en el período
                        </p>
                    ) : (
                        <Table>
                            <THead>
                                <Tr>
                                    <Th>Forma de pago</Th>
                                    <Th>Ventas</Th>
                                    <Th>Total</Th>
                                </Tr>
                            </THead>
                            <TBody>
                                {rows.map((row) => (
                                    <Tr key={row.paymentMethod}>
                                        <Td>
                                            {paymentMethodLabel(
                                                row.paymentMethod
                                            )}
                                        </Td>
                                        <Td>{row.salesCount}</Td>
                                        <Td>
                                            {formatCurrency(row.totalAmount)}
                                        </Td>
                                    </Tr>
                                ))}
                                <Tr>
                                    <Td className="font-semibold">Total</Td>
                                    <Td />
                                    <Td className="font-semibold">
                                        {formatCurrency(total)}
                                    </Td>
                                </Tr>
                            </TBody>
                        </Table>
                    )}
                </div>
            </Card>
        </div>
    )
}

const POSReportsPage = () => {
    const [activeTab, setActiveTab] = useState('daily')

    return (
        <Card>
            <div className="p-4">
                <div className="mb-4">
                    <h4 className="text-lg font-semibold">Reportes POS</h4>
                    <p className="text-sm text-gray-500 mt-1">
                        Los reportes X y Z de cada turno están en el detalle del
                        turno
                    </p>
                </div>
                <Tabs value={activeTab} onChange={setActiveTab}>
                    <TabList>
                        <TabNav value="daily">Diario</TabNav>
                        <TabNav value="byPaymentMethod">
                            Por forma de pago
                        </TabNav>
                    </TabList>
                    <div className="mt-4">
                        <TabContent value="daily">
                            <DailyTab />
                        </TabContent>
                        <TabContent value="byPaymentMethod">
                            <ByPaymentMethodTab />
                        </TabContent>
                    </div>
                </Tabs>
            </div>
        </Card>
    )
}

export default POSReportsPage
