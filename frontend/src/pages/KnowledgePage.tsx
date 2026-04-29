import { useEffect, useRef, useState } from 'react'
import { Upload, Trash2, RefreshCw, FileText, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { getDocuments, uploadDocument, deleteDocument } from '@/api'
import type { Document } from '@/types'
import { clsx } from 'clsx'

const STATUS_ICON: Record<Document['status'], JSX.Element> = {
  pending: <Clock size={14} className="text-gray-500" />,
  processing: <Loader2 size={14} className="text-blue-400 animate-spin" />,
  done: <CheckCircle2 size={14} className="text-green-400" />,
  error: <XCircle size={14} className="text-red-400" />,
}

export default function KnowledgePage() {
  const [docs, setDocs] = useState<Document[]>([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = async () => setDocs(await getDocuments())

  useEffect(() => {
    load()
    // Poll while any doc is pending/processing
    const id = setInterval(() => {
      if (docs.some(d => d.status === 'pending' || d.status === 'processing')) load()
    }, 3000)
    return () => clearInterval(id)
  }, [docs])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const doc = await uploadDocument(file)
      setDocs(prev => [doc, ...prev])
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (id: string) => {
    await deleteDocument(id)
    setDocs(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-surface-border flex items-center justify-between">
        <div>
          <h1 className="font-semibold text-lg">Knowledge Base</h1>
          <p className="text-xs text-gray-500 mt-0.5">Upload PDF documents to power RAG for all personas</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg hover:bg-surface-hover text-gray-500 hover:text-gray-300 transition">
            <RefreshCw size={15} />
          </button>
          <label className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer',
            'bg-accent hover:bg-accent-hover text-white',
            uploading && 'opacity-60 cursor-not-allowed'
          )}>
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Upload PDF
            <input ref={inputRef} type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-600 gap-3">
            <FileText size={48} strokeWidth={1} />
            <p className="text-sm">No documents yet. Upload a PDF to get started.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 bg-surface-card border border-surface-border rounded-xl px-4 py-3 group">
                <FileText size={16} className="text-gray-500 shrink-0" />
                <span className="flex-1 text-sm text-gray-200 truncate">{doc.filename}</span>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  {STATUS_ICON[doc.status]}
                  <span className="capitalize">{doc.status}</span>
                </div>
                {doc.error_msg && (
                  <span className="text-xs text-red-400 max-w-[200px] truncate" title={doc.error_msg}>
                    {doc.error_msg}
                  </span>
                )}
                <span className="text-xs text-gray-600">
                  {new Date(doc.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-surface-hover text-gray-500 hover:text-red-400 transition"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
