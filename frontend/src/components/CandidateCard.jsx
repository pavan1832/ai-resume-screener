import { Star, XCircle, RotateCcw, Eye } from 'lucide-react'
import { ScoreBadge, StatusBadge, Avatar } from './UI'

export default function CandidateCard({ candidate, rank, onView, onShortlist, onReject, onPending, onDelete }) {
  const c = candidate
  return (
    <div className="card flex items-center gap-4 hover:shadow-md transition-shadow">
      {/* Rank */}
      <div className={`w-6 text-center text-xs font-bold flex-shrink-0 ${rank <= 3 ? 'text-amber-500' : 'text-gray-300'}`}>
        #{rank}
      </div>

      {/* Avatar */}
      <Avatar name={c.name} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-semibold text-sm text-gray-900 truncate">{c.name || 'Unknown'}</span>
          <StatusBadge status={c.status} />
        </div>
        <p className="text-xs text-gray-500 truncate mb-1.5">
          {[c.email, c.experience].filter(Boolean).join(' · ')}
        </p>
        <div className="flex flex-wrap gap-1">
          {c.skills.slice(0, 5).map((sk, i) => (
            <span key={i} className="skill-tag">{sk}</span>
          ))}
          {c.skills.length > 5 && (
            <span className="badge bg-gray-100 text-gray-500">+{c.skills.length - 5}</span>
          )}
        </div>
      </div>

      {/* Score */}
      <ScoreBadge score={c.overall_score} />

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={onView} className="btn-ghost !px-3 !py-1.5 text-xs gap-1">
          <Eye size={13} /> Details
        </button>
        {c.status !== 'shortlisted' && (
          <button onClick={onShortlist} className="btn-primary !px-3 !py-1.5 text-xs gap-1">
            <Star size={13} /> Shortlist
          </button>
        )}
        {c.status === 'shortlisted' && (
          <button onClick={onPending} className="btn-ghost !px-3 !py-1.5 text-xs" title="Remove from shortlist">
            <RotateCcw size={13} />
          </button>
        )}
        {c.status === 'pending' && (
          <button onClick={onReject} className="!px-3 !py-1.5 text-xs border border-red-200 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Reject">
            <XCircle size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
