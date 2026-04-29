import { useEffect, useState } from 'react'
import { useNavigate, useParams, NavLink } from 'react-router-dom'
import { Plus, BookOpen, Trash2, MessageSquare } from 'lucide-react'
import { usePersonaStore } from '@/store/personaStore'
import { useChatStore } from '@/store/chatStore'
import PersonaForm from '@/components/persona/PersonaForm'
import type { Persona } from '@/types'
import { clsx } from 'clsx'

export default function Sidebar() {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const { personas, fetch: fetchPersonas } = usePersonaStore()
  const { conversations, fetchConversations, newConversation, removeConversation } = useChatStore()
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editPersona, setEditPersona] = useState<Persona | null>(null)

  useEffect(() => { fetchPersonas() }, [fetchPersonas])

  const handleSelectPersona = async (persona: Persona) => {
    setSelectedPersona(persona)
    await fetchConversations(persona.id)
  }

  const handleNewChat = async () => {
    if (!selectedPersona) return
    const conv = await newConversation(selectedPersona.id)
    navigate(`/chat/${conv.id}`)
  }

  return (
    <aside className="w-64 flex flex-col bg-surface-card border-r border-surface-border shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
        <span className="font-semibold text-sm text-gray-100">UB Personas</span>
        <button
          onClick={() => { setEditPersona(null); setShowForm(true) }}
          className="p-1.5 rounded-md hover:bg-surface-hover text-gray-400 hover:text-gray-200 transition-colors"
          title="New Persona"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Persona list */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-2 space-y-0.5">
          {personas.map(p => (
            <div
              key={p.id}
              className={clsx(
                'group flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors',
                selectedPersona?.id === p.id ? 'bg-surface-hover text-gray-100' : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200'
              )}
              onClick={() => handleSelectPersona(p)}
            >
              <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-bold shrink-0">
                {p.name[0]?.toUpperCase()}
              </div>
              <span className="text-sm flex-1 truncate">{p.name}</span>
              <button
                onClick={e => { e.stopPropagation(); setEditPersona(p); setShowForm(true) }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:text-gray-100 transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Conversations for selected persona */}
        {selectedPersona && (
          <div className="mt-2 border-t border-surface-border px-2 py-2">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-xs text-gray-500 uppercase tracking-wide">Chats</span>
              <button onClick={handleNewChat} className="p-1 rounded hover:bg-surface-hover text-gray-500 hover:text-gray-300 transition">
                <Plus size={12} />
              </button>
            </div>
            <div className="space-y-0.5">
              {conversations.map(c => (
                <div
                  key={c.id}
                  className={clsx(
                    'group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors',
                    conversationId === c.id ? 'bg-accent/20 text-accent' : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200'
                  )}
                  onClick={() => navigate(`/chat/${c.id}`)}
                >
                  <MessageSquare size={12} className="shrink-0" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <button
                    onClick={e => { e.stopPropagation(); removeConversation(c.id).then(() => navigate('/chat')) }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:text-red-400 transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="border-t border-surface-border p-2">
        <NavLink
          to="/knowledge"
          className={({ isActive }) =>
            clsx('flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              isActive ? 'bg-surface-hover text-gray-100' : 'text-gray-400 hover:bg-surface-hover hover:text-gray-200')
          }
        >
          <BookOpen size={15} />
          Knowledge Base
        </NavLink>
      </div>

      {showForm && (
        <PersonaForm
          persona={editPersona}
          onClose={() => setShowForm(false)}
          onSaved={(p) => { setShowForm(false); setSelectedPersona(p) }}
        />
      )}
    </aside>
  )
}
