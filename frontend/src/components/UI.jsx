import { X } from 'lucide-react'

// ─── Score Badge ────────────────────────────────────────────────────────────
export function ScoreBadge({ score, size = 'md' }) {
  const color =
    score >= 75 ? 'bg-green-50 text-green-700 border-green-200' :
    score >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  'bg-red-50  text-red-700  border-red-200'
  const sz = size === 'lg' ? 'text-2xl px-4 py-1.5' : 'text-sm px-2.5 py-0.5'
  return (
    <span className={`inline-flex items-center font-bold rounded-lg border ${color} ${sz}`}>
      {score}%
    </span>
  )
}

// ─── Status Badge ───────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    shortlisted: 'bg-green-50 text-green-700',
    rejected:    'bg-red-50   text-red-700',
    pending:     'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`badge capitalize ${map[status] || map.pending}`}>
      {status}
    </span>
  )
}

// ─── Progress Bar ───────────────────────────────────────────────────────────
export function ProgressBar({ value, color = '#0d9488' }) {
  return (
    <div className="score-bar-track">
      <div
        className="score-bar-fill"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  )
}

// ─── Score Breakdown ─────────────────────────────────────────────────────────
export function ScoreBreakdown({ skillMatch, expMatch, semanticMatch }) {
  const items = [
    { label: 'Skill Match',    value: skillMatch,    weight: '40%', color: '#0d9488' },
    { label: 'Experience',     value: expMatch,      weight: '30%', color: '#6366f1' },
    { label: 'Semantic Fit',   value: semanticMatch, weight: '30%', color: '#f59e0b' },
  ]
  return (
    <div className="grid grid-cols-3 gap-3">
      {items.map(({ label, value, weight, color }) => (
        <div key={label} className="bg-gray-50 rounded-lg p-3">
          <p className="text-[11px] text-gray-500 mb-1">{label} <span className="text-gray-400">({weight})</span></p>
          <p className="text-xl font-bold" style={{ color }}>{value}%</p>
          <ProgressBar value={value} color={color} />
        </div>
      ))}
    </div>
  )
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, bg = 'bg-white' }) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-gray-100`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-gray-900 leading-none">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  )
}

// ─── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ children, onClose, title, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-xl w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[90vh] flex flex-col`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="card text-center py-14">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">{description}</p>
      {action}
    </div>
  )
}

// ─── Loading Spinner ─────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = '#0d9488' }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24" fill="none"
      className="animate-spin"
      style={{ color }}
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({ name, size = 'md', bg = 'bg-blue-100', text = 'text-blue-700' }) {
  const initial = (name || '?')[0].toUpperCase()
  const sz = size === 'lg' ? 'w-12 h-12 text-lg' : size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} ${bg} ${text} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>
      {initial}
    </div>
  )
}
