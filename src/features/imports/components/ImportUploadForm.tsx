import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { HiOutlineDownload, HiOutlineUpload } from 'react-icons/hi'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import LabeledField from '@/components/shared/LabeledField'
import ErrorState from '@/components/shared/ErrorState'
import { notifyWarning } from '@shared/ui/notify'
import TemplateColumns from './TemplateColumns'
import { useImportDownloads, useImportTemplates } from '../hooks/useImports'
import {
    IMPORT_ACCEPT,
    IMPORT_KINDS,
    IMPORT_KIND_LABELS,
    IMPORT_MODES,
    IMPORT_MODE_HINTS,
    IMPORT_MODE_LABELS,
    fileProblem,
    type ImportKind,
    type ImportMode,
    type ImportUpload,
} from '../model/types'

const kindOptions = IMPORT_KINDS.map((value) => ({
    value,
    label: IMPORT_KIND_LABELS[value],
}))
const modeOptions = IMPORT_MODES.map((value) => ({
    value,
    label: IMPORT_MODE_LABELS[value],
}))

interface ImportUploadFormProps {
    uploading: boolean
    onSubmit: (upload: ImportUpload) => void
}

/**
 * Qué se importa y cómo: la plantilla (con sus columnas y descargas), el modo
 * y el archivo. Subirlo solo lo valida.
 */
const ImportUploadForm = ({ uploading, onSubmit }: ImportUploadFormProps) => {
    const [kind, setKind] = useState<ImportKind>('PRODUCTS')
    const [mode, setMode] = useState<ImportMode>('SKIP')
    const [file, setFile] = useState<File | null>(null)
    const input = useRef<HTMLInputElement>(null)
    const templates = useImportTemplates()
    const downloads = useImportDownloads()
    const template = templates.data?.find((t) => t.kind === kind)

    const onFile = (event: ChangeEvent<HTMLInputElement>) => {
        const chosen = event.target.files?.[0] ?? null
        if (chosen) {
            const problem = fileProblem(chosen)
            if (problem) {
                notifyWarning('Archivo no admitido', problem)
                event.target.value = ''
                setFile(null)
                return
            }
        }
        setFile(chosen)
    }

    const submit = (event: FormEvent) => {
        event.preventDefault()
        if (file) onSubmit({ kind, mode, file })
    }

    return (
        <form className="flex flex-col gap-5" onSubmit={submit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <LabeledField label="Qué vas a importar">
                    <Select
                        options={kindOptions}
                        value={kindOptions.find((o) => o.value === kind)}
                        onChange={(option) =>
                            setKind(option?.value ?? 'PRODUCTS')
                        }
                    />
                </LabeledField>
                <LabeledField label="Si el registro ya existe">
                    <Select
                        options={modeOptions}
                        value={modeOptions.find((o) => o.value === mode)}
                        onChange={(option) => setMode(option?.value ?? 'SKIP')}
                    />
                </LabeledField>
            </div>
            <p className="-mt-3 text-sm text-gray-500">
                {IMPORT_MODE_HINTS[mode]}
            </p>

            <section>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-base font-semibold">
                        Plantilla de {IMPORT_KIND_LABELS[kind].toLowerCase()}
                    </h2>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            size="sm"
                            icon={<HiOutlineDownload />}
                            loading={downloads.isBusy(`template:${kind}:xlsx`)}
                            onClick={() => downloads.template(kind, 'xlsx')}
                        >
                            Plantilla Excel
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="plain"
                            icon={<HiOutlineDownload />}
                            loading={downloads.isBusy(`template:${kind}:csv`)}
                            onClick={() => downloads.template(kind, 'csv')}
                        >
                            Plantilla CSV
                        </Button>
                    </div>
                </div>
                {templates.isLoading ? (
                    <div className="flex justify-center py-8">
                        <Spinner size={32} />
                    </div>
                ) : templates.error ? (
                    <ErrorState onRetry={templates.refetch} />
                ) : (
                    template && <TemplateColumns columns={template.columns} />
                )}
            </section>

            <div className="flex flex-wrap items-center gap-3">
                <input
                    ref={input}
                    accept={IMPORT_ACCEPT}
                    aria-label="Archivo a importar"
                    className="hidden"
                    type="file"
                    onChange={onFile}
                />
                <Button
                    type="button"
                    icon={<HiOutlineUpload />}
                    onClick={() => input.current?.click()}
                >
                    Elegir archivo
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                    {file ? file.name : 'CSV o Excel (.xlsx), hasta 10 MB'}
                </span>
                <Button
                    className="sm:ml-auto"
                    disabled={!file}
                    loading={uploading}
                    type="submit"
                    variant="solid"
                >
                    Validar archivo
                </Button>
            </div>
        </form>
    )
}

export default ImportUploadForm
