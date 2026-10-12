import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import es from './lang/es.json'
import appConfig from '@/configs/app.config'

// La app tiene un solo idioma. Si se añade otro, este es el punto donde
// registrar su recurso y su locale de dayjs.
i18n.use(initReactI18next).init({
    resources: {
        es: {
            translation: es,
        },
    },
    fallbackLng: appConfig.locale,
    lng: appConfig.locale,
    interpolation: {
        escapeValue: false,
    },
})

dayjs.locale(appConfig.locale)

export default i18n
