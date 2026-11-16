import { TTS_LANG_MAP, type LanguageCode } from '../i18n'

let voiceCache: { lang: LanguageCode; voice: SpeechSynthesisVoice | null } | null = null

function pickVoice(lang: LanguageCode): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis
  if (!synth) return null
  const voices = synth.getVoices() || []
  if (!voices.length) return null
  const locale = TTS_LANG_MAP[lang] || 'en-IN'
  const lower = locale.toLowerCase()
  const exact = voices.find((v) => v.lang?.toLowerCase() === lower)
  if (exact) return exact
  const prefix = lower.split('-')[0]
  return voices.find((v) => v.lang?.toLowerCase().startsWith(`${prefix}-`)) || null
}

function refreshVoiceCache(lang: LanguageCode): SpeechSynthesisVoice | null {
  if (voiceCache && voiceCache.lang === lang && voiceCache.voice !== null) {
    return voiceCache.voice
  }
  const voice = pickVoice(lang)
  voiceCache = { lang, voice }
  return voice
}

// Browsers load the voice list asynchronously. Never keep a permanent null
// result in the cache, and re-evaluate when the voice list finally arrives so
// the spoken language always follows the currently selected application language.
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const synth = window.speechSynthesis
  if (typeof synth.addEventListener === 'function') {
    synth.addEventListener('voiceschanged', () => {
      if (voiceCache) {
        voiceCache.voice = pickVoice(voiceCache.lang)
      }
    })
  }
  // Kick off asynchronous voice loading in browsers that require a call first.
  synth.getVoices()
}

export interface SpeakOptions {
  rate?: number
  onEnd?: () => void
  onError?: () => void
}

export function speakText(text: string, language: LanguageCode, options: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    options.onError?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  const lang = TTS_LANG_MAP[language] || 'en-IN'
  utterance.lang = lang
  const voice = refreshVoiceCache(language)
  if (voice && voice.lang && voice.lang.toLowerCase().startsWith(lang.toLowerCase().split('-')[0])) {
    utterance.voice = voice
  }
  utterance.rate = options.rate ?? 1
  utterance.onend = () => options.onEnd?.()
  utterance.onerror = () => options.onError?.()
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeakingSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
