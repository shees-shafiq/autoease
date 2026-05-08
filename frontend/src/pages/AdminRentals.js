import React, { useState, useEffect } from 'react';
import { rentalsAPI } from '../services/api';
import { StatusBadge } from './Dashboard';
import toast from 'react-hot-toast';

const STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

export default function AdminRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    rentalsAPI.getAll().then(r => setRentals(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await rentalsAPI.updateStatus(id, { status });
      toast.success(`Rental marked as ${status}`);
      setRentals(rentals.map(r => r.id === id ? { ...r, status } : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    }
  };

  const filtered = filter ? rentals.filter(r => r.status === filter) : rentals;

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Rental Management</h1>
          <p>{rentals.length} total rentals</p>
        </div>
      </div>
      <div className="container">
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          <button className={`tab-btn ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All ({rentals.length})</button>
          {STATUSES.map(s => (
            <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
              {s} ({rentals.filter(r => r.status === s).length})
            </button>
          ))}
        </div>

        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>ID</th><th>Customer</th><th>Vehicle</th><th>Dates</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>#{r.id}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.user_name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.user_email}</div>
                    </td>
                    <td>{r.year} {r.make} {r.model}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(r.pickup_date).toLocaleDateString()} →<br/>{new Date(r.return_date).toLocaleDateString()}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--primary)' }}>PKR {Number(r.total_price).toLocaleString()}</td>
                    <td><StatusBadge status={r.status} /></td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.82rem', width: 'auto' }}
                        value={r.status}
                        onChange={e => handleStatusChange(r.id, e.target.value)}
                      >
                        {STATUSES.map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
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
