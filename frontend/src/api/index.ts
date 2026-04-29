import axios from 'axios'
import type { Persona, Document, Conversation, Message } from '@/types'

const http = axios.create({ baseURL: '/api' })

// Personas
export const getPersonas = () => http.get<Persona[]>('/personas').then(r => r.data)
export const createPersona = (data: Partial<Persona>) => http.post<Persona>('/personas', data).then(r => r.data)
export const updatePersona = (id: string, data: Partial<Persona>) =>
  http.put<Persona>(`/personas/${id}`, data).then(r => r.data)
export const deletePersona = (id: string) => http.delete(`/personas/${id}`)
export const generateSystemPrompt = (description: string) =>
  http.post<{ system_prompt: string }>('/personas/generate', { description }).then(r => r.data.system_prompt)

// Documents
export const getDocuments = () => http.get<Document[]>('/documents').then(r => r.data)
export const uploadDocument = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return http.post<Document>('/documents/upload', form).then(r => r.data)
}
export const deleteDocument = (id: string) => http.delete(`/documents/${id}`)

// Conversations
export const getConversations = (persona_id?: string) =>
  http.get<Conversation[]>('/conversations', { params: { persona_id } }).then(r => r.data)
export const createConversation = (persona_id: string, title?: string) =>
  http.post<Conversation>('/conversations', { persona_id, title }).then(r => r.data)
export const deleteConversation = (id: string) => http.delete(`/conversations/${id}`)
export const getMessages = (conversation_id: string) =>
  http.get<Message[]>(`/conversations/${conversation_id}/messages`).then(r => r.data)
