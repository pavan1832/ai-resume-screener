import { useState, useEffect, useCallback } from 'react'
import { jobsApi } from '../services/api'
import toast from 'react-hot-toast'

export function useJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await jobsApi.list()
      setJobs(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createJob = async (payload) => {
    const { data } = await jobsApi.create(payload)
    setJobs(prev => [data, ...prev])
    return data
  }

  const deleteJob = async (id) => {
    await jobsApi.delete(id)
    setJobs(prev => prev.filter(j => j.id !== id))
    toast.success('Job deleted')
  }

  return { jobs, loading, error, reload: load, createJob, deleteJob }
}
