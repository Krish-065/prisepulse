import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0e27', 
      color: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'column',
      fontFamily: 'sans-serif'
    }}>
      <h1>PricePulse</h1>
      <p>Professional Trading Platform</p>
      <p style={{ marginTop: '20px' }}>If you see this, the app is working!</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;