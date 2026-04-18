import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Users, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { jobsApi } from '../services/api'
import { EmptyState, Spinner } from '../components/UI'

export default function Jobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [mode, setMode] = useState('free')
  const [jdText, setJdText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [form, setForm] = useState({ title: '', skills: '', experience: '', location: '', notice_period: '' })
  const navigate = useNavigate()

  const load = () => jobsApi.list().then(r => { setJobs(r.data); setLoading(false) }).catch(() => setLoading(false))
  useEffect(() => { load() }, [])

  const submitFreeText = async () => {
    if (!jdText.trim()) return
    setParsing(true)
    try {
      const preview = await jobsApi.parsePreview(jdText)
      const p = preview.data
      await jobsApi.create({
        title: form.title || p.title || 'New Position',
        jd_text: jdText,
        extracted_skills: p.skills || [],
        experience_required: p.experience_required || '',
        experience_years: p.experience_years || 0,
        keywords: p.keywords || [],
        location: form.location,
        notice_period: form.notice_period,
        mode: 'free_text',
      })
      toast.success('Job position created!')
      setJdText(''); setShowForm(false); load()
    } catch (e) {
      toast.error('Failed to create job: ' + (e.response?.data?.detail || e.message))
    }
    setParsing(false)
  }

  const submitStructured = async () => {
    if (!form.title.trim()) return
    try {
      await jobsApi.create({
        title: form.title,
        jd_text: `Position: ${form.title}\nRequired Skills: ${form.skills}\nExperience: ${form.experience}\nLocation: ${form.location}\nNotice Period: ${form.notice_period}`,
        extracted_skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        experience_required: form.experience,
        experience_years: parseFloat(form.experience) || 0,
        location: form.location,
        notice_period: form.notice_period,
        mode: 'structured',
      })
      toast.success('Job position saved!')
      setForm({ title: '', skills: '', experience: '', location: '', notice_period: '' })
      setShowForm(false); load()
    } catch (e) {
      toast.error('Failed: ' + (e.response?.data?.detail || e.message))
    }
  }

  const deleteJob = async (id) => {
    if (!confirm('Delete this job and all its candidates?')) return
    await jobsApi.delete(id).catch(() => {})
    toast.success('Job deleted')
    load()
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size={32} /></div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Positions</h1>
          <p className="text-sm text-gray-500 mt-1">{jobs.length} position{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary">
          <Plus size={16} /> {showForm ? 'Cancel' : 'New Position'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card border-teal-200 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Create New Job Position</h3>

          {/* Mode Toggle */}
          <div className="flex mb-5 rounded-lg overflow-hidden border border-gray-200 w-fit">
            {[['free', '📝 Free Text JD'], ['structured', '📋 Structured Form']].map(([id, lbl]) => (
              <button key={id} onClick={() => setMode(id)}
                className={`px-4 py-2 text-sm transition-colors ${mode === id ? 'bg-gray-900 text-white font-medium' : 'bg-white text-gray-500 hover:text-gray-700'}`}>
                {lbl}
              </button>
            ))}
          </div>

          {mode === 'free' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Job Title (optional — AI will detect)</label>
                  <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior React Developer" />
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Bangalore, India" />
                </div>
              </div>
              <div>
                <label className="label">Paste Full Job Description *</label>
                <textarea
                  className="input h-44 resize-y"
                  value={jdText}
                  onChange={e => setJdText(e.target.value)}
                  placeholder="Paste the complete JD. Our NLP engine will extract skills, experience requirements, keywords..."
                />
              </div>
              <button onClick={submitFreeText} disabled={!jdText.trim() || parsing} className="btn-primary">
                {parsing ? <><Loader2 size={15} className="animate-spin" /> Parsing JD…</> : '🤖 Analyze & Save JD'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Job Title *</label>
                <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Full Stack Developer" />
              </div>
              <div className="col-span-2">
                <label className="label">Required Skills (comma-separated)</label>
                <input className="input" value={form.skills} onChange={e => setForm(p => ({ ...p, skills: e.target.value }))} placeholder="e.g. React, Node.js, MongoDB, TypeScript" />
              </div>
              <div>
                <label className="label">Min Experience</label>
                <input className="input" value={form.experience} onChange={e => setForm(p => ({ ...p, experience: e.target.value }))} placeholder="e.g. 3-5 years" />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Remote / Bangalore" />
              </div>
              <div>
                <label className="label">Notice Period</label>
                <input className="input" value={form.notice_period} onChange={e => setForm(p => ({ ...p, notice_period: e.target.value }))} placeholder="e.g. Immediate / 30 days" />
              </div>
              <div className="flex items-end">
                <button onClick={submitStructured} disabled={!form.title.trim()} className="btn-primary w-full justify-center">
                  💾 Save Position
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Jobs List */}
      {jobs.length === 0 && !showForm ? (
        <EmptyState
          icon="💼"
          title="No job positions yet"
          description="Create your first position to start screening resumes with AI."
          action={<button onClick={() => setShowForm(true)} className="btn-primary mx-auto">+ Create Job Position</button>}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map(j => (
            <div key={j.id} className="card flex items-start gap-4 hover:shadow-md transition-shadow">
              <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-xl flex-shrink-0">💼</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 mb-1">{j.title}</h3>
                <div className="flex flex-wrap gap-1 mb-2">
                  {j.extracted_skills.slice(0, 8).map((sk, i) => (
                    <span key={i} className="skill-tag">{sk}</span>
                  ))}
                  {j.extracted_skills.length > 8 && (
                    <span className="badge bg-gray-100 text-gray-500">+{j.extracted_skills.length - 8}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  {[j.experience_required && `Exp: ${j.experience_required}`, j.location, j.notice_period].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => navigate('/candidates', { state: { jobId: j.id } })}
                  className="btn-primary !px-3 !py-1.5 text-xs"
                >
                  <Users size={13} /> Candidates
                </button>
                <button onClick={() => deleteJob(j.id)} className="btn-ghost !px-3 !py-1.5 text-xs !text-red-500 !border-red-200 hover:!bg-red-50">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
