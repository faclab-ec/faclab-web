import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Table from '@/components/ui/Table'
import Dialog from '@/components/ui/Dialog'
import Notification from '@/components/ui/Notification'
import toast from '@/components/ui/toast'
import { getErrorMessage } from '@shared/lib/getErrorMessage'
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
            toast.push(
                <Notification title="Contacto eliminado" type="success">
                    El contacto se eliminó correctamente
                </Notification>,
                { placement: 'top-end' }
            )
            setDeleteDialogOpen(false)
            setContactToDelete(null)
        } catch (error: unknown) {
            toast.push(
                <Notification title="Error" type="danger">
                    {getErrorMessage(error, 'Error al eliminar el contacto')}
                </Notification>,
                { placement: 'top-end' }
            )
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
            <div className="flex flex-col items-center justify-center h-96">
                <h4 className="mb-4">Cliente no encontrado</h4>
                <Button
                    variant="solid"
                    icon={<HiOutlineArrowLeft />}
                    onClick={() => navigate('/customers')}
                >
                    Volver a Clientes
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="plain"
                        icon={<HiOutlineArrowLeft />}
                        onClick={() => navigate('/customers')}
                    />
                    <h3>{customer.name}</h3>
                    <Badge
                        content={customer.isActive ? 'Activo' : 'Inactivo'}
                        className={
                            customer.isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-300'
                        }
                    />
                </div>
            </div>

            <Card>
                <h5 className="mb-4">Información del Cliente</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <p className="text-sm text-gray-500">Tax ID</p>
                        <p className="font-medium">{customer.taxId}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Tipo de ID</p>
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
                                ? `$${customer.creditLimit.toFixed(2)}`
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
                    <div className="text-center py-8 text-gray-500">
                        No hay contactos registrados para este cliente
                    </div>
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
                                                icon={<HiOutlinePencil />}
                                                onClick={() =>
                                                    handleEditContact(contact)
                                                }
                                            />
                                            <Button
                                                size="sm"
                                                variant="plain"
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
