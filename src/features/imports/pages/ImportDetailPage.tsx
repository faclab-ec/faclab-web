import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { HiOutlineDownload } from 'react-icons/hi'
import Alert from '@/components/ui/Alert'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Progress from '@/components/ui/Progress'
import Spinner from '@/components/ui/Spinner'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import ErrorState from '@/components/shared/ErrorState'
import PageHeader from '@/components/shared/PageHeader'
import StatusBadge from '@/components/shared/StatusBadge'
import { formatDatetime } from '@shared/lib/format'
import { notifyError, notifySuccess } from '@shared/ui/notify'
import ImportCounts from '../components/ImportCounts'
import ImportErrorsTable from '../components/ImportErrorsTable'
import {
    useConfirmImport,
    useImport,
    useImportDownloads,
} from '../hooks/useImports'
import {
    IMPORT_ERROR_MESSAGES,
    IMPORT_KIND_LABELS,
    IMPORT_MODE_LABELS,
    IMPORT_STATUS_LABELS,
    IMPORT_STATUS_TONES,
    importProgress,
    isImportInProgress,
    type ImportJob,
} from '../model/types'

const rows = (count: number) =>
    `${count.toLocaleString('es-EC')} ${count === 1 ? 'fila' : 'filas'}`

const StatusNotice = ({ job }: { job: ImportJob }) => {
    switch (job.status) {
        case 'INVALID':
            return (
                <Alert showIcon type="danger" title="El archivo tiene errores">
                    No se importó nada. Corrige las filas de abajo (o descarga
                    el reporte) y vuelve a subir el archivo.
                </Alert>
            )
        case 'VALIDATED':
            return (
                <Alert showIcon type="info" title="Listo para importar">
                    Todas las filas son válidas. Revisa el resumen y confirma:
                    la importación corre en segundo plano y puedes salir de esta
                    página.
                </Alert>
            )
        case 'COMPLETED':
            return (
                <Alert showIcon type="success" title="Importación completada">
                    Se importaron {rows(job.processedRows)}
                    {job.finishedAt
                        ? ` el ${formatDatetime(job.finishedAt)}`
                        : ''}
                    .
                </Alert>
            )
        case 'FAILED':
            return (
                <Alert showIcon type="danger" title="La importación se detuvo">
                    {job.failedRow ? `Fila ${job.failedRow}: ` : ''}
                    {job.failure}
                    {job.processedRows > 0 &&
                        ` Las ${rows(
                            job.processedRows
                        )} anteriores quedaron importadas; vuelve a subir el archivo corregido: lo ya importado no se duplica.`}
                </Alert>
            )
        default:
            return null
    }
}

/**
 * Una importación: lo que haría cada fila, sus errores, la confirmación y el
 * progreso mientras el worker la importa.
 */
const ImportDetailPage = () => {
    const id = Number(useParams().id ?? 0)
    const navigate = useNavigate()
    const { data: job, isLoading, error, refetch } = useImport(id)
    const confirm = useConfirmImport()
    const downloads = useImportDownloads()
    const [confirming, setConfirming] = useState(false)

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Spinner size={40} />
            </div>
        )
    }
    if (error || !job) return <ErrorState onRetry={refetch} />

    const running = isImportInProgress(job.status)
    const started =
        running || job.status === 'COMPLETED' || job.status === 'FAILED'
    const hasErrors = job.planned.error > 0 || job.failure !== null

    const onConfirm = async () => {
        setConfirming(false)
        try {
            await confirm.mutateAsync(job.id)
            notifySuccess(
                'Importación en cola',
                'Se importa en segundo plano; aquí verás su avance.'
            )
        } catch (err) {
            notifyError(err, 'No se pudo confirmar la importación', {
                messages: IMPORT_ERROR_MESSAGES,
            })
        }
    }

    return (
        <>
            <PageHeader
                title={`Importación de ${IMPORT_KIND_LABELS[
                    job.kind
                ].toLowerCase()}`}
                description={`${job.fileName} · ${rows(job.totalRows)} · ${
                    IMPORT_MODE_LABELS[job.mode]
                }`}
                badge={
                    <StatusBadge tone={IMPORT_STATUS_TONES[job.status]}>
                        {IMPORT_STATUS_LABELS[job.status]}
                    </StatusBadge>
                }
                actions={
                    <>
                        {hasErrors && (
                            <Button
                                size="sm"
                                icon={<HiOutlineDownload />}
                                loading={downloads.isBusy(`errors:${job.id}`)}
                                onClick={() => downloads.errors(job)}
                            >
                                Descargar errores
                            </Button>
                        )}
                        {job.status === 'VALIDATED' && (
                            <Button
                                size="sm"
                                variant="solid"
                                loading={confirm.isPending}
                                onClick={() => setConfirming(true)}
                            >
                                Confirmar importación
                            </Button>
                        )}
                    </>
                }
                onBack={() => navigate('/settings/imports')}
            />

            <div className="mb-4">
                <StatusNotice job={job} />
            </div>

            {running && (
                <Card className="mb-4">
                    <p className="mb-2 text-sm">
                        {job.status === 'QUEUED'
                            ? 'En cola: empieza en unos segundos.'
                            : `Importando: ${job.processedRows.toLocaleString(
                                  'es-EC'
                              )} de ${rows(job.totalRows)}.`}
                    </p>
                    <div
                        aria-label="Avance de la importación"
                        aria-valuemax={100}
                        aria-valuemin={0}
                        aria-valuenow={importProgress(job)}
                        role="progressbar"
                    >
                        <Progress percent={importProgress(job)} />
                    </div>
                </Card>
            )}

            <h2 className="mb-3 text-lg font-semibold">
                {started ? 'Lo que se importó' : 'Lo que hará cada fila'}
            </h2>
            <div className="mb-6">
                <ImportCounts
                    counts={started ? job.done : job.planned}
                    withoutErrors={started}
                />
            </div>

            {job.planned.error > 0 && (
                <>
                    <h2 className="mb-3 text-lg font-semibold">
                        Filas con errores
                    </h2>
                    <Card bodyClass="p-0">
                        <ImportErrorsTable importId={job.id} />
                    </Card>
                </>
            )}

            <ConfirmDialog
                isOpen={confirming}
                title="Confirmar importación"
                type="info"
                confirmText="Importar"
                onCancel={() => setConfirming(false)}
                onClose={() => setConfirming(false)}
                onConfirm={onConfirm}
            >
                <p>
                    Se crearán {rows(job.planned.create)} y se actualizarán{' '}
                    {rows(job.planned.update)}, a tu nombre y con su registro en
                    la bitácora. Las filas sin cambios o saltadas no se tocan.
                </p>
            </ConfirmDialog>
        </>
    )
}

export default ImportDetailPage
