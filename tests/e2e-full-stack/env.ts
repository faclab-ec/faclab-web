/**
 * Lo que `faclab-infra/e2e/run.sh` le dice a la suite: dónde está cada servicio
 * y las credenciales de usar y tirar de esa corrida.
 */
const required = (name: string): string => {
    const value = process.env[name]
    if (!value) {
        throw new Error(
            `Falta ${name}: la suite se corre con faclab-infra/e2e/run.sh`
        )
    }
    return value
}

export const env = {
    webUrl: process.env.E2E_WEB_URL ?? 'http://localhost:18080',
    apiUrl: process.env.E2E_API_URL ?? 'http://localhost:18000',
    invoicingUrl: process.env.E2E_INVOICING_URL ?? 'http://localhost:18173',
    sri: process.env.E2E_SRI === 'celcer' ? 'celcer' : 'simulator',
    get username() {
        return required('E2E_ADMIN_USERNAME')
    },
    get password() {
        return required('E2E_ADMIN_PASSWORD')
    },
    /** El RUC de la empresa de la prueba y el de su certificado */
    get ruc() {
        return required('E2E_RUC')
    },
    get p12Path() {
        return required('E2E_P12_PATH')
    },
    get p12Password() {
        return required('E2E_P12_PASSWORD')
    },
    /** Con `celcer`, desde dónde numerar para no repetir comprobantes */
    sequenceStart: Number(process.env.E2E_SEQUENCE_START) || null,
}

// La semilla local de faclab-core (scripts/seed.py)
export const SEED = {
    company: 'Empresa de prueba',
    terminal: 'Caja 1 UIO (CAJA-01)',
    customer: { name: 'Ferretería El Maestro', taxId: '0992339411001' },
    product: { sku: 'FERR-005', name: 'Disco de corte 7 pulgadas' },
    presentation: 'Caja x25',
}
