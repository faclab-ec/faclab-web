import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import Button from '@/components/ui/Button'
import ConfirmDialog from '@/components/shared/ConfirmDialog'
import { notifyError, notifySuccess, notifyWarning } from '@shared/ui/notify'
import {
    useDeleteIssuerLogo,
    useIssuerLogo,
    useUploadIssuerLogo,
} from '../hooks/useInvoicing'
import { INVOICING_ERROR_MESSAGES } from '../model/errors'

// Lo que acepta faclab-invoicing; el tamaño en píxeles lo revisa al recibirlo
const LOGO_TYPES = ['image/png', 'image/jpeg']
const LOGO_MAX_BYTES = 300 * 1024

interface IssuerLogoSectionProps {
    hasLogo: boolean
}

/** El logo de los RIDE de la empresa: se sube, se ve y se quita aparte del perfil */
const IssuerLogoSection = ({ hasLogo }: IssuerLogoSectionProps) => {
    const logo = useIssuerLogo(hasLogo)
    const upload = useUploadIssuerLogo()
    const remove = useDeleteIssuerLogo()
    const [confirming, setConfirming] = useState(false)
    const input = useRef<HTMLInputElement>(null)

    const previewUrl = useMemo(
        () => (hasLogo && logo.data ? URL.createObjectURL(logo.data) : null),
        [hasLogo, logo.data]
    )
    useEffect(
        () => () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        },
        [previewUrl]
    )

    const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        // El mismo archivo se puede volver a elegir
        event.target.value = ''
        if (!file) return
        if (!LOGO_TYPES.includes(file.type)) {
            notifyWarning('Formato no admitido', 'Sube una imagen PNG o JPEG.')
            return
        }
        if (file.size > LOGO_MAX_BYTES) {
            notifyWarning('Logo muy pesado', 'El logo debe pesar hasta 300 KB.')
            return
        }
        try {
            await upload.mutateAsync(file)
            notifySuccess(
                'Logo guardado',
                'Los RIDE que se generen desde ahora lo llevarán'
            )
        } catch (error) {
            notifyError(error, 'No se pudo guardar el logo', {
                messages: INVOICING_ERROR_MESSAGES,
            })
        }
    }

    const onRemove = async () => {
        setConfirming(false)
        try {
            await remove.mutateAsync()
            notifySuccess('Logo quitado', 'Los próximos RIDE irán sin logo')
        } catch (error) {
            notifyError(error, 'No se pudo quitar el logo', {
                messages: INVOICING_ERROR_MESSAGES,
            })
        }
    }

    return (
        <section>
            <h5 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1 uppercase tracking-wide">
                Logo del RIDE
            </h5>
            <p className="text-sm text-gray-500 mb-4">
                Aparece en la representación impresa (PDF) de cada factura. PNG
                o JPEG, hasta 300 KB y 2000 × 2000 píxeles.
            </p>
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center justify-center w-48 h-20 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50">
                    {previewUrl ? (
                        <img
                            alt="Logo del RIDE"
                            className="max-w-full max-h-full object-contain"
                            src={previewUrl}
                        />
                    ) : (
                        <span className="text-xs text-gray-400">
                            {hasLogo && logo.isLoading
                                ? 'Cargando...'
                                : 'Sin logo'}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <input
                        ref={input}
                        accept={LOGO_TYPES.join(',')}
                        aria-label="Archivo del logo"
                        className="hidden"
                        type="file"
                        onChange={onFile}
                    />
                    <Button
                        loading={upload.isPending}
                        size="sm"
                        onClick={() => input.current?.click()}
                    >
                        {hasLogo ? 'Cambiar logo' : 'Subir logo'}
                    </Button>
                    {hasLogo && (
                        <Button
                            loading={remove.isPending}
                            size="sm"
                            variant="plain"
                            onClick={() => setConfirming(true)}
                        >
                            Quitar
                        </Button>
                    )}
                </div>
            </div>
            <ConfirmDialog
                isOpen={confirming}
                title="Quitar el logo"
                type="warning"
                confirmText="Quitar"
                onCancel={() => setConfirming(false)}
                onClose={() => setConfirming(false)}
                onConfirm={onRemove}
            >
                <p>
                    Los RIDE que se generen desde ahora irán sin logo. Los que
                    ya se generaron lo conservan.
                </p>
            </ConfirmDialog>
        </section>
    )
}

export default IssuerLogoSection
