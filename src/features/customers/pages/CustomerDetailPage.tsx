import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ActiveBadge } from '@/components/shared/StatusBadge'
import Table from '@/components/ui/Table'
import Dialog from '@/components/ui/Dialog'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import {
    HiOutlineArrowLeft,
    HiOutlinePlus,
    HiOutlinePencil,
    HiOutlineTrash,
} from 'react-icons/hi'
import { useCustomer } from '../hooks/useCustomers'
import {
    useCustomerContactsList,
    useCustomerContactMutations,
} from '../hooks/useCustomerContacts'
import { ContactForm } from '../components/ContactForm'
import type { CustomerContact } from '../model/types'
import { TAX_TYPE_LABELS } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'
import { formatCurrency } from '@shared/lib/format'
import PageHeader from '@/components/shared/PageHeader'

const { Tr, Th, Td, THead, TBody } = Table

const CustomerDetailPage = () => {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const customerId = parseInt(id || '0')

    const { data: customer, isLoading: customerLoading } =
        useCustomer(customerId)
    const { data: contacts = [], isLoading: contactsLoading } =
        useCustomerContactsList(customerId)
    const { delete: deleteContact } = useCustomerContactMutations(customerId)

    const [contactFormOpen, setContactFormOpen] = useState(false)
    const [selectedContact, setSelectedContact] =
        useState<CustomerContact | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [contactToDelete, setContactToDelete] =
        useState<CustomerContact | null>(null)

    const handleCreateContact = () => {
        setSelectedContact(null)
        setContactFormOpen(true)
    }

    const handleEditContact = (contact: CustomerContact) => {
        setSelectedContact(contact)
        setContactFormOpen(true)
    }

    const handleCloseContactForm = () => {
        setContactFormOpen(false)
        setSelectedContact(null)
    }

    const handleDeleteClick = (contact: CustomerContact) => {
        setContactToDelete(contact)
        setDeleteDialogOpen(true)
    }

    const handleDeleteConfirm = async () => {
        if (!contactToDelete) return

        try {
            await deleteContact.mutateAsync(contactToDelete.id)
            notifySuccess(
                'Contacto eliminado',
                'El contacto se eliminó correctamente'
            )
            setDeleteDialogOpen(false)
            setContactToDelete(null)
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el contacto')
        }
    }

    if (customerLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <div>Cargando...</div>
            </div>
        )
    }

    if (!customer) {
        return (
            <EmptyState
                className="min-h-[24rem]"
                title="Cliente no encontrado"
                action={
                    <Button
                        size="sm"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate('/customers')}
                    >
                        Volver a Clientes
                    </Button>
                }
            />
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <PageHeader
                className="!mb-1"
                title={customer.name}
                badge={
                    <>
                        <ActiveBadge active={customer.isActive} />
                    </>
                }
                onBack={() => navigate('/customers')}
            />

            <Card>
                <h5 className="mb-4">Información del Cliente</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Identificación</p>
                        <p className="font-medium">{customer.taxId}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">
                            Tipo de identificación
                        </p>
                        <p className="font-medium">
                            {TAX_TYPE_LABELS[customer.taxType]}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{customer.email || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Teléfono</p>
                        <p className="font-medium">{customer.phone || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Ciudad</p>
                        <p className="font-medium">{customer.city || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">
                            Provincia/Estado
                        </p>
                        <p className="font-medium">{customer.state || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">País</p>
                        <p className="font-medium">{customer.country || '-'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">
                            Límite de Crédito
                        </p>
                        <p className="font-medium">
                            {customer.creditLimit
                                ? formatCurrency(customer.creditLimit)
                                : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">
                            Términos de Pago
                        </p>
                        <p className="font-medium">
                            {customer.paymentTerms
                                ? `${customer.paymentTerms} días`
                                : '-'}
                        </p>
                    </div>
                </div>
                {customer.address && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">Dirección</p>
                        <p className="font-medium">{customer.address}</p>
                    </div>
                )}
            </Card>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h5>Contactos ({contacts.length})</h5>
                    <Button
                        size="sm"
                        variant="solid"
                        icon={<HiOutlinePlus />}
                        onClick={handleCreateContact}
                    >
                        Nuevo Contacto
                    </Button>
                </div>

                {contactsLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <div>Cargando contactos...</div>
                    </div>
                ) : contacts.length === 0 ? (
                    <EmptyState
                        className="!py-8"
                        title="No hay contactos registrados para este cliente"
                    />
                ) : (
                    <Table>
                        <THead>
                            <Tr>
                                <Th>Nombre</Th>
                                <Th>Cargo</Th>
                                <Th>Email</Th>
                                <Th>Teléfono</Th>
                                <Th>Acciones</Th>
                            </Tr>
                        </THead>
                        <TBody>
                            {contacts.map((contact) => (
                                <Tr key={contact.id}>
                                    <Td>{contact.name}</Td>
                                    <Td>{contact.role || '-'}</Td>
                                    <Td>{contact.email || '-'}</Td>
                                    <Td>{contact.phone || '-'}</Td>
                                    <Td>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                aria-label="Editar"
                                                icon={<HiOutlinePencil />}
                                                onClick={() =>
                                                    handleEditContact(contact)
                                                }
                                            />
                                            <Button
                                                size="sm"
                                                variant="plain"
                                                aria-label="Eliminar"
                                                icon={<HiOutlineTrash />}
                                                onClick={() =>
                                                    handleDeleteClick(contact)
                                                }
                                            />
                                        </div>
                                    </Td>
                                </Tr>
                            ))}
                        </TBody>
                    </Table>
                )}
            </Card>

            <ContactForm
                open={contactFormOpen}
                customerId={customerId}
                contact={selectedContact}
                onClose={handleCloseContactForm}
            />

            <Dialog
                isOpen={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
            >
                <h5 className="mb-4">Confirmar eliminación</h5>
                <p className="mb-6">
                    ¿Está seguro que desea eliminar el contacto{' '}
                    <strong>{contactToDelete?.name}</strong>? Esta acción no se
                    puede deshacer.
                </p>
                <div className="flex justify-end gap-2">
                    <Button
                        variant="plain"
                        onClick={() => setDeleteDialogOpen(false)}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="solid"
                        loading={deleteContact.isPending}
                        onClick={handleDeleteConfirm}
                    >
                        Eliminar
                    </Button>
                </div>
            </Dialog>
        </div>
    )
}

export default CustomerDetailPage
