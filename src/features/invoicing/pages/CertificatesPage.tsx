import Card from '@/components/ui/Card'
import PageHeader from '@/components/shared/PageHeader'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import { HiOutlineUpload } from 'react-icons/hi'
import { useNavigate } from 'react-router-dom'
import Alert from '@/components/ui/Alert'
import { isApiError } from '@/utils/errors/ApiError'
import { useCertificates, useCompanyConfig } from '../hooks/useInvoicing'
import { useCertificateActions } from '../hooks/useCertificateActions'
import CertificatesTable from '../components/CertificatesTable'
import UploadCertificateDialog from '../components/UploadCertificateDialog'

const CertificatesPage = () => {
    const navigate = useNavigate()
    const { data: certificates = [], isLoading } = useCertificates()
    const { data: config, error: configError } = useCompanyConfig()
    const actions = useCertificateActions()
    // El certificado se valida contra el RUC del perfil: sin perfil no se sube
    const withoutProfile = isApiError(configError) && configError.status === 404

    return (
        <>
            <PageHeader
                title="Certificados Digitales"
                description="Gestiona los certificados .p12 para firma de facturas electrónicas"
                actions={
                    <Button
                        variant="solid"
                        size="sm"
                        icon={<HiOutlineUpload />}
                        disabled={withoutProfile}
                        onClick={actions.openUpload}
                    >
                        Subir Certificado
                    </Button>
                }
            />
            {withoutProfile && (
                <Alert showIcon className="mb-4" type="warning">
                    <div className="flex flex-wrap items-center gap-3">
                        <span>
                            Primero guarda el perfil fiscal de la empresa: cada
                            certificado se valida contra su RUC.
                        </span>
                        <Button
                            size="xs"
                            onClick={() => navigate('/settings/company-config')}
                        >
                            Perfil fiscal
                        </Button>
                    </div>
                </Alert>
            )}
            <Card>
                <CertificatesTable
                    certificates={certificates}
                    activeCertificateId={config?.signingCertId ?? null}
                    isLoading={isLoading}
                    onDelete={actions.openDelete}
                />
                <p className="text-xs text-gray-500 mt-3">
                    Después de subir un certificado, selecciónalo en el Perfil
                    fiscal. Solo sirven los del RUC de la empresa, y el
                    certificado en uso no se puede eliminar.
                </p>
            </Card>

            <UploadCertificateDialog
                isOpen={actions.isUploadDialogOpen}
                form={actions.form}
                fileInputRef={actions.fileInputRef}
                watchedFile={actions.watchedFile}
                onClose={actions.handleUploadClose}
                onSubmit={actions.onUploadSubmit}
            />

            <Dialog
                isOpen={actions.deleteDialog.open}
                onClose={actions.closeDelete}
                onRequestClose={actions.closeDelete}
            >
                <h5 className="mb-4">Confirmar Eliminación</h5>
                <p className="mb-6">
                    ¿Estás seguro de que deseas eliminar el certificado{' '}
                    <strong>{actions.deleteDialog.cert?.fileName}</strong>? Esta
                    acción no se puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        disabled={actions.deleteCertificate.isPending}
                        onClick={actions.closeDelete}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        loading={actions.deleteCertificate.isPending}
                        onClick={actions.handleDeleteConfirm}
                    >
                        Eliminar
                    </Button>
                </div>
            </Dialog>
        </>
    )
}

export default CertificatesPage
