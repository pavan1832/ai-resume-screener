import { Star, XCircle, RotateCcw } from 'lucide-react'
import { Modal, ScoreBadge, StatusBadge, ScoreBreakdown, Avatar } from './UI'
import toast from 'react-hot-toast'
import { candidatesApi } from '../services/api'

export default function CandidateModal({ candidate, onClose, onUpdate }) {
  const c = candidate

  const handle = async (action) => {
    try {
      const { data } = await action(c.id)
      onUpdate(data)
      toast.success(`Candidate ${data.status}`)
    } catch {
      toast.error('Action failed')
    }
  }

  return (
    <Modal onClose={onClose} wide>
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
        <Avatar name={c.name} size="lg" />
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-gray-900 text-lg truncate">{c.name}</h2>
          <p className="text-xs text-gray-500">{[c.email, c.phone].filter(Boolean).join(' · ')}</p>
        </div>
        <div className="flex items-center gap-3">
          <ScoreBadge score={c.overall_score} size="lg" />
          <StatusBadge status={c.status} />
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl ml-2">✕</button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Score breakdown */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Score Breakdown</h3>
          <ScoreBreakdown
            skillMatch={c.skill_match}
            expMatch={c.experience_match}
            semanticMatch={c.semantic_match}
          />
        </div>

        {/* AI Summary */}
        {c.ai_summary && (
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p className="text-xs font-semibold text-teal-700 mb-1">🤖 AI Analysis</p>
            <p className="text-sm text-teal-800 leading-relaxed">{c.ai_summary}</p>
          </div>
        )}

        {/* Skills + Gaps */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">✅ Skills Matched</h3>
            <div className="flex flex-wrap gap-1.5">
              {c.skills.length > 0
                ? c.skills.map((sk, i) => <span key={i} className="skill-tag">{sk}</span>)
                : <span className="text-xs text-gray-400">None detected</span>
              }
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">⚠️ Skill Gaps</h3>
            <div className="flex flex-wrap gap-1.5">
              {c.skill_gap.length > 0
                ? c.skill_gap.map((sk, i) => <span key={i} className="gap-tag">{sk}</span>)
                : <span className="text-xs text-green-600 font-medium">No gaps — great match! 🎉</span>
              }
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-3 gap-3">
          {[
            ['Experience', c.experience || 'N/A'],
            ['Education',  c.education  || 'N/A'],
            ['File',       c.file_name  || 'N/A'],
          ].map(([l, v]) => (
            <div key={l} className="bg-gray-50 rounded-lg p-3">
              <p className="text-[11px] text-gray-400 mb-0.5">{l}</p>
              <p className="text-sm font-medium text-gray-800 truncate">{v}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-gray-100">
          {c.status !== 'shortlisted' && (
            <button onClick={() => handle(candidatesApi.shortlist)} className="btn-primary flex-1 justify-center">
              <Star size={15} /> Shortlist
            </button>
          )}
          {c.status === 'shortlisted' && (
            <button onClick={() => handle(candidatesApi.pending)} className="btn-ghost flex-1 justify-center">
              <RotateCcw size={15} /> Remove from Shortlist
            </button>
          )}
          {c.status !== 'rejected' && (
            <button onClick={() => handle(candidatesApi.reject)} className="btn-ghost flex-1 justify-center !text-red-500 !border-red-200 hover:!bg-red-50">
              <XCircle size={15} /> Reject
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}
