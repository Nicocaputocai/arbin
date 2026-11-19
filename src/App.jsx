import React, { useState } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('arbin_user');
    const token = localStorage.getItem('arbin_token');
    if (saved && token) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem('arbin_token');
    localStorage.removeItem('arbin_user');
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(user) => setCurrentUser(user)} />;
  }

  return <Dashboard currentUser={currentUser} onLogout={handleLogout} />;
}