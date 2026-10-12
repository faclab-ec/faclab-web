import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import importX from 'eslint-plugin-import-x'
import unusedImports from 'eslint-plugin-unused-imports'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'

export default tseslint.config(
    {
        ignores: [
            'node_modules/**',
            'build/**',
            'playwright-report/**',
            'test-results/**',
            'dist/**',
            'public/**',
            'src/assets/styles/**',
            'twSafelistGenerator/**',
            'safelist.txt',
            '.prettierrc.js',
        ],
    },

    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        files: ['**/*.{ts,tsx,mts,js,jsx,mjs,cjs}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                ...globals.es2022,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        settings: {
            react: { version: 'detect' },
            'import-x/parsers': {
                '@typescript-eslint/parser': ['.ts', '.tsx'],
            },
            'import-x/resolver-next': [
                createTypeScriptImportResolver({
                    project: './tsconfig.eslint.json',
                    alwaysTryTypes: true,
                }),
            ],
        },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            'import-x': importX,
            'unused-imports': unusedImports,
        },
        rules: {
            ...react.configs.flat.recommended.rules,
            ...react.configs.flat['jsx-runtime'].rules,
            ...reactHooks.configs.flat['recommended-latest'].rules,
            ...importX.flatConfigs.recommended.rules,
            ...importX.flatConfigs.typescript.rules,

            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/no-unused-expressions': [
                'error',
                { allowShortCircuit: true, allowTernary: true },
            ],
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            'react/react-in-jsx-scope': 'off',
            'react/prop-types': 'off',
            'react/jsx-sort-props': [
                'warn',
                {
                    callbacksLast: true,
                    shorthandFirst: true,
                    ignoreCase: true,
                    reservedFirst: true,
                    noSortAlphabetically: true,
                },
            ],
            'import-x/first': 'warn',
            'import-x/default': 'off',
            'import-x/newline-after-import': 'warn',
            'import-x/no-named-as-default-member': 'off',
            'import-x/no-duplicates': 'error',
            'import-x/no-named-as-default': 'off',

            // Downgrade rules introduced by react-hooks v7 (compiler integration)
            // to warn, matching the previous react-compiler/react-compiler severity.
            // Surfaced for visibility but not blocking — fix in follow-up PR.
            'react-hooks/rules-of-hooks': 'warn',
            'react-hooks/set-state-in-effect': 'warn',
            'react-hooks/refs': 'warn',
            'react-hooks/incompatible-library': 'warn',
            'react-hooks/static-components': 'warn',
            'react-hooks/immutability': 'warn',
            'react-hooks/purity': 'warn',
            'react-hooks/set-state-in-render': 'warn',
            'react-hooks/preserve-manual-memoization': 'warn',
            'react-hooks/use-memo': 'warn',
            'react-hooks/error-boundaries': 'warn',
            'react-hooks/gating': 'warn',
            'react-hooks/globals': 'warn',
            'react-hooks/unsupported-syntax': 'warn',
            'react-hooks/config': 'warn',
        },
    },

    {
        // Pruebas E2E: código de Node/Playwright, no de React. El `use` de
        // los fixtures de Playwright no es el hook `use` de React.
        files: ['tests/e2e/**/*.ts', 'playwright.config.ts'],
        rules: {
            'react-hooks/rules-of-hooks': 'off',
            'react-refresh/only-export-components': 'off',
        },
    },

    {
        files: ['**/*.cjs'],
        rules: {
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-var-requires': 'off',
        },
    },

    prettier,
)
