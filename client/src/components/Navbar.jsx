import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TickerTape from './TickerTape';

function Navbar() {
  var location  = useLocation();
  var navigate  = useNavigate();
  var [menuOpen, setMenuOpen] = useState(false);

  var user  = localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user'))
    : null;
  var token = localStorage.getItem('token');

  var logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  var links = [
    { path: '/',          label: 'Markets',      icon: '📈' },
    { path: '/news',      label: 'News',         icon: '📰' },
    { path: '/crypto',    label: 'Crypto',       icon: '₿'  },
    { path: '/mf',        label: 'Mutual Funds', icon: '📊' },
    { path: '/ipo',       label: 'IPO',          icon: '🚀' },
    { path: '/screener',  label: 'Screener',     icon: '🔍' },
    { path: '/watchlist', label: 'Watchlist',    icon: '⭐' },
    { path: '/portfolio', label: 'Portfolio',    icon: '💼' },
    { path: '/tools',     label: 'Tools',        icon: '🛠' },
  ];

  return (
    <div className="sticky top-0 z-50">
      <TickerTape />
      <nav className="bg-gray-900/95 backdrop-blur border-b border-gray-800 px-4 py-2.5">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">

          <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-7 h-7 bg-green-400 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <polyline points="1,12 5,7 8,10 11,5 15,3" stroke="#111" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="text-green-400 font-bold text-base tracking-tight font-mono">
              Prise<span className="text-white">Pulse</span>
            </span>
          </Link>

          <div className="hidden lg:flex gap-0.5 flex-1 flex-wrap">
            {links.map(function(item) {
              var active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={
                    'px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ' +
                    (active
                      ? 'bg-green-400/15 text-green-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800')
                  }
                >
                  <span className="text-xs leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {token && user ? (
              <>
                <div className="hidden md:flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5">
                  <div className="w-5 h-5 bg-green-400/20 rounded-full flex items-center justify-center">
                    <span className="text-green-400 text-xs font-bold">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                  </div>
                  <span className="text-gray-300 text-xs font-mono">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-xs text-gray-400 border border-gray-700 px-3 py-1.5 rounded-lg hover:bg-red-400/10 hover:border-red-400/40 hover:text-red-400 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-xs bg-green-400 text-gray-950 font-bold px-4 py-1.5 rounded-lg hover:bg-green-300 transition-colors"
              >
                Login
              </Link>
            )}

            <button
              className="lg:hidden text-gray-400 hover:text-white text-xs border border-gray-700 px-2.5 py-1.5 rounded-lg transition-colors"
              onClick={function() { setMenuOpen(!menuOpen); }}
            >
              {menuOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lg:hidden mt-2 pb-2 border-t border-gray-800 pt-2 max-w-7xl mx-auto">
            <div className="grid grid-cols-3 gap-1">
              {links.map(function(item) {
                var active = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={function() { setMenuOpen(false); }}
                    className={
                      'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors ' +
                      (active ? 'bg-green-400/15 text-green-400' : 'text-gray-400 hover:text-white hover:bg-gray-800')
                    }
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
            {token && user ? (
              <button
                onClick={logout}
                className="mt-2 w-full text-left px-3 py-2 text-red-400 text-xs border-t border-gray-800 pt-2"
              >
                Logout ({user.name})
              </button>
            ) : (
              <Link
                to="/login"
                onClick={function() { setMenuOpen(false); }}
                className="mt-2 block px-3 py-2 text-green-400 text-xs font-medium border-t border-gray-800 pt-2"
              >
                Login / Sign Up
              </Link>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}

export default Navbar;