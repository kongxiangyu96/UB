export interface Persona {
  id: string
  name: string
  description: string
  system_prompt: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  filename: string
  oss_path: string | null
  status: 'pending' | 'processing' | 'done' | 'error'
  error_msg: string | null
  created_at: string
}

export interface Conversation {
  id: string
  persona_id: string
  title: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type WsFrame =
  | { type: 'token'; content: string }
  | { type: 'done'; content: string }
  | { type: 'error'; content: string }
