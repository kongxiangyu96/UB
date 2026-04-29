import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { usePersonaStore } from '@/store/personaStore'
import { generateSystemPrompt } from '@/api'
import type { Persona } from '@/types'

interface Props {
  persona: Persona | null
  onClose: () => void
  onSaved: (p: Persona) => void
}

export default function PersonaForm({ persona, onClose, onSaved }: Props) {
  const { add, update } = usePersonaStore()
  const [name, setName] = useState(persona?.name ?? '')
  const [description, setDescription] = useState(persona?.description ?? '')
  const [systemPrompt, setSystemPrompt] = useState(persona?.system_prompt ?? '')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (persona) {
      setName(persona.name)
      setDescription(persona.description)
      setSystemPrompt(persona.system_prompt)
    }
  }, [persona])

  const handleGenerate = async () => {
    if (!description.trim()) return
    setGenerating(true)
    try {
      const prompt = await generateSystemPrompt(description)
      setSystemPrompt(prompt)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      let saved: Persona
      if (persona) {
        await update(persona.id, { name, description, system_prompt: systemPrompt })
        saved = { ...persona, name, description, system_prompt: systemPrompt }
      } else {
        saved = await add({ name, description, system_prompt: systemPrompt })
      }
      onSaved(saved)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-card border border-surface-border rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-lg">{persona ? 'Edit Persona' : 'New Persona'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface-hover text-gray-400 hover:text-gray-200 transition">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Dr. Ada — AI Researcher"
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent transition"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Describe this persona's role, expertise, personality..."
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent transition resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-gray-400">System Prompt</label>
              <button
                onClick={handleGenerate}
                disabled={generating || !description.trim()}
                className="flex items-center gap-1.5 text-xs text-accent hover:text-accent-hover disabled:opacity-40 transition"
              >
                {generating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                AI Generate
              </button>
            </div>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              rows={6}
              placeholder="You are..."
              className="w-full bg-surface border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-accent transition resize-none font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg border border-surface-border text-gray-400 hover:text-gray-200 hover:bg-surface-hover transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="px-4 py-2 text-sm rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 text-white font-medium transition flex items-center gap-2"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
