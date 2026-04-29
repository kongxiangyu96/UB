import { create } from 'zustand'
import type { Persona } from '@/types'
import * as api from '@/api'

interface PersonaStore {
  personas: Persona[]
  loading: boolean
  fetch: () => Promise<void>
  add: (data: Partial<Persona>) => Promise<Persona>
  update: (id: string, data: Partial<Persona>) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const usePersonaStore = create<PersonaStore>((set, get) => ({
  personas: [],
  loading: false,

  fetch: async () => {
    set({ loading: true })
    const personas = await api.getPersonas()
    set({ personas, loading: false })
  },

  add: async (data) => {
    const persona = await api.createPersona(data)
    set(s => ({ personas: [persona, ...s.personas] }))
    return persona
  },

  update: async (id, data) => {
    const updated = await api.updatePersona(id, data)
    set(s => ({ personas: s.personas.map(p => p.id === id ? updated : p) }))
  },

  remove: async (id) => {
    await api.deletePersona(id)
    set(s => ({ personas: s.personas.filter(p => p.id !== id) }))
  },
}))
