import React, { useState, useEffect } from 'react';
import { mechanicsAPI } from '../services/api';
import { StatusBadge } from './Dashboard';
import toast from 'react-hot-toast';

const STATUSES = ['pending', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled'];

export default function AdminMechanicBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    mechanicsAPI.getMechanicBookings().then(r => setBookings(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await mechanicsAPI.updateBookingStatus(id, { status });
      toast.success(`Status updated to ${status}`);
      setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const URGENCY_COLORS = { emergency: 'var(--danger)', urgent: 'var(--warning)', normal: 'var(--info)', low: 'var(--text-muted)' };
  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Mechanic Booking Management</h1>
          <p>{bookings.length} total bookings</p>
        </div>
      </div>
      <div className="container">
        <div className="tabs">
          <button className={`tab-btn ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All ({bookings.length})</button>
          {STATUSES.map(s => (
            <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
              {s.replace('_', ' ')} ({bookings.filter(b => b.status === s).length})
            </button>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>ID</th><th>Customer</th><th>Mechanic</th><th>Service</th><th>Date</th><th>Urgency</th><th>Price</th><th>Status</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{b.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{b.customer_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{b.customer_phone}</div>
                    </td>
                    <td>{b.mechanic_name}</td>
                    <td>
                      <div>{b.service_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{b.service_category}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(b.booking_date).toLocaleString()}</td>
                    <td>
                      <span style={{ color: URGENCY_COLORS[b.urgency], fontWeight: 600, textTransform: 'capitalize', fontSize: '0.82rem' }}>
                        {b.urgency === 'emergency' ? '🚨' : b.urgency === 'urgent' ? '⚡' : ''} {b.urgency}
                      </span>
                    </td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      {b.final_price ? `PKR ${Number(b.final_price).toLocaleString()}` : b.estimated_price ? `~PKR ${Number(b.estimated_price).toLocaleString()}` : '—'}
                    </td>
                    <td><StatusBadge status={b.status} /></td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem', width: 'auto' }}
                        value={b.status}
                        onChange={e => handleStatusChange(b.id, e.target.value)}
                      >
                        {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s.replace('_',' ')}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
