import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      notificationsAPI.getAll().then(res => setUnreadCount(res.data.unread)).catch(() => {});
      const interval = setInterval(() => {
        notificationsAPI.getAll().then(res => setUnreadCount(res.data.unread)).catch(() => {});
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.success('Logged out successfully');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">AUTO<span>EASE</span></Link>
      <div className="navbar-links">
        <NavLink to="/cars">Fleet</NavLink>
        <NavLink to="/mechanics">Mechanics</NavLink>
        {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
        {user?.role === 'mechanic' && <NavLink to="/mechanic-dashboard">My Jobs</NavLink>}
      </div>
      <div className="navbar-actions">
        {user ? (
          <>
            {unreadCount > 0 && (
              <div style={{ position: 'relative' }}>
                <button className="notif-trigger" onClick={() => navigate(user.role === 'admin' ? '/admin' : '/dashboard')}>
                  🔔
                  <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                </button>
              </div>
            )}
            {user.role === 'customer' && <Link to="/dashboard" className="btn btn-outline btn-sm">Dashboard</Link>}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('/profile')}
                style={{ gap: '0.4rem' }}
              >
                👤 {user.name.split(' ')[0]}
              </button>
            </div>
            <button className="btn btn-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)', border: '1px solid var(--border)' }} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
}
