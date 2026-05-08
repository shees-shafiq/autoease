import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { StatusBadge } from './Dashboard';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  const { stats, recentRentals, recentMechanic } = data || {};

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Admin Dashboard</h1>
          <p>AutoEase operations overview</p>
        </div>
      </div>
      <div className="container">
        {/* Quick Nav */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          {[
            { to: '/admin/cars', icon: '🚗', label: 'Manage Fleet' },
            { to: '/admin/rentals', icon: '📋', label: 'Manage Rentals' },
            { to: '/admin/mechanic-bookings', icon: '🔧', label: 'Mechanic Bookings' },
          ].map(({ to, icon, label }) => (
            <Link key={to} to={to} className="btn btn-outline" style={{ flex: 1, justifyContent: 'center', minWidth: '180px' }}>
              {icon} {label}
            </Link>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
          {[
            { icon: '👥', label: 'Total Customers', value: stats?.totalUsers },
            { icon: '🚗', label: 'Total Fleet', value: stats?.totalCars },
            { icon: '✅', label: 'Available Cars', value: stats?.availableCars },
            { icon: '🔄', label: 'Active Rentals', value: stats?.activeRentals },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card stat-card">
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{value ?? '—'}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-3" style={{ marginBottom: '2.5rem' }}>
          {[
            { icon: '💰', label: 'Rental Revenue', value: `PKR ${Number(stats?.rentalRevenue || 0).toLocaleString()}` },
            { icon: '🔧', label: 'Mechanic Revenue', value: `PKR ${Number(stats?.mechanicRevenue || 0).toLocaleString()}` },
            { icon: '💎', label: 'Total Revenue', value: `PKR ${Number(stats?.totalRevenue || 0).toLocaleString()}` },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card stat-card" style={{ borderColor: 'rgba(232,184,75,0.2)' }}>
              <div className="stat-icon">{icon}</div>
              <div className="stat-value" style={{ fontSize: '1.6rem' }}>{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: '2rem' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Recent Rentals <Link to="/admin/rentals" style={{ fontSize: '0.82rem', fontWeight: 400 }}>Manage →</Link>
            </div>
            <div>
              {recentRentals?.map(r => (
                <div key={r.id} style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.user_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{r.make} {r.model} • PKR {Number(r.total_price).toLocaleString()}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Recent Service Bookings <Link to="/admin/mechanic-bookings" style={{ fontSize: '0.82rem', fontWeight: 400 }}>Manage →</Link>
            </div>
            <div>
              {recentMechanic?.map(b => (
                <div key={b.id} style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{b.user_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.service_name} • {b.urgency}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
