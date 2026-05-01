import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Homepage from './pages/Homepage'
import Remote from './pages/Remote'
import Display from './pages/Display'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
            <Route index element={<Navigate to="/login" replace />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={<Homepage />} />
          <Route path="remote" element={<Remote />} />
          <Route path="display" element={<Display />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
