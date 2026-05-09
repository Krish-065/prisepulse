import React from 'react';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('user')) || { name: 'Demo User', email: 'demo@prisepulse.com' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account settings and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 text-center shadow-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
              <span className="text-3xl text-white font-bold">{user.name[0].toUpperCase()}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{user.email}</p>
            <span className="inline-block mt-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full">Pro Member</span>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            {['Account Settings', 'Preferences', 'Security', 'Billing', 'API Keys'].map((item, i) => (
              <button key={item} className={`w-full text-left px-6 py-4 text-sm font-medium transition-colors ${i === 0 ? 'border-l-4 border-primary bg-gray-50 dark:bg-gray-800/50 text-foreground' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 border-l-4 border-transparent'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Personal Information</h3>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                  <input type="text" defaultValue={user.name} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                  <input type="email" defaultValue={user.email} className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" disabled />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                <input type="tel" placeholder="+91 9876543210" className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-foreground px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <button type="button" className="bg-primary hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">
                Save Changes
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-foreground mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Connected Accounts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Connect your social accounts for quick login across devices.</p>
            <div className="space-y-3">
              {['Google', 'Apple', 'Facebook', 'X (Twitter)'].map((provider) => (
                <div key={provider} className="flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <span className="font-medium text-foreground">{provider}</span>
                  <button className="text-sm font-bold text-primary hover:text-emerald-600 transition-colors">
                    {provider === 'Google' ? 'Connected' : 'Connect'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
