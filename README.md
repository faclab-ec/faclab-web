# Faclab Web

Frontend administrativo de **Faclab**, un sistema de gestión comercial para pymes de Ecuador: catálogo, inventario, compras, ventas, punto de venta y facturación electrónica SRI.

## Módulos

| Área | Features (`src/features/`) |
|---|---|
| Catálogo | `products`, `categories`, `unitsOfMeasure` |
| Inventario | `warehouses`, `locations`, `stock`, `movements`, `lots`, `serialNumbers`, `adjustments`, `transfers`, `alerts` |
| Compras | `suppliers` (contactos y productos por proveedor), `purchases` (órdenes, envío, recepción) |
| Ventas | `customers`, `sales`, `pos` (turnos de caja, movimientos de efectivo, ventas en espera, pagos, devoluciones) |
| Facturación | `invoicing` (certificados `.p12`, configuración de la empresa: establecimiento, punto de emisión, secuencial, ambiente) |
| Análisis | `reports` (valoración, rotación, movimientos, resumen por bodega) |
| Administración | `auth` (login, cambio de contraseña), `admin-users` (usuarios y roles) |

### Backends

| Servicio | Host por defecto | Uso |
|---|---|---|
| `faclab-core` | `http://localhost:3000` (`/api/auth`, `/api/admin`, `/api/pos`) | Autenticación, usuarios, inventario, compras, ventas y POS |
| `faclab-invoicing` | `http://localhost:3173` | Certificados, configuración SRI y comprobantes electrónicos |

## Stack

- **React 19** con **React Compiler** (`babel-plugin-react-compiler`) y **TypeScript 5.9** en modo strict
- **Vite 4** como bundler y dev server
- **TanStack Query 5** para el estado del servidor y **Zustand 5** para el estado del cliente
- **React Router 6**
- **React Hook Form 7 + Zod 4** para formularios
- **Axios** como cliente HTTP (un solo `httpClient`)
- **Tailwind CSS 3** + `twin.macro`, sobre la plantilla **Elstar**: kit de UI propio, 5 layouts y modo oscuro
- TanStack Table, ApexCharts, FullCalendar, dayjs, i18next
- **MirageJS** para mocks de API (opcional)
- **Vitest** + Testing Library + jsdom
- **ESLint 9** (flat config) + **Prettier**

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- `faclab-core` corriendo en local (y `faclab-invoicing` para el módulo de facturación)

## Instalación

```bash
npm install
cp .env.example .env
npm start              # http://localhost:5173
```

### Configuración

`.env`:

```env
NODE_ENV=local
VITE_API_BASE_URL=http://localhost:3000        # faclab-core: /api/auth, /api/admin, /api/pos
VITE_INVOICING_API_URL=http://localhost:3173   # faclab-invoicing
```

`src/configs/app.config.ts` arma los hosts de cada API (`inventoryApiHost`, `posApiHost`, `invoicingApiHost`) a partir de estas variables. En ese archivo también está `enableMock` para activar MirageJS.

## Scripts

```bash
npm start               # Dev server
npm run build           # Build de producción (sale en /build)
npm run preview         # Sirve el build

npm test                # Vitest
npm run test:watch      # Vitest en modo watch
npm run test:coverage   # Cobertura (v8)
npm run check:contract  # Compara los enums del front con el OpenAPI de faclab-core

npm run lint            # ESLint
npm run lint:fix
npm run prettier        # Verifica formato
npm run prettier:fix
npm run format          # prettier:fix + lint:fix
```

`check:contract` lee `http://localhost:3000/openapi.json` (faclab-core con `DOCS_ENABLED=true`); para otra fuente usa `OPENAPI_URL=<url o ruta a un JSON> npm run check:contract`. Córrelo cuando cambie un enum en el backend o en el front.

## Arquitectura

El código está organizado en **feature modules verticales**: cada dominio es autocontenido y expone una sola superficie pública. Las decisiones y reglas completas están en [`docs/architecture.md`](docs/architecture.md).

```
src/
├── app/            # Bootstrap: AppViews (router), HomePage, routes
├── features/       # Módulos de dominio (ver tabla de módulos)
├── shared/         # Utilidades transversales, sin conocimiento de dominio
│   ├── hooks/      # useCrudOperations
│   ├── lib/
│   │   ├── http/   # httpClient
│   │   ├── auth/   # session, refreshManager, tokenStorage, navigationRef
│   │   ├── schemas/# primitivas Zod compartidas (optionalEmail, taxTypeSchema)
│   │   └── ...     # format, getErrorMessage, dateToIsoStartOfDay, react-query
│   └── ui/         # notify (toasts)
├── stores/         # Zustand global: auth, theme, locale, base
├── components/     # UI de la plantilla: ui/ (kit), layouts/, template/, route/, shared/
├── configs/        # app, routes, navigation, theme, zod
├── constants/      # permisos, roles, códigos de IVA, etc.
├── @types/         # tipos globales (api, auth, routes, ...)
├── utils/          # ApiError, hooks de la plantilla, helpers
├── mock/           # MirageJS: data/ + fakeApi/
├── locales/        # i18next
└── test/           # setup de Vitest
```

### Estructura de un feature

```
features/<nombre>/
├── api/client.ts     # Funciones puras que llaman a httpClient
├── model/            # types.ts + *.schema.ts (Zod + FormValues)
├── hooks/            # Hooks de React Query (+ __tests__/)
├── components/       # UI propia del feature
├── pages/            # Componentes de página (lazy)
├── lib/ · store/     # Opcionales: lógica propia o store Zustand (p. ej. pos)
├── routes.ts         # Rutas del feature con sus permisos
└── index.ts          # Barrel público: la ÚNICA entrada para otros features
```

**Reglas de frontera:**

1. Entre features solo se importa a través de `features/<x>/index.ts`, nunca rutas internas.
2. `shared/` nunca importa de `features/`.
3. `app/` orquesta; no contiene lógica de negocio.
4. Los esquemas viven en el `model/` de su feature.
5. Las APIs son funciones puras: nada de clases ni singletons.

### Estado

- **Servidor → React Query.** Cada feature tiene sus hooks en `hooks/`. Defaults en `src/shared/lib/react-query.ts`: `staleTime` de 5 min, `retry: 1`, sin refetch al enfocar la ventana.
- **Cliente → Zustand.**
  - `useAuthStore`: tokens y sesión.
  - `useThemeStore`: tema, modo y layout.
  - `useLocaleStore`: idioma.
  - `useBaseStore`: clave de la ruta actual.
  - El POS tiene su propio store (`features/pos/store/usePOSStore.ts`).

### Capa HTTP

Todas las llamadas usan `@shared/lib/http/httpClient`, que devuelve el body (`T`) directamente.

**Envelope.** Los backends responden `{ data, meta }` y, en listados, agregan `meta.pagination = { total, limit, offset }`. Cada capa hace lo suyo:
- `api/client.ts` tipa el envelope con `DataResponse<T>` o `PaginatedResponse<T>` (`src/@types/api.ts`).
- El **hook** lo desenvuelve y expone `{ items, pagination }` o la entidad.
- Los componentes nunca ven el envelope.

```ts
// api/client.ts
export const getSuppliers = (params?: SupplierListParams) =>
    httpClient.get<PaginatedResponse<Supplier>>(`${HOST}/suppliers`, { params })

// hooks/useSuppliers.ts
queryFn: async () => {
    const response = await api.getSuppliers(params)
    return { items: response.data, pagination: response.meta.pagination }
}
```

**Errores.** Todo error se rechaza como `ApiError` (`src/utils/errors/ApiError.ts`), con `code`, `message`, `status` y `errors[]`. En la UI se muestran con `notifyError(error, 'Mensaje por defecto')` de `@shared/ui/notify`.

### Autenticación

- JWT con access y refresh token. La sesión (rol y permisos) se hidrata con `GET /api/auth/me` desde `AuthBootstrap`.
- **Refresh proactivo:** `features/auth/lib/refreshScheduler.ts` renueva el token 60 s antes de que venza.
- **Refresh reactivo:** si una petición responde `TOKEN_EXPIRED`, `httpClient` renueva el token y reintenta una vez. Las renovaciones concurrentes se deduplican en `refreshOnce`, porque el backend rota el refresh token.
- `INVALID_TOKEN` o un refresh fallido → cierre de sesión (`forceSignOut`): limpia el store y la caché, y redirige a `/sign-in`.
- `PASSWORD_CHANGE_REQUIRED` → redirige a `/change-password`.
- **Regla:** los tokens se escriben solo a través de `useAuthStore` (`setTokens` / `clear`), que persiste en `localStorage`. Para renovar o cerrar sesión desde código usa `refreshSession()` / `forceSignOut()` de `@shared/lib/auth/session`.

### Roles y permisos

- Hay cinco roles: Administrador, Gerente, Operador, Consulta y Cajero (`src/constants/roles.constant.ts`).
- Los permisos son granulares (`product:read`, `pos:operate`, `user:manage`, …) y están en `src/constants/permissions.constant.ts`.
- En runtime, la fuente de verdad es la respuesta de `/api/auth/me`.
- Cada ruta declara `authority: ['permiso']` y `AuthorityGuard` redirige a `/access-denied` si falta.
- En componentes: `useCan(PERMISSION.X)` y `useHasRole(ROLE.ADMIN)` de `@/stores/useAuthStore`.
- Al iniciar sesión, el cajero entra directo a `/pos`.

### Formularios

React Hook Form + Zod 4 con `zodResolver`. Hay adaptadores en `src/components/ui/Form/controlled/` (`ControlledSelect`, `ControlledSwitcher`) y helpers como `makeNumberRegister` y `dateToIsoStartOfDay`.

Los formularios de crear y editar usan esquemas separados.

## Agregar un feature

1. Crea `src/features/<nombre>/` con `api/`, `model/`, `hooks/`, `components/` y `pages/`.
2. Define las funciones de `api/client.ts` con `httpClient`, tipadas con el envelope.
3. Escribe los hooks de React Query, que desenvuelven el envelope.
4. Declara las rutas en `routes.ts` (con `lazy()` y `authority`) y expórtalas en `index.ts`.
5. Registra las rutas en `src/configs/routes.config/routes.config.ts` y el menú en `src/configs/navigation.config/index.ts`.
6. Agrega tests en `hooks/__tests__/` y `model/__tests__/`.

El feature `suppliers` sirve como plantilla de referencia.

## Mocks

Con `enableMock: true` en `app.config.ts` (fuera de producción) se levanta MirageJS. Solo cubre auth, usuarios, productos, categorías, stock, movimientos y clientes; el resto de los módulos necesita el backend real.

> **Ojo:** los handlers registran rutas relativas (`/api/auth/login`, `/products`, …) y Mirage deja pasar toda URL absoluta (`http…`). Con los hosts actuales de `app.config.ts`, que son absolutos, las peticiones llegan al backend real. Para usar los mocks hay que apuntar esos hosts a rutas relativas.

Para agregar un mock:
1. Agrega los datos en `src/mock/data`.
2. Crea el handler en `src/mock/fakeApi`.
3. Regístralo en `src/mock/mock.ts`.

## Tests

- Vitest + Testing Library en jsdom (`src/test/setup.ts`).
- Los hooks se prueban mockeando su `api/client` (`vi.mock('../../api/client')`) y envolviéndolos en un `QueryClientProvider`.
- La capa HTTP tiene tests propios en `src/shared/lib/http/__tests__/`.

## Convenciones

- Commits con [Conventional Commits](https://www.conventionalcommits.org/) (`feat(scope): …`, `fix(scope): …`).
- PRs con la plantilla de `.github/pull_request_template.md`. Antes de abrirlos deben pasar `npm run lint`, `npm test` y `npm run build`.
- Imports con alias: `@/`, `@app/`, `@features/`, `@shared/`, `@stores/`, `@configs/`.
- Textos de UI en español.
