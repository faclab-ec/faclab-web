import { Server, Response } from 'miragejs'
import { singleQueryParams } from './queryParams'

const uuid = () => Math.random().toString(36).slice(2)
const meta = () => ({ requestId: uuid(), timestamp: new Date().toISOString() })
const ok = (data: unknown) => ({ data, meta: meta() })
const err = (status: number, code: string, message: string, field?: string) =>
    new Response(
        status,
        {},
        { errors: [{ code, message, field: field ?? null }], meta: meta() }
    )

function userToResponse(user: Record<string, unknown>) {
    const { password: _pw, ...rest } = user
    return rest
}

export default function adminUsersFakeApi(server: Server) {
    server.get('/api/admin/users', (schema, request) => {
        const {
            isActive,
            role,
            limit = '100',
            offset = '0',
        } = singleQueryParams(request)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let users: Record<string, unknown>[] = (schema.db as any).usersData.map(
            (u: Record<string, unknown>) => u
        )

        if (isActive !== undefined) {
            const active = isActive === 'true'
            users = users.filter((u) => u.isActive === active)
        }
        if (role !== undefined) {
            const roleNum = Number(role)
            users = users.filter((u) => u.role === roleNum)
        }

        const total = users.length
        const limitNum = parseInt(limit)
        const offsetNum = parseInt(offset)
        const page = users
            .slice(offsetNum, offsetNum + limitNum)
            .map(userToResponse)

        return {
            data: page,
            meta: {
                ...meta(),
                pagination: { total, limit: limitNum, offset: offsetNum },
            },
        }
    })

    server.get('/api/admin/users/:id', (schema, request) => {
        const id = Number(request.params.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (schema.db as any).usersData.find(id)
        if (!user) return err(404, 'NOT_FOUND', 'Usuario no encontrado')
        return ok(userToResponse(user))
    })

    server.post('/api/admin/users', (schema, { requestBody }) => {
        const { username, email, password, role = 4 } = JSON.parse(requestBody)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (schema.db as any).usersData
        if (db.findBy({ username })) {
            return err(
                400,
                'USERNAME_ALREADY_EXISTS',
                'El nombre de usuario ya existe',
                'username'
            )
        }
        if (db.findBy({ email })) {
            return err(
                400,
                'EMAIL_ALREADY_EXISTS',
                'El correo ya está registrado',
                'email'
            )
        }
        const newUser = db.insert({
            id: Date.now(),
            username,
            email,
            password,
            role: Number(role),
            isActive: true,
            mustChangePassword: true,
            lastLoginAt: null,
            createdAt: new Date().toISOString(),
        })
        return ok(userToResponse(newUser))
    })

    server.put('/api/admin/users/:id/role', (schema, request) => {
        const id = Number(request.params.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (schema.db as any).usersData
        if (!db.find(id)) return err(404, 'NOT_FOUND', 'Usuario no encontrado')
        const { role } = JSON.parse(request.requestBody)
        const updated = db.update(id, { role: Number(role) })
        return ok(userToResponse(updated))
    })

    server.post('/api/admin/users/:id/activate', (schema, request) => {
        const id = Number(request.params.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (schema.db as any).usersData
        if (!db.find(id)) return err(404, 'NOT_FOUND', 'Usuario no encontrado')
        const updated = db.update(id, { isActive: true })
        return ok(userToResponse(updated))
    })

    server.post('/api/admin/users/:id/deactivate', (schema, request) => {
        const id = Number(request.params.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (schema.db as any).usersData
        if (!db.find(id)) return err(404, 'NOT_FOUND', 'Usuario no encontrado')
        const updated = db.update(id, { isActive: false })
        return ok(userToResponse(updated))
    })

    server.post('/api/admin/users/:id/reset-password', (schema, request) => {
        const id = Number(request.params.id)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = (schema.db as any).usersData
        if (!db.find(id)) return err(404, 'NOT_FOUND', 'Usuario no encontrado')
        const { newPassword } = JSON.parse(request.requestBody)
        if (!newPassword || newPassword.length < 8) {
            return err(
                422,
                'VALIDATION_ERROR',
                'La contraseña debe tener al menos 8 caracteres',
                'newPassword'
            )
        }
        const updated = db.update(id, {
            password: newPassword,
            mustChangePassword: true,
        })
        return ok(userToResponse(updated))
    })
}
