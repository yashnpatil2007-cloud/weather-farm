export default function Spinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const dims = size === 'sm' ? 'h-4 w-4 border-2' : size === 'lg' ? 'h-10 w-10 border-4' : 'h-6 w-6 border-[3px]'
  const pad = size === 'sm' ? 'py-0' : 'py-6'
  return (
    <div className={`flex items-center justify-center gap-2 ${pad}`} role="status" aria-live="polite">
      <div className={`${dims} border-farm-200 border-t-farm-600 rounded-full animate-spin`} aria-hidden="true" />
      {label && <span className="text-slate-600 text-sm font-medium">{label}</span>}
    </div>
  )
}
