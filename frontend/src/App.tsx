import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import ChatPage from '@/pages/ChatPage'
import KnowledgePage from '@/pages/KnowledgePage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
      </Route>
    </Routes>
  )
}
