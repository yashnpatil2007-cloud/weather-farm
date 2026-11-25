import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export default function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 ${onClick ? 'cursor-pointer hover:shadow-md hover:border-farm-300 transition-all duration-150' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
