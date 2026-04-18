import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp, FileText, Briefcase, Star } from 'lucide-react'
import { jobsApi, candidatesApi } from '../services/api'
import { StatCard, ScoreBadge, Avatar, ProgressBar } from '../components/UI'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [stats, setStats] = useState({ total: 0, shortlisted: 0, rejected: 0, avg_score: 0 })
  const [recent, setRecent] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    jobsApi.list().then(r => setJobs(r.data)).catch(() => {})
    candidatesApi.stats().then(r => setStats(r.data)).catch(() => {})
    candidatesApi.list({ limit: 8 }).then(r => setRecent(r.data)).catch(() => {})
  }, [])

  const statCards = [
    { label: 'Total Resumes',   value: stats.total,        icon: '📄', bg: 'bg-blue-50'   },
    { label: 'Job Positions',   value: jobs.length,        icon: '💼', bg: 'bg-teal-50'   },
    { label: 'Shortlisted',     value: stats.shortlisted,  icon: '⭐', bg: 'bg-amber-50'  },
    { label: 'Avg Match Score', value: stats.avg_score + '%', icon: '🎯', bg: 'bg-purple-50' },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">AI-powered recruitment pipeline overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <StatCard key={i} {...s} />
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* Recent Candidates */}
        <div className="card lg:col-span-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Recent Candidates</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No candidates yet — upload resumes to get started.</p>
          ) : (
            <div className="space-y-3">
              {recent.map(c => (
                <div key={c.id} className="flex items-center gap-3">
                  <Avatar name={c.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                    <p className="text-xs text-gray-400 truncate">{c.email}</p>
                  </div>
                  <ScoreBadge score={c.overall_score} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Jobs summary */}
        <div className="card lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Job Positions</h2>
          {jobs.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-gray-400 mb-3">No jobs yet</p>
              <button onClick={() => navigate('/jobs')} className="btn-primary text-xs !px-3 !py-1.5">
                + Create Job
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 6).map(j => (
                <div
                  key={j.id}
                  className="cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  onClick={() => navigate('/candidates')}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">{j.title}</p>
                    <span className="text-teal-500 text-xs">→</span>
                  </div>
                  {j.location && <p className="text-xs text-gray-400">{j.location}</p>}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {j.extracted_skills.slice(0, 3).map((sk, i) => (
                      <span key={i} className="badge bg-teal-50 text-teal-700 text-[10px]">{sk}</span>
                    ))}
                    {j.extracted_skills.length > 3 && (
                      <span className="badge bg-gray-100 text-gray-500 text-[10px]">+{j.extracted_skills.length - 3}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
