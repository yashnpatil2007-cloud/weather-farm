export default function Spinner({ size = 'md', label }: { size?: 'sm' | 'md' | 'lg'; label?: string }) {
  const dims = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6'
  return (
    <div className="flex items-center justify-center gap-2 py-6" role="status" aria-live="polite">
      <div className={`${dims} border-4 border-farm-200 border-t-farm-600 rounded-full animate-spin`} aria-hidden="true" />
      {label && <span className="text-gray-600">{label}</span>}
    </div>
  )
}
