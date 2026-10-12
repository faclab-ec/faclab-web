# Faclab Web

Frontend administrativo de **Faclab**, un sistema de gestión comercial para pymes de Ecuador: catálogo, inventario, compras, ventas, punto de venta y facturación electrónica SRI.

## Módulos

| Área | Features (`src/features/`) |
|---|---|
| Catálogo | `products`, `categories`, `unitsOfMeasure` |
| Inventario | `warehouses`, `locations`, `stock`, `movements`, `lots`, `serialNumbers`, `adjustments`, `transfers`, `alerts` |
| Compras | `suppliers` (contactos y productos por proveedor), `purchases` (órdenes, envío, recepción) |
| Ventas | `customers`, `sales`, `pos` (turnos de caja, movimientos de efectivo, ventas en espera, pagos, devoluciones) |
| Facturación | `invoicing` (certificados `.p12`, configuración de la empresa: establecimiento, punto de emisión, secuencial, ambiente; estado de la facturación con avisos en el layout, el POS y el inicio; facturas pendientes o con error y reintentos) |
| Análisis | `reports` (valoración, rotación, movimientos, resumen por bodega) |
| Administración | `auth` (login, cambio de contraseña), `admin-users` (usuarios y roles) |

### Backends

| Servicio | Host por defecto | Uso |
|---|---|---|
| `faclab-core` | `http://localhost:3000` (`/api/auth`, `/api/admin`, `/api/pos`) | Autenticación, usuarios, inventario, compras, ventas y POS |
| `faclab-invoicing` | `http://localhost:3173` | Certificados, configuración SRI y comprobantes electrónicos |

## Stack

- **React 19** con **React Compiler** (`babel-plugin-react-compiler`) y **TypeScript 5.9** en modo strict
- **Vite 7** como bundler y dev server (config en ESM: `vite.config.mts`)
- **TanStack Query 5** para el estado del servidor y **Zustand 5** para el estado del cliente
- **React Router 6**
- **React Hook Form 7 + Zod 4** para formularios
- **Axios** como cliente HTTP (un solo `httpClient`)
- **Tailwind CSS 3** + `twin.macro`, con kit de UI propio (heredado de la plantilla Elstar), un solo layout y modo claro/oscuro
- TanStack Table, dayjs, i18next, Inter autoalojada (`@fontsource-variable/inter`)
- **MirageJS** para mocks de API (opcional)
- **Vitest 4** + Testing Library + jsdom para pruebas unitarias
- **Playwright** para pruebas end-to-end
- **ESLint 9** (flat config) + **Prettier**

Qué versiones se actualizaron, cuáles se dejaron a propósito y por qué: [`docs/dependencies.md`](docs/dependencies.md).

## Requisitos

- Node.js 20.19 o superior (lo exige Vite 7; probado con Node 22)
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
VITE_API_BASE_URL=http://localhost:3000        # faclab-core: /api/auth, /api/admin, /api/pos
VITE_INVOICING_API_URL=http://localhost:3173   # faclab-invoicing
```

`src/configs/app.config.ts` arma los hosts de cada API (`inventoryApiHost`, `posApiHost`, `invoicingApiHost`) a partir de estas variables. En ese archivo también está `enableMock` para activar MirageJS.

Sobre las variables de entorno:

- **No definas `NODE_ENV` en los `.env`.** Vite lo fija según el comando (`development` con `npm start`, `production` con `npm run build`) e ignora cualquier otro valor con un warning.
- Para un entorno propio usa un **modo** de Vite: `npm start -- --mode staging` carga además `.env.staging`, y el código lo lee con `import.meta.env.MODE`.
- Todo lo que empieza con `VITE_` termina dentro del JavaScript que descarga el navegador. Ahí solo van URLs y datos públicos, nunca secretos ni credenciales.

## Scripts

```bash
npm start               # Dev server
npm run build           # Build de producción (sale en /build)
npm run preview         # Sirve el build

npm test                # Pruebas unitarias (Vitest)
npm run test:watch      # Vitest en modo watch
npm run test:coverage   # Cobertura (v8)
npm run check:contract  # Compara los enums del front con el OpenAPI de faclab-core

npm run test:e2e:install  # Descarga Chromium para Playwright (una vez)
npm run test:e2e          # Pruebas end-to-end (Playwright)
npm run test:e2e:ui       # Las mismas, en la interfaz interactiva
npm run test:e2e:report   # Abre el último reporte HTML
npm run test:e2e:update   # Regenera las capturas de referencia

npm run typecheck       # TypeScript: app, config de Vite y pruebas E2E
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
├── stores/         # Zustand global: auth, theme, base
├── components/     # ui/ (kit), layouts/ (AppLayout, AuthLayout), template/, route/, shared/
├── configs/        # app, routes, navigation, theme, zod
├── constants/      # permisos, roles, códigos de IVA, etc.
├── @types/         # tipos globales (api, auth, routes, ...)
├── utils/          # ApiError, hooks de la plantilla, helpers
├── mock/           # MirageJS: data/ + fakeApi/
├── locales/        # i18next
└── test/           # setup de Vitest

tests/e2e/          # Playwright: specs/, fixtures/ (datos) y support/ (API simulada, sesión)
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
  - `useThemeStore`: modo claro/oscuro y menú colapsado (lo único del tema que el usuario cambia).
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

### Sistema de diseño

La interfaz sigue la guía de marca (`faclab-brand-style-guide.png`). Los colores de la guía son los de la paleta de Tailwind, así que no hay hexadecimales sueltos:

| Rol | Token | Valor |
|---|---|---|
| Neutros (texto, bordes, fondos, navegación) | `gray-*` (escala `slate`) | `#0F172A` · `#1E293B` · `#64748B` · `#E2E8F0` |
| Interacción: enlaces, foco, selección, ítem activo | `primary-*` (escala `blue`) | `#2563EB` |
| Acción principal, éxito, interruptores | `accent-*` (escala `emerald`) | `#10B981`; los botones usan `emerald-600` por contraste |

- **Dónde se definen:** escalas, sombras (`shadow-card`, `shadow-pop`) y tipografía en `tailwind.config.cjs`; color de interacción y de acción en `src/configs/theme.config.ts`; el aspecto de cada componente del kit en `src/assets/styles/components/_*.css`.
- **Estados:** usa `StatusBadge` con un tono (`success`, `neutral`, `warning`, `danger`, `info`). Cada feature mapea sus estados en un registro `*_TONES` de `model/types.ts`; no se escriben clases de color por estado.
- **Piezas compartidas** (`src/components/shared/`): `PageHeader` (título, descripción, acciones y botón volver), `DataTable` (carga, vacío, error con reintento y paginación), `EmptyState`, `ErrorState`, `StatCard`, `BarList`, `LabeledField`, `FormModal`, `ConfirmDialog`.
- **Página de lista:** `PageHeader` + `Card bodyClass="p-0"` + `DataTable` con `error` y `onRetry`. `suppliers` es la referencia.
- **Accesibilidad:** `FormItem` y `LabeledField` asocian la etiqueta con su control; todo botón de solo ícono lleva `aria-label`; el foco visible es único (`:focus-visible`) y se respeta `prefers-reduced-motion`.

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

Hay cuatro comprobaciones distintas; ninguna reemplaza a otra:

| Comprobación | Comando | Qué valida |
|---|---|---|
| Tipos | `npm run typecheck` | Que el código compila en TypeScript |
| Lint | `npm run lint` | Reglas de estilo y errores comunes |
| Unitarias | `npm test` | Hooks, esquemas y utilidades, en jsdom, sin navegador |
| End-to-end | `npm run test:e2e` | La app completa en un navegador real |

### Unitarias (Vitest)

- Vitest + Testing Library en jsdom (`src/test/setup.ts`).
- Los hooks se prueban mockeando su `api/client` (`vi.mock('../../api/client')`) y envolviéndolos en un `QueryClientProvider`.
- La capa HTTP tiene tests propios en `src/shared/lib/http/__tests__/`.

### End-to-end (Playwright)

```bash
npm run test:e2e:install   # una sola vez: descarga Chromium
npm run test:e2e
```

Playwright levanta su propio servidor de desarrollo en `http://127.0.0.1:5199` (no toca un `npm start` que tengas abierto en el 5173) y antes de las pruebas recorre la app una vez para que Vite compile cada pantalla.

**No necesita backend.** Todas las llamadas a `faclab-core` y `faclab-invoicing` se interceptan en el navegador y se responden con datos de prueba que respetan el envelope `{ data, meta }` y los códigos de error reales. No se escribe nada en ninguna base de datos. A cambio, estas pruebas no validan la integración real: para eso está `npm run check:contract`.

```
tests/e2e/
├── specs/         # Una suite por área: smoke, auth, navigation, suppliers, products,
│                  # invoicing, pos, responsive, visual
├── fixtures/      # Datos de prueba tipados con los tipos de cada feature
└── support/
    ├── mockApi.ts     # API simulada: ok(), paginated(), apiError()
    ├── session.ts     # Sesión iniciada por rol y permisos
    ├── test.ts        # `test` con los fixtures `api` y `signIn`
    └── globalSetup.ts # Calentamiento del servidor de desarrollo
```

Dos reglas se aplican solas a todas las pruebas:

- **Una llamada a la API sin simular hace fallar la prueba.** Así una pantalla no puede depender de un endpoint que nadie declaró.
- **Un error en la consola del navegador hace fallar la prueba**, salvo las respuestas 4xx/5xx que la propia prueba pidió simular.

Proyectos: `chromium` (escritorio, toda la suite) y `mobile` (Pixel 7, solo `responsive` y `visual`). Firefox y WebKit están preparados y comentados en `playwright.config.ts`.

**Depurar un fallo**

```bash
npm run test:e2e:ui                          # interfaz interactiva, con línea de tiempo
npx playwright test suppliers --headed       # ver el navegador
npx playwright test -g "crea un proveedor"   # una sola prueba por nombre
npx playwright test --debug                  # paso a paso con el inspector
npm run test:e2e:report                      # reporte HTML del último run
```

Cada prueba fallida deja en `test-results/` una captura, un video y una traza; la traza se abre con `npx playwright show-trace <ruta>/trace.zip` y muestra el DOM, la red y la consola en cada paso.

**Capturas de referencia.** `visual.spec.ts` compara pantallas clave con las imágenes de `tests/e2e/specs/__screenshots__/`. El nombre incluye el sistema operativo (`-darwin`, `-linux`) porque las fuentes se dibujan distinto en cada uno: las referencias de macOS no sirven en Linux. Si el cambio visual es intencional y lo revisaste, regenéralas con `npm run test:e2e:update` y sube las imágenes junto con el cambio.

**Escribir una prueba**

```ts
import { test, expect } from '../support/test'
import { mockSuppliers } from '../fixtures/suppliers'

test('lista los proveedores', async ({ page, api, signIn }) => {
    mockSuppliers(api)   // qué responde el backend
    await signIn()       // sesión de administrador (o signIn({ role: ROLE.VIEWER }))
    await page.goto('/suppliers')

    await expect(page.getByRole('row').filter({ hasText: 'Maderas del Austro' })).toBeVisible()
})
```

Busca los elementos como los encontraría una persona: `getByRole`, `getByLabel`, `getByText`. No uses clases CSS ni `waitForTimeout`.

## Convenciones

- Commits con [Conventional Commits](https://www.conventionalcommits.org/) (`feat(scope): …`, `fix(scope): …`).
- PRs con la plantilla de `.github/pull_request_template.md`. Antes de abrirlos deben pasar `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` y `npm run test:e2e`.
- Imports con alias: `@/`, `@app/`, `@features/`, `@shared/`, `@stores/`, `@configs/`.
- Textos de UI en español.
