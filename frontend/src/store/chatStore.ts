import { create } from 'zustand'
import type { Conversation, Message } from '@/types'
import * as api from '@/api'

interface ChatStore {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Message[]
  streamingContent: string
  isStreaming: boolean
  fetchConversations: (personaId?: string) => Promise<void>
  setActiveConversation: (id: string) => Promise<void>
  newConversation: (personaId: string) => Promise<Conversation>
  removeConversation: (id: string) => Promise<void>
  appendToken: (token: string) => void
  finalizeStream: (fullContent: string) => void
  resetStream: () => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  streamingContent: '',
  isStreaming: false,

  fetchConversations: async (personaId) => {
    const conversations = await api.getConversations(personaId)
    set({ conversations })
  },

  setActiveConversation: async (id) => {
    set({ activeConversationId: id, messages: [], streamingContent: '', isStreaming: false })
    const messages = await api.getMessages(id)
    set({ messages })
  },

  newConversation: async (personaId) => {
    const conv = await api.createConversation(personaId)
    set(s => ({ conversations: [conv, ...s.conversations], activeConversationId: conv.id, messages: [] }))
    return conv
  },

  removeConversation: async (id) => {
    await api.deleteConversation(id)
    set(s => ({
      conversations: s.conversations.filter(c => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
      messages: s.activeConversationId === id ? [] : s.messages,
    }))
  },

  appendToken: (token) => set(s => ({ streamingContent: s.streamingContent + token, isStreaming: true })),

  finalizeStream: (fullContent) => {
    const conversationId = get().activeConversationId
    if (!conversationId) return
    const msg: Message = {
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      role: 'assistant',
      content: fullContent,
      created_at: new Date().toISOString(),
    }
    set(s => ({ messages: [...s.messages, msg], streamingContent: '', isStreaming: false }))
  },

  resetStream: () => set({ streamingContent: '', isStreaming: false }),
}))
