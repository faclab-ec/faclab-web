import Table from '@/components/ui/Table'
import StatusBadge from '@/components/shared/StatusBadge'
import type { ImportTemplateColumn } from '../model/types'

const { Tr, Th, Td, THead, TBody } = Table

const requirement = (column: ImportTemplateColumn) =>
    column.key && column.required ? (
        <StatusBadge tone="info">Siempre</StatusBadge>
    ) : column.required ? (
        <StatusBadge tone="neutral">Para crear</StatusBadge>
    ) : (
        <span className="text-gray-400">No</span>
    )

/** Las columnas de una plantilla: cuáles son obligatorias y qué llevan */
const TemplateColumns = ({ columns }: { columns: ImportTemplateColumn[] }) => (
    <div className="overflow-x-auto">
        <Table compact>
            <THead>
                <Tr>
                    <Th>Columna</Th>
                    <Th>Obligatoria</Th>
                    <Th>Qué lleva</Th>
                    <Th>Ejemplo</Th>
                </Tr>
            </THead>
            <TBody>
                {columns.map((column) => (
                    <Tr key={column.name}>
                        <Td>
                            <code className="text-sm">{column.name}</code>
                        </Td>
                        <Td>{requirement(column)}</Td>
                        <Td className="text-sm">{column.description}</Td>
                        <Td className="text-sm text-gray-500">
                            {column.example || '—'}
                        </Td>
                    </Tr>
                ))}
            </TBody>
        </Table>
    </div>
)

export default TemplateColumns
