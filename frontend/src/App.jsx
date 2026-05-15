import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'

function Home() {
  return (
    <div style={{ padding: '20px', color: 'white', background: '#0a0e27', minHeight: '100vh' }}>
      <h1>PricePulse</h1>
      <p>If you see this, the app is rendering correctly.</p>
      <p>Your backend API should be at: {import.meta.env.VITE_API_URL}</p>
      <nav>
        <Link to="/dashboard" style={{ color: '#00ff88', marginRight: '10px' }}>Dashboard</Link>
        <Link to="/login" style={{ color: '#00ff88' }}>Login</Link>
      </nav>
    </div>
  )
}

function Dashboard() {
  return <div style={{ padding: '20px', color: 'white' }}>Dashboard – coming soon</div>
}

function Login() {
  return <div style={{ padding: '20px', color: 'white' }}>Login page – coming soon</div>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App