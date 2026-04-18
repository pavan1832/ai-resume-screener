import { useState, useEffect, useCallback } from 'react'
import { candidatesApi } from '../services/api'
import toast from 'react-hot-toast'

export function useCandidates(jobId, filters = {}) {
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ total: 0, shortlisted: 0, rejected: 0, avg_score: 0 })

  const load = useCallback(async () => {
    if (!jobId) { setCandidates([]); return }
    setLoading(true)
    try {
      const params = { job_id: jobId }
      if (filters.status && filters.status !== 'all') params.status = filters.status
      if (filters.minScore > 0) params.min_score = filters.minScore
      if (filters.search) params.search = filters.search
      const [cr, sr] = await Promise.all([
        candidatesApi.list(params),
        candidatesApi.stats(jobId),
      ])
      setCandidates(cr.data)
      setStats(sr.data)
    } catch (e) {
      console.error('Failed to load candidates:', e)
    } finally {
      setLoading(false)
    }
  }, [jobId, filters.status, filters.minScore, filters.search])

  useEffect(() => { load() }, [load])

  const updateCandidate = (updated) => {
    setCandidates(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const shortlist = async (id) => {
    const { data } = await candidatesApi.shortlist(id)
    updateCandidate(data)
    toast.success('Candidate shortlisted ⭐')
    return data
  }

  const reject = async (id) => {
    const { data } = await candidatesApi.reject(id)
    updateCandidate(data)
    toast('Candidate rejected')
    return data
  }

  const resetPending = async (id) => {
    const { data } = await candidatesApi.pending(id)
    updateCandidate(data)
    return data
  }

  const remove = async (id) => {
    await candidatesApi.delete(id)
    setCandidates(prev => prev.filter(c => c.id !== id))
    toast.success('Candidate removed')
  }

  return { candidates, loading, stats, reload: load, shortlist, reject, resetPending, remove, updateCandidate }
}
