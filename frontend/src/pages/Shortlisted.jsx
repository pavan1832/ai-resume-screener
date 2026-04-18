import { useEffect, useState } from 'react'
import { Download, FileSpreadsheet } from 'lucide-react'
import { candidatesApi, jobsApi, exportApi } from '../services/api'
import { EmptyState, ScoreBadge, Avatar, Spinner } from '../components/UI'
import CandidateModal from '../components/CandidateModal'

export default function Shortlisted() {
  const [candidates, setCandidates] = useState([])
  const [jobs, setJobs] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      candidatesApi.list({ status: 'shortlisted' }),
      jobsApi.list(),
    ]).then(([cr, jr]) => {
      setCandidates(cr.data)
      setJobs(jr.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleUpdate = updated => {
    setCandidates(cs => cs.filter(c => c.id !== updated.id || updated.status === 'shortlisted'))
    setSelected(null)
    load()
  }

  const jobMap = Object.fromEntries(jobs.map(j => [j.id, j.title]))

  // Group by job
  const byJob = candidates.reduce((acc, c) => {
    const key = c.job_id
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shortlisted Candidates</h1>
          <p className="text-sm text-gray-500 mt-1">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} shortlisted</p>
        </div>
        {candidates.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => exportApi.csv({ status: 'shortlisted' })}
              className="btn-ghost !px-3 !py-2 text-xs"
            >
              <Download size={14} /> Export CSV
            </button>
            <button
              onClick={() => exportApi.excel({ status: 'shortlisted' })}
              className="btn-primary !px-3 !py-2 text-xs"
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
          </div>
        )}
      </div>

      {candidates.length === 0 ? (
        <EmptyState
          icon="⭐"
          title="No shortlisted candidates yet"
          description="Go to Candidates and click 'Shortlist' on promising profiles to collect them here."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(byJob).map(([jid, cands]) => (
            <div key={jid}>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-base">💼</span>
                {jobMap[jid] || 'Unknown Job'}
                <span className="badge bg-teal-50 text-teal-700">{cands.length}</span>
              </h2>

              <div className="space-y-2">
                {cands
                  .sort((a, b) => b.overall_score - a.overall_score)
                  .map((c, i) => (
                    <div
                      key={c.id}
                      className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelected(c)}
                    >
                      <div className={`w-6 text-xs font-bold text-center flex-shrink-0 ${i < 3 ? 'text-amber-500' : 'text-gray-300'}`}>
                        #{i + 1}
                      </div>
                      <Avatar name={c.name} bg="bg-green-100" text="text-green-700" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{c.name}</p>
                        <p className="text-xs text-gray-400 truncate">{[c.email, c.experience].filter(Boolean).join(' · ')}</p>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {c.skills.slice(0, 6).map((sk, si) => (
                            <span key={si} className="badge bg-green-50 text-green-700 text-[10px]">{sk}</span>
                          ))}
                        </div>
                      </div>

                      {/* Score column */}
                      <div className="text-right flex-shrink-0">
                        <ScoreBadge score={c.overall_score} />
                        <p className="text-[10px] text-gray-400 mt-1">match score</p>
                      </div>

                      {/* Skill gaps */}
                      {c.skill_gap.length > 0 && (
                        <div className="hidden lg:block flex-shrink-0 max-w-[160px]">
                          <p className="text-[10px] text-gray-400 mb-1">Skill gaps</p>
                          <div className="flex flex-wrap gap-1">
                            {c.skill_gap.slice(0, 3).map((sk, si) => (
                              <span key={si} className="gap-tag text-[10px]">{sk}</span>
                            ))}
                            {c.skill_gap.length > 3 && (
                              <span className="badge bg-red-50 text-red-400 text-[10px]">+{c.skill_gap.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <CandidateModal
          candidate={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
