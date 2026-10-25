import { useState, useRef } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import type { Certificate } from '../model/types'
import { INVOICING_ERROR_MESSAGES } from '../model/errors'
import {
    certificateUploadSchema,
    type CertificateUploadFormValues,
} from '../model/schemas'
import { useUploadCertificate, useDeleteCertificate } from './useInvoicing'

interface DeleteDialogState {
    open: boolean
    cert: Certificate | null
}

export function useCertificateActions() {
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false)
    const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
        open: false,
        cert: null,
    })
    const fileInputRef = useRef<HTMLInputElement>(null)

    const uploadCertificate = useUploadCertificate()
    const deleteCertificate = useDeleteCertificate()

    const form = useForm<CertificateUploadFormValues>({
        resolver: zodResolver(certificateUploadSchema),
        defaultValues: { password: '' },
    })
    const {
        reset,
        control,
        formState: { isSubmitting },
    } = form

    const watchedFile = useWatch({ control, name: 'file' })

    const openUpload = () => setIsUploadDialogOpen(true)

    const closeUploadForm = () => {
        setIsUploadDialogOpen(false)
        reset()
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const handleUploadClose = () => {
        if (isSubmitting) return
        closeUploadForm()
    }

    const onUploadSubmit = async (values: CertificateUploadFormValues) => {
        try {
            await uploadCertificate.mutateAsync(values)
            notifySuccess(
                'Certificado subido',
                'El certificado se subió correctamente'
            )
            closeUploadForm()
        } catch (error: unknown) {
            notifyError(error, 'Error al subir el certificado', {
                messages: INVOICING_ERROR_MESSAGES,
            })
        }
    }

    const openDelete = (cert: Certificate) =>
        setDeleteDialog({ open: true, cert })
    const closeDelete = () => setDeleteDialog({ open: false, cert: null })

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.cert) return
        try {
            await deleteCertificate.mutateAsync(deleteDialog.cert.id)
            notifySuccess(
                'Certificado eliminado',
                'El certificado se eliminó correctamente'
            )
            closeDelete()
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el certificado', {
                messages: INVOICING_ERROR_MESSAGES,
            })
        }
    }

    return {
        form,
        fileInputRef,
        watchedFile,
        isUploadDialogOpen,
        openUpload,
        handleUploadClose,
        onUploadSubmit,
        deleteDialog,
        openDelete,
        closeDelete,
        handleDeleteConfirm,
        deleteCertificate,
    }
}
