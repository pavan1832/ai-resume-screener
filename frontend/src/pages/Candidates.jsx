import { useEffect, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { Upload, Loader2, Search, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import { jobsApi, candidatesApi } from '../services/api'
import { EmptyState, Spinner } from '../components/UI'
import CandidateCard from '../components/CandidateCard'
import CandidateModal from '../components/CandidateModal'
import FileDropzone from '../components/FileDropzone'

export default function Candidates() {
  const location = useLocation()
  const [jobs, setJobs] = useState([])
  const [jobId, setJobId] = useState(location.state?.jobId || '')
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState(null)
  const [tab, setTab] = useState('list')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ minScore: 0, status: 'all', search: '' })

  useEffect(() => { jobsApi.list().then(r => setJobs(r.data)).catch(() => {}) }, [])

  const load = useCallback(() => {
    if (!jobId) { setCandidates([]); return }
    setLoading(true)
    const params = { job_id: jobId }
    if (filters.status !== 'all') params.status = filters.status
    if (filters.minScore > 0) params.min_score = filters.minScore
    if (filters.search) params.search = filters.search
    candidatesApi.list(params)
      .then(r => { setCandidates(r.data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [jobId, filters])

  useEffect(() => { load() }, [load])

  const handleUpload = async () => {
    if (!jobId) { toast.error('Select a job first'); return }
    if (!files.length) { toast.error('Add at least one resume file'); return }
    setUploading(true); setProgress(0)
    try {
      const { data } = await candidatesApi.upload(jobId, files, e => {
        setProgress(Math.round((e.loaded / e.total) * 100))
      })
      toast.success(`Processed ${data.length} resume(s)!`)
      setFiles([]); setTab('list'); load()
    } catch (e) {
      toast.error('Upload failed: ' + (e.response?.data?.detail || e.message))
    }
    setUploading(false)
  }

  const handleUpdate = updated => {
    setCandidates(cs => cs.map(c => c.id === updated.id ? updated : c))
    setSelected(updated)
  }

  const quickAction = async (id, action) => {
    try {
      const { data } = await action(id)
      setCandidates(cs => cs.map(c => c.id === id ? data : c))
      toast.success(`Candidate ${data.status}`)
    } catch { toast.error('Action failed') }
  }

  const activeJob = jobs.find(j => j.id === jobId)

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>

        {/* Job selector */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          <label className="text-sm text-gray-500">Job:</label>
          <select
            className="input !w-auto min-w-[220px]"
            value={jobId}
            onChange={e => setJobId(e.target.value)}
          >
            <option value="">Select a job position…</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
          {activeJob && (
            <div className="flex flex-wrap gap-1">
              {activeJob.extracted_skills.slice(0, 5).map((sk, i) => (
                <span key={i} className="badge bg-teal-50 text-teal-700">{sk}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {!jobId ? (
        <EmptyState icon="👥" title="Select a Job Position" description="Choose a job from the dropdown above to manage and screen candidates." />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-0 mb-5 rounded-xl overflow-hidden border border-gray-200 w-fit">
            {[['upload', '📤 Upload Resumes'], ['list', `📋 Candidates (${candidates.length})`]].map(([id, lbl]) => (
              <button key={id} onClick={() => setTab(id)}
                className={`px-5 py-2.5 text-sm transition-colors ${tab === id ? 'bg-gray-900 text-white font-semibold' : 'bg-white text-gray-500 hover:text-gray-700'}`}>
                {lbl}
              </button>
            ))}
          </div>

          {tab === 'upload' ? (
            <div className="card max-w-2xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Upload Resume Files</h3>
              <FileDropzone
                files={files}
                onFiles={newFiles => setFiles(prev => [...prev, ...newFiles])}
                onRemove={i => setFiles(f => f.filter((_, idx) => idx !== i))}
              />

              {uploading && (
                <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <div className="flex justify-between text-xs font-medium text-teal-700 mb-2">
                    <span>AI Processing resumes…</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 bg-teal-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs text-teal-600 mt-2">Extracting skills, computing embeddings, calculating match scores…</p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={!files.length || uploading}
                className="btn-primary mt-4 !px-6 !py-2.5"
              >
                {uploading
                  ? <><Loader2 size={16} className="animate-spin" /> Processing…</>
                  : <><Upload size={16} /> Analyze {files.length} Resume{files.length !== 1 ? 's' : ''} with AI</>
                }
              </button>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div className="card mb-4 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    className="input !pl-8"
                    placeholder="Search by name or email…"
                    value={filters.search}
                    onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <SlidersHorizontal size={14} className="text-gray-400" />
                  <span className="text-xs text-gray-500 whitespace-nowrap">Min score:</span>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={filters.minScore}
                    onChange={e => setFilters(p => ({ ...p, minScore: +e.target.value }))}
                    className="w-24"
                  />
                  <span className="text-xs font-bold text-teal-600 w-8">{filters.minScore}%</span>
                </div>

                <select
                  className="input !w-auto"
                  value={filters.status}
                  onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="rejected">Rejected</option>
                </select>

                <span className="text-xs text-gray-400 ml-auto">{candidates.length} candidates</span>
              </div>

              {/* List */}
              {loading ? (
                <div className="flex justify-center py-12"><Spinner size={28} /></div>
              ) : candidates.length === 0 ? (
                <EmptyState
                  icon="📋"
                  title="No candidates yet"
                  description="Upload resumes in the 'Upload Resumes' tab to screen candidates with AI."
                  action={<button onClick={() => setTab('upload')} className="btn-primary mx-auto">Upload Resumes</button>}
                />
              ) : (
                <div className="space-y-2">
                  {candidates.map((c, i) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      rank={i + 1}
                      onView={() => setSelected(c)}
                      onShortlist={() => quickAction(c.id, candidatesApi.shortlist)}
                      onReject={() => quickAction(c.id, candidatesApi.reject)}
                      onPending={() => quickAction(c.id, candidatesApi.pending)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
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
