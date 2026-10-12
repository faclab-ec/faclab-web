import { useState } from 'react'
import Button from '@/components/ui/Button'
import Table from '@/components/ui/Table'
import { HiOutlinePlus, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi'
import { notifySuccess, notifyError } from '@shared/ui/notify'
import {
    useSupplierContacts,
    useSupplierContactMutations,
} from '../hooks/useSupplierContacts'
import ContactForm from './ContactForm'
import DeleteConfirmDialog from './DeleteConfirmDialog'
import type { SupplierContact } from '../model/types'
import EmptyState from '@/components/shared/EmptyState'

const { Tr, Th, Td, THead, TBody } = Table

interface SupplierContactsTabProps {
    supplierId: number
}

const SupplierContactsTab = ({ supplierId }: SupplierContactsTabProps) => {
    const { data: contacts = [], isLoading } = useSupplierContacts(supplierId)
    const { delete: deleteContact } = useSupplierContactMutations(supplierId)

    const [formOpen, setFormOpen] = useState(false)
    const [selected, setSelected] = useState<SupplierContact | null>(null)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [toDelete, setToDelete] = useState<SupplierContact | null>(null)

    const handleCreate = () => {
        setSelected(null)
        setFormOpen(true)
    }

    const handleEdit = (contact: SupplierContact) => {
        setSelected(contact)
        setFormOpen(true)
    }

    const handleCloseForm = () => {
        setFormOpen(false)
        setSelected(null)
    }

    const handleDeleteConfirm = async () => {
        if (!toDelete) return
        try {
            await deleteContact.mutateAsync(toDelete.id)
            notifySuccess(
                'Contacto eliminado',
                'El contacto se eliminó correctamente'
            )
            setDeleteOpen(false)
            setToDelete(null)
        } catch (error: unknown) {
            notifyError(error, 'Error al eliminar el contacto')
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div>Cargando contactos...</div>
            </div>
        )
    }

    return (
        <div className="mt-4">
            <div className="flex items-center justify-end mb-4">
                <Button
                    size="sm"
                    variant="solid"
                    icon={<HiOutlinePlus />}
                    onClick={handleCreate}
                >
                    Nuevo Contacto
                </Button>
            </div>

            {contacts.length === 0 ? (
                <EmptyState
                    className="!py-8"
                    title="No hay contactos registrados para este proveedor"
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
                                            onClick={() => handleEdit(contact)}
                                        />
                                        <Button
                                            size="sm"
                                            variant="plain"
                                            aria-label="Eliminar"
                                            icon={<HiOutlineTrash />}
                                            onClick={() => {
                                                setToDelete(contact)
                                                setDeleteOpen(true)
                                            }}
                                        />
                                    </div>
                                </Td>
                            </Tr>
                        ))}
                    </TBody>
                </Table>
            )}

            <ContactForm
                open={formOpen}
                supplierId={supplierId}
                contact={selected}
                onClose={handleCloseForm}
            />

            <DeleteConfirmDialog
                isOpen={deleteOpen}
                title="Confirmar eliminación"
                message={`¿Está seguro que desea eliminar el contacto ${toDelete?.name}? Esta acción no se puede deshacer.`}
                isPending={deleteContact.isPending}
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeleteOpen(false)}
            />
        </div>
    )
}

export default SupplierContactsTab
