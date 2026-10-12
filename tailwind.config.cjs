/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

const safeListFile = 'safelist.txt'

const SAFELIST_COLORS = 'safelistColors'

/**
 * Tokens de marca (faclab-brand-style-guide.png). Los valores de la guía son
 * los de la paleta de Tailwind, así que no hay hexadecimales sueltos:
 *
 *   Azul oscuro   #0F172A  slate-900    fondo de marca, navegación
 *   Gris oscuro   #1E293B  slate-800    texto principal
 *   Gris medio    #64748B  slate-500    texto secundario
 *   Gris claro    #E2E8F0  slate-200    bordes y fondos
 *   Azul primario #2563EB  blue-600     interacción, elementos activos
 *   Verde acento  #10B981  emerald-500  éxito, estados y acción principal
 *
 * `gray` es la escala neutra de toda la app; `primary` y `accent` son los
 * nombres semánticos para el código nuevo.
 */
const brand = {
    neutral: colors.slate,
    primary: colors.blue,
    accent: colors.emerald,
}

module.exports = {
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './safelist.txt'],
    darkMode: 'class',
    theme: {
        fontFamily: {
            sans: [
                '"Inter Variable"',
                'Inter',
                'ui-sans-serif',
                'system-ui',
                '-apple-system',
                'BlinkMacSystemFont',
                '"Segoe UI"',
                'Roboto',
                '"Helvetica Neue"',
                'Arial',
                '"Noto Sans"',
                'sans-serif',
                '"Apple Color Emoji"',
                '"Segoe UI Emoji"',
                '"Segoe UI Symbol"',
                '"Noto Color Emoji"',
            ],
            serif: [
                'ui-serif',
                'Georgia',
                'Cambria',
                '"Times New Roman"',
                'Times',
                'serif',
            ],
            mono: [
                'ui-monospace',
                'SFMono-Regular',
                'Menlo',
                'Monaco',
                'Consolas',
                '"Liberation Mono"',
                '"Courier New"',
                'monospace',
            ],
        },
        screens: {
            xs: '576px',
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            '2xl': '1536px',
        },
        extend: {
            colors: {
                gray: brand.neutral,
                primary: { ...brand.primary, DEFAULT: brand.primary[600] },
                accent: { ...brand.accent, DEFAULT: brand.accent[500] },
            },
            boxShadow: {
                // Elevación de tarjetas y paneles en reposo
                card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
                // Menús, diálogos y todo lo que flota sobre la página
                pop: '0 10px 30px -8px rgb(15 23 42 / 0.18), 0 4px 10px -4px rgb(15 23 42 / 0.08)',
            },
            safelistColors: {
                red: colors.red,
                orange: colors.orange,
                amber: colors.amber,
                yellow: colors.yellow,
                lime: colors.lime,
                green: colors.green,
                emerald: colors.emerald,
                teal: colors.teal,
                cyan: colors.cyan,
                sky: colors.sky,
                blue: colors.blue,
                indigo: colors.indigo,
                violet: colors.violet,
                purple: colors.purple,
                fuchsia: colors.fuchsia,
                pink: colors.pink,
                rose: colors.rose,
            },
        },
    },
    plugins: [
        require('./twSafelistGenerator')({
            path: safeListFile,
            patterns: [
                `text-{${SAFELIST_COLORS}}`,
                `bg-{${SAFELIST_COLORS}}`,
                `dark:bg-{${SAFELIST_COLORS}}`,
                `dark:hover:bg-{${SAFELIST_COLORS}}`,
                `dark:active:bg-{${SAFELIST_COLORS}}`,
                `hover:text-{${SAFELIST_COLORS}}`,
                `hover:bg-{${SAFELIST_COLORS}}`,
                `active:bg-{${SAFELIST_COLORS}}`,
                `ring-{${SAFELIST_COLORS}}`,
                `hover:ring-{${SAFELIST_COLORS}}`,
                `focus:ring-{${SAFELIST_COLORS}}`,
                `focus-within:ring-{${SAFELIST_COLORS}}`,
                `border-{${SAFELIST_COLORS}}`,
                `focus:border-{${SAFELIST_COLORS}}`,
                `focus-within:border-{${SAFELIST_COLORS}}`,
                `dark:text-{${SAFELIST_COLORS}}`,
                `dark:hover:text-{${SAFELIST_COLORS}}`,
                `h-{height}`,
                `w-{width}`,
            ],
        }),
    ],
}
