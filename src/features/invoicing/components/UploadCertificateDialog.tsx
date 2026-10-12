import { type RefObject } from 'react'
import type { SubmitHandler, UseFormReturn } from 'react-hook-form'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Input from '@/components/ui/Input'
import { FormItem } from '@/components/ui/Form'
import type { CertificateUploadFormValues } from '../model/schemas'

interface UploadCertificateDialogProps {
    isOpen: boolean
    form: UseFormReturn<CertificateUploadFormValues>
    fileInputRef: RefObject<HTMLInputElement | null>
    watchedFile: File | undefined
    onClose: () => void
    onSubmit: SubmitHandler<CertificateUploadFormValues>
}

const UploadCertificateDialog = ({
    isOpen,
    form,
    fileInputRef,
    watchedFile,
    onClose,
    onSubmit,
}: UploadCertificateDialogProps) => {
    const {
        register,
        setValue,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = form

    return (
        <Dialog
            isOpen={isOpen}
            shouldCloseOnEsc={!isSubmitting}
            shouldCloseOnOverlayClick={!isSubmitting}
            onClose={onClose}
            onRequestClose={onClose}
        >
            <div className="flex flex-col h-full justify-between">
                <h5 className="mb-4">Subir Certificado Digital</h5>
                <form
                    className="flex-1"
                    onSubmit={(e) => {
                        void handleSubmit(onSubmit)(e)
                    }}
                >
                    <div className="space-y-4">
                        <FormItem
                            asterisk
                            label="Archivo .p12"
                            invalid={!!errors.file}
                            errorMessage={errors.file?.message}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".p12"
                                disabled={isSubmitting}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    setValue('file', file as File, {
                                        shouldValidate: true,
                                    })
                                }}
                            />
                            {watchedFile && (
                                <span className="text-xs text-gray-500 mt-1 block">
                                    {watchedFile.name}
                                </span>
                            )}
                        </FormItem>
                        <FormItem
                            asterisk
                            label="Contraseña"
                            invalid={!!errors.password}
                            errorMessage={errors.password?.message}
                        >
                            <Input
                                type="password"
                                placeholder="Contraseña del certificado"
                                disabled={isSubmitting}
                                invalid={!!errors.password}
                                {...register('password')}
                            />
                        </FormItem>
                    </div>
                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            type="button"
                            variant="plain"
                            disabled={isSubmitting}
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            variant="solid"
                            loading={isSubmitting}
                            disabled={!watchedFile}
                        >
                            Subir
                        </Button>
                    </div>
                </form>
            </div>
        </Dialog>
    )
}

export default UploadCertificateDialog
