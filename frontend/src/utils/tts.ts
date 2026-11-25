import { TTS_LANG_MAP, type LanguageCode } from '../i18n'

function findVoiceForLocale(voices: SpeechSynthesisVoice[], code: string, nameHint: string): SpeechSynthesisVoice | null {
  const lower = code.toLowerCase()
  const prefix = lower.split('-')[0]
  return (
    voices.find((v) => v.lang?.toLowerCase() === lower) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(`${prefix}-`) || v.lang?.toLowerCase() === prefix) ||
    voices.find((v) => v.name?.toLowerCase().includes(nameHint)) ||
    null
  )
}

function pickVoice(lang: LanguageCode): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis
  if (!synth) return null
  const voices = synth.getVoices() || []
  if (!voices.length) return null

  if (lang === 'mr') {
    // Prefer native Marathi voice; fall back to Hindi Devanagari voice if OS lacks mr-IN
    // so Devanagari script is still pronounced instead of falling back to an English voice.
    return (
      findVoiceForLocale(voices, 'mr-IN', 'marathi') ||
      findVoiceForLocale(voices, 'hi-IN', 'hindi') ||
      null
    )
  }

  if (lang === 'hi') {
    return findVoiceForLocale(voices, 'hi-IN', 'hindi') || null
  }

  return (
    findVoiceForLocale(voices, 'en-IN', 'india') ||
    findVoiceForLocale(voices, 'en-US', 'english') ||
    voices.find((v) => v.lang?.toLowerCase().startsWith('en')) ||
    null
  )
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  const synth = window.speechSynthesis
  synth.getVoices()
}

export interface SpeakOptions {
  rate?: number
  onEnd?: () => void
  onError?: () => void
}

export function speakText(text: string, language: LanguageCode, options: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
    options.onError?.()
    return
  }
  const synth = window.speechSynthesis
  synth.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const targetLang = TTS_LANG_MAP[language] || 'en-IN'
  const voice = pickVoice(language)

  if (voice) {
    utterance.voice = voice
    utterance.lang = voice.lang || targetLang
  } else {
    utterance.lang = targetLang
  }

  utterance.rate = options.rate ?? (language === 'en' ? 1 : 0.95)
  utterance.onend = () => options.onEnd?.()
  utterance.onerror = () => options.onError?.()
  synth.speak(utterance)
  if (synth.paused) {
    synth.resume()
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeakingSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
