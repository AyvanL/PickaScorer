import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import SignUp from './pages/SignUp'
import Login from './pages/Login.tsx'
import Homepage from './pages/Homepage'
import Remote from './pages/Remote.tsx'
import Display from './pages/Display.tsx'
import ProtectedRoute from './ProtectedRoute'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Navigate to="/login" replace />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<ProtectedRoute><Homepage /></ProtectedRoute>} />
          <Route path="remote" element={<ProtectedRoute><Remote /></ProtectedRoute>} />
          <Route path="display" element={<ProtectedRoute><Display /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
