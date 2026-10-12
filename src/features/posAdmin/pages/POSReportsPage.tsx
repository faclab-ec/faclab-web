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
} from '../components/ReportBlocks'
import { paymentMethodLabel } from '../lib/labels'
import Input from '@/components/ui/Input'
import { PageHeader, StatCard } from '@/components/shared'
import LabeledField from '@/components/shared/LabeledField'
import {
    HiOutlineCurrencyDollar,
    HiOutlineReceiptRefund,
    HiOutlineShoppingCart,
} from 'react-icons/hi'

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
    <LabeledField label={label}>
        <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </LabeledField>
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
                        <StatCard
                            label="Ventas"
                            value={report.totalSales}
                            icon={<HiOutlineShoppingCart />}
                            tone="info"
                        />
                        <StatCard
                            label="Total vendido"
                            value={formatCurrency(report.totalAmount)}
                            icon={<HiOutlineCurrencyDollar />}
                            tone="success"
                        />
                        <StatCard
                            label="Devoluciones"
                            value={`${
                                report.refundSummary.count
                            } · ${formatCurrency(report.refundSummary.total)}`}
                            icon={<HiOutlineReceiptRefund />}
                            tone="danger"
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
                                        {paymentMethodLabel(row.paymentMethod)}
                                    </Td>
                                    <Td>{row.salesCount}</Td>
                                    <Td>{formatCurrency(row.totalAmount)}</Td>
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
            </Card>
        </div>
    )
}

const POSReportsPage = () => {
    const [activeTab, setActiveTab] = useState('daily')

    return (
        <>
            <PageHeader
                title="Reportes POS"
                description="Los reportes X y Z de cada turno están en el detalle del turno"
            />
            <Card>
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
            </Card>
        </>
    )
}

export default POSReportsPage
