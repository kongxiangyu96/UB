import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { clsx } from 'clsx'
import type { Message } from '@/types'

interface Props {
  message: Message
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={clsx('flex gap-3', isUser && 'flex-row-reverse')}>
      <div className={clsx(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-1',
        isUser ? 'bg-accent/30 text-accent' : 'bg-gray-700 text-gray-300'
      )}>
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={clsx(
        'max-w-[75%] rounded-2xl px-4 py-3 text-sm',
        isUser
          ? 'bg-accent/20 text-gray-100 rounded-tr-sm'
          : 'bg-surface-card text-gray-200 rounded-tl-sm border border-surface-border'
      )}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose-chat">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
