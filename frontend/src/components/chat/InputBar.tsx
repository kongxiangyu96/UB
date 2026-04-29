import { useState, useRef, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'
import { useChatStore } from '@/store/chatStore'

interface Props {
  onSend: (content: string) => void
}

export default function InputBar({ onSend }: Props) {
  const [value, setValue] = useState('')
  const { isStreaming } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const content = value.trim()
    if (!content || isStreaming) return
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    onSend(content)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div className="px-6 py-4 border-t border-surface-border">
      <div className="flex items-end gap-3 bg-surface-card border border-surface-border rounded-xl px-4 py-3 focus-within:border-accent transition">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          rows={1}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-600 resize-none focus:outline-none leading-6 max-h-48"
        />
        <button
          onClick={handleSend}
          disabled={!value.trim() || isStreaming}
          className="p-2 rounded-lg bg-accent hover:bg-accent-hover disabled:opacity-40 transition shrink-0"
        >
          {isStreaming ? <Loader2 size={16} className="animate-spin text-white" /> : <Send size={16} className="text-white" />}
        </button>
      </div>
      <p className="text-xs text-gray-600 text-center mt-2">AI can make mistakes. Verify important information.</p>
    </div>
  )
}
