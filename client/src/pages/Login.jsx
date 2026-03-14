import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm]         = useState({ name: '', email: '', password: '' });
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const navigate                = useNavigate();

    const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
        const url = isSignup
        ? `${process.env.REACT_APP_API_URL}/api/auth/signup`
        : `${process.env.REACT_APP_API_URL}/api/auth/login`;
        const body = isSignup
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

        console.log('Sending to:', url, body);
        const { data } = await axios.post(url, body);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user',  JSON.stringify(data.user));
        navigate('/');
    } catch (err) {
        console.log('Full error:', err);
        setError(err.response?.data?.error || err.message || 'Something went wrong');
    }
    setLoading(false);
    };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-green-400 font-bold text-2xl mb-1">● Prise<span className="text-white">Pulse</span></div>
          <p className="text-gray-400 text-sm">{isSignup ? 'Create your account' : 'Welcome back'}</p>
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-green-400 transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-green-400 transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-green-400 transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-400 text-gray-950 font-bold py-3 rounded-lg text-sm hover:bg-green-300 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-green-400 ml-1 hover:underline"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </p>

      </div>
    </div>
  );
}

export default Login;