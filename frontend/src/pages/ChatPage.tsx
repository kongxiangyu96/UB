import { useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'
import { usePersonaStore } from '@/store/personaStore'
import ChatWindow from '@/components/chat/ChatWindow'
import InputBar from '@/components/chat/InputBar'
import { useChat } from '@/hooks/useChat'

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const { setActiveConversation, messages, activeConversationId } = useChatStore()
  const { personas } = usePersonaStore()
  const { sendMessage } = useChat(conversationId ?? null)

  useEffect(() => {
    if (conversationId && conversationId !== activeConversationId) {
      setActiveConversation(conversationId)
    }
  }, [conversationId, activeConversationId, setActiveConversation])

  const handleSend = useCallback((content: string) => {
    if (!conversationId) return
    // Optimistically add user message to store
    useChatStore.setState(s => ({
      messages: [...s.messages, {
        id: crypto.randomUUID(),
        conversation_id: conversationId,
        role: 'user',
        content,
        created_at: new Date().toISOString(),
      }],
    }))
    sendMessage(content, useChatStore.getState().messages.at(-1)!)
  }, [conversationId, sendMessage])

  if (!conversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-600 gap-3">
        <MessageSquare size={48} strokeWidth={1} />
        <p className="text-sm">Select or create a conversation to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <ChatWindow />
      <InputBar onSend={handleSend} />
    </div>
  )
}
