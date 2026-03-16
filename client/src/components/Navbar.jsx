import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Navbar() {
  var location = useLocation();
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
    { path: '/',          label: 'Markets'      },
    { path: '/news',      label: 'News'         },
    { path: '/crypto',    label: 'Crypto'       },
    { path: '/mf',        label: 'Mutual Funds' },
    { path: '/watchlist', label: 'Watchlist'    },
    { path: '/portfolio', label: 'Portfolio'    },
    { path: '/tools',     label: 'Tools'        },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-3 max-w-7xl mx-auto">

        <Link to="/" className="text-green-400 font-bold text-lg tracking-tight flex-shrink-0">
          Prise<span className="text-white">Pulse</span>
        </Link>

        <div className="hidden md:flex gap-1 flex-1 flex-wrap">
          {links.map(function(item) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className={
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all ' +
                  (location.pathname === item.path
                    ? 'bg-green-400/10 text-green-400'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800')
                }
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {token && user ? (
            <>
              <span className="text-gray-400 text-xs hidden md:block font-mono">
                {user.name}
              </span>
              <button
                onClick={logout}
                className="text-xs bg-gray-800 border border-gray-700 text-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-xs bg-green-400 text-gray-950 font-bold px-3 py-1.5 rounded-lg hover:bg-green-300 transition-colors"
            >
              Login
            </Link>
          )}

          <button
            className="md:hidden text-gray-400 hover:text-white text-xs border border-gray-700 px-2 py-1.5 rounded-lg"
            onClick={function() { setMenuOpen(!menuOpen); }}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-2 flex flex-col gap-1 max-w-7xl mx-auto">
          {links.map(function(item) {
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={function() { setMenuOpen(false); }}
                className={
                  'px-3 py-2 rounded-lg text-sm ' +
                  (location.pathname === item.path
                    ? 'bg-green-400/10 text-green-400'
                    : 'text-gray-400 hover:text-white')
                }
              >
                {item.label}
              </Link>
            );
          })}
          {token && user ? (
            <button
              onClick={logout}
              className="text-left px-3 py-2 text-red-400 text-sm"
            >
              Logout ({user.name})
            </button>
          ) : (
            <Link
              to="/login"
              onClick={function() { setMenuOpen(false); }}
              className="px-3 py-2 text-green-400 text-sm font-medium"
            >
              Login / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;