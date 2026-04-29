import { useEffect, useRef, useCallback } from 'react'
import type { WsFrame } from '@/types'
import { useChatStore } from '@/store/chatStore'

const WS_BASE = import.meta.env.VITE_WS_BASE_URL || ''

export function useChat(conversationId: string | null) {
  const ws = useRef<WebSocket | null>(null)
  const accRef = useRef('')
  const { appendToken, finalizeStream, resetStream } = useChatStore()

  const connect = useCallback((id: string) => {
    if (ws.current) ws.current.close()
    accRef.current = ''

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = WS_BASE || `${proto}//${window.location.host}`
    const url = `${host}/ws/chat?conversation_id=${id}`
    const socket = new WebSocket(url)

    socket.onmessage = (e) => {
      const frame: WsFrame = JSON.parse(e.data)
      if (frame.type === 'token') {
        accRef.current += frame.content
        appendToken(frame.content)
      } else if (frame.type === 'done') {
        finalizeStream(accRef.current)
        accRef.current = ''
      } else if (frame.type === 'error') {
        console.error('WS error frame:', frame.content)
        resetStream()
      }
    }

    socket.onclose = () => { ws.current = null }
    ws.current = socket
  }, [appendToken, finalizeStream, resetStream])

  useEffect(() => {
    if (conversationId) connect(conversationId)
    return () => { ws.current?.close() }
  }, [conversationId, connect])

  const sendMessage = useCallback((content: string, userMessage: ReturnType<typeof useChatStore.getState>['messages'][0]) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      if (conversationId) connect(conversationId)
      setTimeout(() => ws.current?.send(JSON.stringify({ type: 'message', content })), 300)
      return
    }
    ws.current.send(JSON.stringify({ type: 'message', content }))
  }, [conversationId, connect])

  return { sendMessage }
}
