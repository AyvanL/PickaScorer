import { Outlet } from 'react-router-dom'
import './App.css'

export default function App() {
  return (
    <div className="app-root">
      <main className="site-main">
        <Outlet />
      </main>
    </div>
  )
}
