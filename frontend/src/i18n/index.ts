import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './languages/en'
import hi from './languages/hi'
import mr from './languages/mr'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
] as const

export type LanguageCode = 'en' | 'hi' | 'mr'

export const TTS_LANG_MAP: Record<LanguageCode, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
}

const STORAGE_KEY = 'weatherfarm_language'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
    mr: { translation: mr },
  },
  lng: localStorage.getItem(STORAGE_KEY) || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function setLanguage(lang: LanguageCode) {
  localStorage.setItem(STORAGE_KEY, lang)
  i18n.changeLanguage(lang)
  document.documentElement.lang = lang
}

export function getSavedLanguage(): LanguageCode {
  const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null
  return saved && ['en', 'hi', 'mr'].includes(saved) ? saved : 'en'
}

export default i18n
