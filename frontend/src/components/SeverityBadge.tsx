import { useTranslation } from 'react-i18next'
import type { Severity } from '../types'

const config: Record<Severity, { dot: string; text: string; bg: string; border: string; labelKey: string }> = {
  favorable: {
    dot: 'bg-green-500',
    text: 'text-green-800',
    bg: 'bg-green-50',
    border: 'border-green-300',
    labelKey: 'advice.safe',
  },
  caution: {
    dot: 'bg-yellow-500',
    text: 'text-yellow-800',
    bg: 'bg-yellow-50',
    border: 'border-yellow-300',
    labelKey: 'advice.caution',
  },
  warning: {
    dot: 'bg-orange-500',
    text: 'text-orange-800',
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    labelKey: 'advice.warning',
  },
  critical: {
    dot: 'bg-red-600',
    text: 'text-red-800',
    bg: 'bg-red-50',
    border: 'border-red-300',
    labelKey: 'advice.critical',
  },
}

export default function SeverityBadge({ severity, size = 'md' }: { severity: Severity; size?: 'sm' | 'md' }) {
  const { t } = useTranslation()
  const c = config[severity] || config.favorable
  const label = t(c.labelKey)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${c.border} ${c.bg} ${c.text} ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'} font-medium`}
    >
      <span className={`h-2 w-2 rounded-full ${c.dot}`} aria-hidden="true" />
      {label}
    </span>
  )
}
