/**
 * Significado visual de un estado, independiente del dominio. Cada feature
 * mapea sus estados a un tono (`*_TONES` en `model/types.ts`) y `StatusBadge`
 * decide los colores: así la paleta se cambia en un solo lugar.
 */
export type StatusTone = 'success' | 'neutral' | 'warning' | 'danger' | 'info'
