import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

var API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Login() {
  var [isSignup, setIsSignup] = useState(false);
  var [form, setForm]         = useState({ name: '', email: '', password: '' });
  var [error, setError]       = useState('');
  var [loading, setLoading]   = useState(false);
  var navigate                = useNavigate();

  useEffect(function() {
    var token = localStorage.getItem('token');
    if (token) navigate('/');
  }, [navigate]);

  var handleSubmit = async function() {
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    if (isSignup && !form.name) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    setError('');
    try {
      var url  = isSignup
        ? API + '/api/auth/signup'
        : API + '/api/auth/login';
      var body = isSignup
        ? { name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      var res = await axios.post(url, body);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user',  JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(
        err.response && err.response.data && err.response.data.error
          ? err.response.data.error
          : err.message || 'Something went wrong'
      );
    }
    setLoading(false);
  };

  var handleKey = function(e) {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-md">

        <div className="text-center mb-8">
          <div className="text-green-400 font-bold text-3xl mb-2 tracking-tight">
            PrisePulse
          </div>
          <p className="text-gray-400 text-sm">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </p>
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/30 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isSignup && (
            <div>
              <label className="text-gray-400 text-xs font-mono block mb-1">FULL NAME</label>
              <input
                type="text"
                placeholder="Your name"
                value={form.name}
                onChange={function(e) { setForm({ ...form, name: e.target.value }); }}
                onKeyDown={handleKey}
                className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-gray-400 text-xs font-mono block mb-1">EMAIL</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={function(e) { setForm({ ...form, email: e.target.value }); }}
              onKeyDown={handleKey}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <div>
            <label className="text-gray-400 text-xs font-mono block mb-1">PASSWORD</label>
            <input
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={function(e) { setForm({ ...form, password: e.target.value }); }}
              onKeyDown={handleKey}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm w-full outline-none focus:border-green-400 transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-400 text-gray-950 font-bold py-3 rounded-lg text-sm hover:bg-green-300 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Login'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          {isSignup ? 'Already have an account?' : 'New to PrisePulse?'}
          <button
            onClick={function() { setIsSignup(!isSignup); setError(''); }}
            className="text-green-400 ml-1 hover:underline font-medium"
          >
            {isSignup ? 'Login' : 'Create Account'}
          </button>
        </p>

        {!isSignup && (
          <div className="mt-6 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <p className="text-gray-500 text-xs text-center font-mono">
              Markets, News, Crypto and Tools are available without login.
              Login required for Portfolio and Watchlist.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Login;