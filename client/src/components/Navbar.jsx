import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import TickerTape from './TickerTape';
import ThemeToggle from './ThemeToggle';

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
    { path: '/stock/RELIANCE.NS', label: 'Charts', icon: '📊' },
    { path: '/news',      label: 'News',         icon: '📰' },
    { path: '/crypto',    label: 'Crypto',       icon: '₿'  },
    { path: '/mf',        label: 'Mutual Funds', icon: '📊' },
    { path: '/paper-trading', label: 'Paper Trading', icon: '📝' },
    { path: '/ipotracker',label: 'IPO Tracker',  icon: '🚀' },
    { path: '/screener',  label: 'Screener',     icon: '🔍' },
    { path: '/watchlist', label: 'Watchlist',    icon: '⭐' },
    { path: '/portfolio', label: 'Portfolio',    icon: '💼' },
    { path: '/tools',     label: 'Tools',        icon: '🛠' },
  ];

  return (
    <div className="sticky top-0 z-50">
      <TickerTape />
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-2.5 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-3 max-w-7xl mx-auto">

          <Link to="/" className="flex items-center gap-1.5 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center shadow-lg">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <polyline points="1,12 5,7 8,10 11,5 15,3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <span className="text-foreground font-extrabold text-lg tracking-tight font-sans">
              Prise<span className="text-primary">Pulse</span>
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
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ' +
                    (active
                      ? 'bg-primary/10 text-primary dark:text-primary dark:bg-primary/20'
                      : 'text-gray-600 dark:text-gray-400 hover:text-foreground dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50')
                  }
                >
                  <span className="text-sm leading-none">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-3 flex-shrink-0">
            <ThemeToggle />
            {token && user ? (
              <>
                <Link to="/profile" className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer">
                  <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
                  </div>
                  <span className="text-foreground dark:text-gray-300 text-sm font-medium">{user.name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-4 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-400/10 hover:border-red-200 dark:hover:border-red-400/40 hover:text-red-500 dark:hover:text-red-400 transition-all"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="text-sm bg-gradient-to-r from-primary to-emerald-400 text-white font-bold px-5 py-2 rounded-lg hover:shadow-lg hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5"
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