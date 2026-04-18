import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min for AI processing
})

// ─── Jobs ──────────────────────────────────────────────────────────────────
export const jobsApi = {
  list: ()                   => api.get('/jobs/'),
  get:  (id)                 => api.get(`/jobs/${id}`),
  create: (data)             => api.post('/jobs/', data),
  delete: (id)               => api.delete(`/jobs/${id}`),
  parsePreview: (jdText)     => api.post('/jobs/parse-jd', { jd_text: jdText }),
}

// ─── Candidates ────────────────────────────────────────────────────────────
export const candidatesApi = {
  upload: (jobId, files, onProgress) => {
    const form = new FormData()
    form.append('job_id', jobId)
    files.forEach(f => form.append('files', f))
    return api.post('/candidates/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
  },
  list: (params) => api.get('/candidates/', { params }),
  get:  (id)     => api.get(`/candidates/${id}`),
  stats: (jobId) => api.get('/candidates/stats', { params: jobId ? { job_id: jobId } : {} }),
  shortlist: (id) => api.post(`/candidates/${id}/shortlist`),
  reject:    (id) => api.post(`/candidates/${id}/reject`),
  pending:   (id) => api.post(`/candidates/${id}/pending`),
  delete:    (id) => api.delete(`/candidates/${id}`),
}

// ─── Export ────────────────────────────────────────────────────────────────
export const exportApi = {
  csv: (params) => {
    const qs = new URLSearchParams(params).toString()
    window.open(`/api/export/csv?${qs}`, '_blank')
  },
  excel: (params) => {
    const qs = new URLSearchParams(params).toString()
    window.open(`/api/export/excel?${qs}`, '_blank')
  },
}

export default api
