import React from 'react';
import { Link, useLocation } from 'react-router-dom';

function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center gap-8">
      <div className="text-green-400 font-bold text-xl tracking-tight">
        ● Prise<span className="text-white">Pulse</span>
      </div>
      <div className="flex gap-2">
        {[
          { path: '/',          label: 'Markets'   },
          { path: '/portfolio', label: 'Portfolio' },
          { path: '/news',      label: 'News'      },
          { path: '/watchlist', label: 'Watchlist' },
        ].map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === item.path
                ? 'bg-green-400/10 text-green-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default Navbar;