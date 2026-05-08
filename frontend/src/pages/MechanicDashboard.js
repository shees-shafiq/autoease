import React, { useState, useEffect } from 'react';
import { mechanicsAPI } from '../services/api';
import { StatusBadge } from './Dashboard';
import toast from 'react-hot-toast';

const NEXT_STATUS = {
  pending: ['accepted', 'cancelled'],
  accepted: ['en_route', 'cancelled'],
  en_route: ['in_progress'],
  in_progress: ['completed'],
};

export default function MechanicDashboard() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [updating, setUpdating] = useState(null);
  const [noteModal, setNoteModal] = useState(null);
  const [noteForm, setNoteForm] = useState({ status: '', mechanic_notes: '', final_price: '' });

  useEffect(() => {
    mechanicsAPI.getMechanicBookings().then(r => setBookings(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, status, mechanic_notes, final_price) => {
    setUpdating(id);
    try {
      await mechanicsAPI.updateBookingStatus(id, { status, mechanic_notes, final_price });
      toast.success(`Status → ${status}`);
      setBookings(bookings.map(b => b.id === id ? { ...b, status, mechanic_notes: mechanic_notes || b.mechanic_notes, final_price: final_price || b.final_price } : b));
      setNoteModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setUpdating(null);
    }
  };

  const urgencyMap = { emergency: '🚨', urgent: '⚡', normal: '📋', low: '📌' };
  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;
  const pending = bookings.filter(b => b.status === 'pending').length;
  const active = bookings.filter(b => ['accepted','en_route','in_progress'].includes(b.status)).length;

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Mechanic Dashboard</h1>
          <p>Manage your service jobs</p>
        </div>
      </div>
      <div className="container">
        <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
          {[
            { icon: '📬', label: 'New Requests', value: pending },
            { icon: '🔧', label: 'Active Jobs', value: active },
            { icon: '✅', label: 'Completed', value: bookings.filter(b => b.status === 'completed').length },
            { icon: '📊', label: 'Total Jobs', value: bookings.length },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card stat-card">
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="tabs">
          <button className={`tab-btn ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
          {['pending','accepted','en_route','in_progress','completed','cancelled'].map(s => (
            <button key={s} className={`tab-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔧</div><h3>No jobs</h3></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(b => (
              <div key={b.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem' }}>{b.service_name}</h3>
                        <span style={{ fontSize: '1rem' }}>{urgencyMap[b.urgency]}</span>
                        <StatusBadge status={b.status} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span>👤 {b.customer_name} • {b.customer_phone}</span>
                        <span>📅 {new Date(b.booking_date).toLocaleString()}</span>
                        {b.car_make && <span>🚗 {b.car_year} {b.car_make} {b.car_model}</span>}
                        <span>📍 {b.address}</span>
                      </div>
                      {b.problem_description && (
                        <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--bg-elevated)', borderRadius: '6px', fontSize: '0.85rem' }}>
                          💬 {b.problem_description}
                        </div>
                      )}
                      {b.mechanic_notes && (
                        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--primary)' }}>📝 Your notes: {b.mechanic_notes}</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      {b.final_price ? (
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>PKR {Number(b.final_price).toLocaleString()}</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Est: PKR {Number(b.estimated_price).toLocaleString()}</span>
                      )}
                      {NEXT_STATUS[b.status]?.map(nextStatus => (
                        <button
                          key={nextStatus}
                          className={`btn btn-sm ${nextStatus === 'cancelled' ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => {
                            if (nextStatus === 'completed') {
                              setNoteForm({ status: nextStatus, mechanic_notes: b.mechanic_notes || '', final_price: b.estimated_price || '' });
                              setNoteModal(b.id);
                            } else {
                              handleUpdate(b.id, nextStatus);
                            }
                          }}
                          disabled={updating === b.id}
                          style={{ textTransform: 'capitalize' }}
                        >
                          → {nextStatus.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Complete Modal */}
      {noteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3>Complete Job</h3><button className="modal-close" onClick={() => setNoteModal(null)}>×</button></div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Final Price (PKR)</label>
                <input type="number" className="form-control" value={noteForm.final_price} onChange={e => setNoteForm({...noteForm, final_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Notes for Customer</label>
                <textarea className="form-control" rows="3" value={noteForm.mechanic_notes} onChange={e => setNoteForm({...noteForm, mechanic_notes: e.target.value})} placeholder="What was done, parts replaced, etc." />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setNoteModal(null)}>Cancel</button>
              <button className="btn btn-success" onClick={() => handleUpdate(noteModal, noteForm.status, noteForm.mechanic_notes, noteForm.final_price)}>
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
