import { useDropzone } from 'react-dropzone'
import { Upload, File, X } from 'lucide-react'

export default function FileDropzone({ files, onFiles, onRemove }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
    },
    onDrop: accepted => onFiles(accepted),
    multiple: true,
  })

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${isDragActive
            ? 'border-teal-500 bg-teal-50'
            : 'border-gray-200 bg-gray-50 hover:border-teal-400 hover:bg-teal-50/50'
          }
        `}
      >
        <input {...getInputProps()} />
        <Upload size={32} className={`mx-auto mb-3 ${isDragActive ? 'text-teal-500' : 'text-gray-400'}`} />
        <p className="text-sm font-medium text-gray-700">
          {isDragActive ? 'Drop resumes here…' : 'Drag & drop resumes here'}
        </p>
        <p className="text-xs text-gray-400 mt-1">or click to browse · PDF, DOCX · max 10 MB each</p>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {files.length} file{files.length > 1 ? 's' : ''} selected
          </p>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <File size={15} className="text-teal-500 flex-shrink-0" />
              <span className="flex-1 text-sm text-gray-700 truncate">{f.name}</span>
              <span className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => onRemove(i)} className="text-gray-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
