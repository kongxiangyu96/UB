import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import { useChatStore } from '@/store/chatStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatWindow() {
  const { messages, streamingContent, isStreaming } = useChatStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
      {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}

      {isStreaming && (
        <div className="flex gap-3">
          <div className="w-7 h-7 rounded-full bg-gray-700 text-gray-300 flex items-center justify-center text-xs font-bold shrink-0 mt-1">
            AI
          </div>
          <div className="max-w-[75%] rounded-2xl rounded-tl-sm px-4 py-3 bg-surface-card border border-surface-border text-sm text-gray-200">
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {streamingContent || '▋'}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
