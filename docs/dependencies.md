# Dependencias

Estado tras la auditoría de octubre de 2026. Gestor: **npm** con `package-lock.json`.

## Criterio

- Se actualiza lo necesario para corregir un problema o cerrar un aviso de seguridad, no "todo a `latest`".
- Una versión mayor solo se sube si se evaluó la migración y hay con qué verificarla.
- Una dependencia solo se elimina si el grafo de imports desde `src/main.tsx` confirma que nada la usa.

## Cadena de build y pruebas

| Paquete | Antes | Ahora | Motivo |
|---|---|---|---|
| `vite` | 4.3.9 | 7.3.7 | La app corría con Vite 4 (sin soporte y con avisos altos en el servidor de desarrollo) mientras Vitest traía anidado Vite 5: dos Vite distintos para compilar y para probar. Ahora hay una sola copia |
| `@vitejs/plugin-react` | 4.0.0 | 5.2.0 | Compatible con Vite 7; conserva la opción `babel` que usan React Compiler y `twin.macro` |
| `vitest`, `@vitest/coverage-v8` | 1.6.1 | 4.1.11 | Cierra el aviso crítico de Vitest (<3.2.6) y el de `tinypool` |
| `@playwright/test` | — | 1.64.0 | Pruebas end-to-end |

Verificado con: `npm start` sin warnings, `npm run build`, `npm run preview`, 234 pruebas unitarias y 102 end-to-end.

**Warnings que aparecían al arrancar y su causa:**

- *"The CJS build of Vite's Node API is deprecated"*: `vite.config.ts` importaba `vitest/config`; sin `"type": "module"` la config se cargaba como CommonJS y arrastraba el Vite 5 anidado en Vitest, que es quien emite el aviso. Se resolvió renombrando a `vite.config.mts` (ESM explícito) y unificando la versión de Vite. No se añadió `"type": "module"` al paquete porque habría obligado a renombrar `twSafelistGenerator/*.js`.
- *"NODE_ENV=local is not supported in the .env file"*: `NODE_ENV=local` estaba en `.env` y `.env.example`, pero ningún código leía ese valor. Se quitó; `App.tsx` usa `import.meta.env`. Para un entorno propio se usan los modos de Vite (ver README).

## Parches de seguridad (misma versión mayor)

| Paquete | Antes | Ahora |
|---|---|---|
| `axios` | 1.4.0 | 1.20.0 |
| `lodash` | 4.17.21 | 4.18.1 |
| `react-router-dom` | 6.30.3 | 6.30.6 |
| `postcss` | 8.5.14 | 8.5.29 |
| `tailwindcss` | 3.3.2 | 3.4.19 |
| `twin.macro` | 3.3.1 | 3.4.1 |
| `autoprefixer` | 10.4.14 | 10.6.1 |
| `miragejs` | 0.1.47 | 0.1.48 |
| `react-modal` | 3.16.1 | 3.16.3 |

Más `npm audit fix` (sin `--force`) para las transitivas y `update-browserslist-db`.

`miragejs` 0.1.48 tipa los query params como `string | string[] | null`; los handlers de `src/mock/fakeApi` usan `singleQueryParams` para normalizarlos.

## Añadidas

| Paquete | Motivo |
|---|---|
| `@fontsource-variable/inter` | Inter autoalojada. Antes se cargaba con un `@import` a Google Fonts: bloqueaba el render, dependía de un tercero y fallaba sin internet (relevante en un punto de venta). Además faltaba el peso 500, muy usado |

## Eliminadas

Ningún archivo alcanzable desde `src/main.tsx` las importaba:

- **Runtime:** `@fullcalendar/*` (5), `apexcharts`, `react-apexcharts`, `react-simple-maps`, `react-quill-new`, `react-syntax-highlighter`, `react-highlight-words`, `react-tooltip`, `react-markdown`, `react-number-format`, `react-scroll`, `react-custom-scrollbars-2`, `history`, `d3-dsv`, `d3-fetch`, `d3-scale`, `@tanstack/match-sorter-utils`.
- **Desarrollo:** los `@types/*` de las anteriores, `@tailwindcss/typography` (ninguna clase `prose`), `cross-env`, `dotenv`, `postcss-cli`, `postcss-nesting`, `rollup-plugin-polyfill-node`, `rollup-plugin-postcss`, `vite-plugin-dynamic-import` (no hay imports dinámicos con variables).

Con ellas se fueron los componentes de demostración de la plantilla que las usaban. El build pasó de 3.894 a unos 1.570 módulos.

## `npm audit`

De **56** avisos (3 críticos, 18 altos) a **10** (0 críticos, 5 altos, 5 moderados). Los que quedan necesitan una migración mayor:

| Aviso | Paquetes | Por qué sigue | Riesgo real |
|---|---|---|---|
| ReDoS en globs y selectores | `tailwindcss` 3 y sus transitivas (`braces`, `micromatch`, `chokidar`, `fast-glob`, `postcss-nested`, `postcss-selector-parser`), `twin.macro` | Solo se corrige con Tailwind 4 | Bajo: son herramientas de build que procesan el código del propio repositorio, no entradas de usuarios |
| Redirección abierta con `\` en `<Link>` / `navigate` | `react-router-dom` 6 | Solo se corrige en la 7.18 | Mitigado: el único destino que controla un usuario es `?redirectUrl=` del login, y pasa por `safeRedirectPath` (`features/auth/lib`), que solo acepta rutas internas. El otro aviso (hidratación SSR) no aplica: no hay SSR |

## Migraciones aplazadas

| Paquete | Disponible | Por qué no ahora | Cómo abordarla |
|---|---|---|---|
| `vite` | 8 | Usa Rolldown, y `@vitejs/plugin-react` 6 deja de incluir Babel, del que dependen React Compiler y `twin.macro` | Antes hay que decidir el reemplazo de `twin.macro` (5 archivos lo usan para leer el tema) y mover React Compiler al plugin de Babel que indique la guía de migración |
| `tailwindcss` | 4 | Cambia el formato de configuración y el motor; `twin.macro` 3 es para Tailwind 3 y el safelist generado depende de la config actual | Migrar junto con el punto anterior; reemplazar las clases dinámicas `bg-${color}` del kit por tokens |
| `react-router-dom` | 7 | Cambios de API y de paquetes | Los *future flags* `v7_startTransition` y `v7_relativeSplatPath` ya están activos en `App.tsx`; falta el cambio de paquetes y de API |
| `eslint` | 10 | Sin necesidad actual | Revisar compatibilidad de los plugins antes de subir |
| `prettier` | 3 | Reformatea todo el repositorio | Hacerlo en un commit aparte, solo de formato |
| `typescript` | 7 | Compilador nuevo; sin necesidad actual | Esperar a que `typescript-eslint` lo soporte |
| `i18next`, `react-i18next`, `react-icons`, `@tanstack/react-table` | mayores nuevas | Sin avisos ni necesidad | Subir cuando se toque esa parte |

## `legacy-peer-deps`

`.npmrc` mantiene `legacy-peer-deps=true` porque `react-popper` 2.3.0 (última versión, sin mantenimiento) declara React ≤ 18 como peer. Lo usan `Tooltip` y `DatePicker` del kit. Para quitar la opción hay que reemplazar `react-popper` por `@floating-ui/react`.
