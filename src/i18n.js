
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

i18n
  .use(initReactI18next)
  .init({
    lng: 'en', // Hardcoded to English
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    resources: {
      en: {
        translation: en
      }
    }
  })

export default i18n

// import i18n from 'i18next'
// import { initReactI18next } from 'react-i18next'
// import LanguageDetector from 'i18next-browser-languagedetector'
// import en from './locales/en.json'
// import pt from './locales/pt.json'

// i18n
//   .use(LanguageDetector)
//   .use(initReactI18next)
//   .init({
//     lng: localStorage.getItem('i18nextLng') || 'pt',
//     fallbackLng: 'pt',
//     interpolation: {
//       escapeValue: false
//     },
//     resources: {
//       en: {
//         translation: en
//       },
//       pt: {
//         translation: pt
//       }
//     }
//   })

// export default i18n
