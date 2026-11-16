import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { speakText, stopSpeaking, isSpeakingSupported } from '../utils/tts'

interface ListenButtonProps {
  text: string
  label?: string
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  autoFocusOnLoad?: boolean
}

export default function ListenButton({ text, label, variant = 'secondary', className = '', autoFocusOnLoad = false }: ListenButtonProps) {
  const { t } = useTranslation()
  const { language } = useAuth()
  const [speaking, setSpeaking] = useState(false)
  const autoplayRef = useRef(false)

  const doSpeak = () => {
    if (!isSpeakingSupported()) return Promise.resolve()
    setSpeaking(true)
    speakText(text, language, {
      onEnd: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    })
  }

  // Optional autoplay for critical alerts on mount (respects a user toggle).
  const handleClick = () => {
    if (speaking) {
      stopSpeaking()
      setSpeaking(false)
    } else {
      doSpeak()
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      autoFocus={autoFocusOnLoad && !autoplayRef.current ? (autoplayRef.current = true, true) : false}
      aria-label={speaking ? t('common.stop') : (label || t('common.listen'))}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
        variant === 'primary'
          ? 'bg-farm-600 text-white hover:bg-farm-700 focus:ring-farm-500'
          : variant === 'ghost'
            ? 'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-400'
            : 'bg-farm-100 text-farm-700 border-2 border-farm-300 hover:bg-farm-200 focus:ring-farm-500'
      } ${className}`}
    >
      <span aria-hidden="true">{speaking ? '⏹' : '🔊'}</span>
      {speaking ? t('common.stop') : (label || t('common.listen'))}
    </button>
  )
}
