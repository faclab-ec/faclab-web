import { Server, Response } from 'miragejs'

const ROLE_PERMISSIONS: Record<number, string[]> = {
    1: [
        'product:read',
        'product:write',
        'category:write',
        'uom:write',
        'stock:read',
        'movement:write',
        'warehouse:write',
        'location:write',
        'lot:write',
        'serial:write',
        'adjustment:write',
        'transfer:write',
        'alert:read',
        'sale:read',
        'sale:write',
        'sale:cancel',
        'purchase:read',
        'purchase:write',
        'purchase:confirm',
        'purchase:receive',
        'customer:read',
        'customer:write',
        'supplier:read',
        'supplier:write',
        'pos:operate',
        'refund:approve',
        'report:inventory:read',
        'report:pos:read',
        'user:manage',
        'audit:read',
    ],
    2: [
        'product:read',
        'product:write',
        'category:write',
        'uom:write',
        'stock:read',
        'movement:write',
        'warehouse:write',
        'location:write',
        'lot:write',
        'serial:write',
        'adjustment:write',
        'transfer:write',
        'alert:read',
        'sale:read',
        'sale:write',
        'sale:cancel',
        'purchase:read',
        'purchase:write',
        'purchase:confirm',
        'purchase:receive',
        'customer:read',
        'customer:write',
        'supplier:read',
        'supplier:write',
        'refund:approve',
        'report:inventory:read',
        'report:pos:read',
    ],
    3: [
        'product:read',
        'product:write',
        'category:write',
        'uom:write',
        'stock:read',
        'movement:write',
        'lot:write',
        'serial:write',
        'adjustment:write',
        'transfer:write',
        'alert:read',
        'sale:read',
        'sale:write',
        'purchase:read',
        'purchase:write',
        'purchase:receive',
        'customer:read',
        'customer:write',
        'supplier:read',
        'supplier:write',
        'report:inventory:read',
    ],
    4: [
        'product:read',
        'stock:read',
        'alert:read',
        'sale:read',
        'purchase:read',
        'customer:read',
        'supplier:read',
        'report:inventory:read',
    ],
    5: [
        'product:read',
        'stock:read',
        'sale:read',
        'sale:write',
        'customer:read',
        'customer:write',
        'pos:operate',
        'report:pos:read',
    ],
}

const uuid = () => Math.random().toString(36).slice(2)
const meta = () => ({ requestId: uuid(), timestamp: new Date().toISOString() })
const ok = (data: unknown) => ({ data, meta: meta() })
const err = (status: number, code: string, message: string, field?: string) =>
    new Response(
        status,
        {},
        { errors: [{ code, message, field: field ?? null }], meta: meta() }
    )
const accessFor = (id: number) => `mock-access-${id}`
// Una sola empresa con su matriz: el mock no simula la elección de empresa
const MOCK_TENANT = {
    id: '00000000-0000-4000-8000-000000000001',
    ruc: '0190000000001',
    legalName: 'Empresa de demostración',
    tradeName: null,
}
const MOCK_BRANCHES = [
    { id: 1, establishmentCode: '001', name: 'Matriz', isMain: true },
]
const buildTokens = (id: number) => ({
    accessToken: accessFor(id),
    tokenType: 'Bearer',
    expiresIn: 900,
    tenant: MOCK_TENANT,
})

// Mirage no puede escribir cookies HttpOnly: el usuario de la "cookie" de
// refresh vive aquí mientras dure la página
let refreshUserId: number | null = null

function userIdFromAccessToken(authHeader: string | null): number | null {
    if (!authHeader) return null
    const token = authHeader.replace('Bearer ', '')
    if (!token.startsWith('mock-access-')) return null
    const id = Number(token.replace('mock-access-', ''))
    return Number.isFinite(id) ? id : null
}

export default function authFakeApi(server: Server) {
    server.post('/api/auth/login', (schema, { requestBody }) => {
        const { username, password } = JSON.parse(requestBody)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (schema.db as any).usersData.findBy({ username, password })
        if (!user)
            return err(
                400,
                'INVALID_CREDENTIALS',
                'Usuario o contraseña inválidos'
            )
        if (!user.isActive)
            return err(
                400,
                'INVALID_CREDENTIALS',
                'Usuario o contraseña inválidos'
            )
        refreshUserId = user.id
        return ok(buildTokens(user.id))
    })

    server.post('/api/auth/logout', () => {
        refreshUserId = null
        return new Response(204, {}, '')
    })

    server.post('/api/auth/refresh', (schema) => {
        const id = refreshUserId
        if (id === null) return err(401, 'INVALID_TOKEN', 'Token inválido')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (schema.db as any).usersData.find(id)
        if (!user)
            return err(
                400,
                'INVALID_CREDENTIALS',
                'Usuario inactivo o eliminado'
            )
        if (!user.isActive)
            return err(
                400,
                'INVALID_CREDENTIALS',
                'Usuario inactivo o eliminado'
            )
        return ok(buildTokens(user.id))
    })

    server.get('/api/auth/me', (schema, request) => {
        const id = userIdFromAccessToken(
            request.requestHeaders['Authorization'] ?? null
        )
        if (id === null)
            return err(400, 'PERMISSION_DENIED', 'Sin autorización')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (schema.db as any).usersData.find(id)
        if (!user) return err(400, 'INVALID_TOKEN', 'Token inválido')
        return ok({
            id: user.id,
            username: user.username,
            fullName: user.fullName ?? null,
            role: user.role,
            permissions: ROLE_PERMISSIONS[user.role] ?? [],
            mustChangePassword: user.mustChangePassword,
            tenant: MOCK_TENANT,
            tenants: [{ ...MOCK_TENANT, role: user.role }],
            branches: MOCK_BRANCHES,
        })
    })

    server.post('/api/auth/change-password', (schema, request) => {
        const id = userIdFromAccessToken(
            request.requestHeaders['Authorization'] ?? null
        )
        if (id === null)
            return err(400, 'PERMISSION_DENIED', 'Sin autorización')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = (schema.db as any).usersData.find(id)
        if (!user) return err(400, 'INVALID_TOKEN', 'Token inválido')
        const { currentPassword, newPassword } = JSON.parse(request.requestBody)
        if (user.password !== currentPassword) {
            return err(
                400,
                'INVALID_CREDENTIALS',
                'Contraseña actual incorrecta'
            )
        }
        if (!newPassword || newPassword.length < 8) {
            return err(
                422,
                'VALIDATION_ERROR',
                'La nueva contraseña debe tener al menos 8 caracteres',
                'newPassword'
            )
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(schema.db as any).usersData.update(id, {
            password: newPassword,
            mustChangePassword: false,
        })
        return new Response(204, {}, '')
    })
}
