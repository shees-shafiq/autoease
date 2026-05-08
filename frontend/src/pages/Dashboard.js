import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { rentalsAPI, mechanicsAPI, notificationsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

// ======================== DASHBOARD ========================
export function Dashboard() {
  const { user } = useAuth();
  const [rentals, setRentals] = useState([]);
  const [mechBookings, setMechBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([rentalsAPI.getAll(), mechanicsAPI.getUserBookings(), notificationsAPI.getAll()])
      .then(([r, m, n]) => {
        setRentals(r.data.data.slice(0, 5));
        setMechBookings(m.data.data.slice(0, 5));
        setNotifications(n.data.data.slice(0, 5));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Welcome back, {user.name.split(' ')[0]} 👋</h1>
          <p>Manage your rentals and service bookings</p>
        </div>
      </div>
      <div className="container">
        <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
          {[
            { icon: '🚗', label: 'Total Rentals', value: rentals.length },
            { icon: '🔧', label: 'Service Bookings', value: mechBookings.length },
            { icon: '✅', label: 'Active Rentals', value: rentals.filter(r => r.status === 'active').length },
            { icon: '🔔', label: 'Notifications', value: notifications.filter(n => !n.is_read).length },
          ].map(({ icon, label, value }) => (
            <div key={label} className="card stat-card">
              <div className="stat-icon">{icon}</div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ gap: '2rem' }}>
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Recent Rentals <Link to="/my-rentals" style={{ fontSize: '0.82rem', fontWeight: 400 }}>View all →</Link>
            </div>
            <div>
              {rentals.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No rentals yet. <Link to="/cars">Browse cars →</Link></div>
              ) : rentals.map(r => (
                <div key={r.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{r.make} {r.model} {r.year}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(r.pickup_date).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
              Recent Service Bookings <Link to="/my-mechanic-bookings" style={{ fontSize: '0.82rem', fontWeight: 400 }}>View all →</Link>
            </div>
            <div>
              {mechBookings.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No bookings yet. <Link to="/mechanics">Find mechanics →</Link></div>
              ) : mechBookings.map(b => (
                <div key={b.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.service_name}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(b.booking_date).toLocaleDateString()}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {notifications.length > 0 && (
          <div className="card" style={{ marginTop: '2rem' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Notifications
              <button className="btn btn-outline btn-sm" onClick={() => notificationsAPI.markAllRead().then(() => setNotifications(n => n.map(x => ({ ...x, is_read: true }))))}>
                Mark all read
              </button>
            </div>
            {notifications.map(n => (
              <div key={n.id} style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'flex-start', background: n.is_read ? 'transparent' : 'rgba(232,184,75,0.03)' }}>
                <span style={{ fontSize: '1.2rem' }}>{{ booking: '📋', payment: '💳', reminder: '⏰', promotion: '🎁', system: 'ℹ️' }[n.type]}</span>
                <div>
                  <div style={{ fontWeight: n.is_read ? 400 : 600, marginBottom: '0.2rem' }}>{n.title}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== MY RENTALS ========================
export function MyRentals() {
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(null);
  const [review, setReview] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    rentalsAPI.getAll().then(r => setRentals(r.data.data)).finally(() => setLoading(false));
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this rental?')) return;
    try {
      await rentalsAPI.cancel(id);
      toast.success('Rental cancelled');
      setRentals(rentals.map(r => r.id === id ? { ...r, status: 'cancelled' } : r));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel');
    }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await rentalsAPI.addReview(reviewModal, review);
      toast.success('Review submitted!');
      setReviewModal(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header"><div className="container"><h1>My Rentals</h1><p>Your car rental history</p></div></div>
      <div className="container">
        {rentals.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🚗</div><h3>No rentals yet</h3><p><Link to="/cars">Browse available cars →</Link></p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {rentals.map(r => (
              <div key={r.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3>{r.year} {r.make} {r.model}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                        📅 {new Date(r.pickup_date).toLocaleDateString()} → {new Date(r.return_date).toLocaleDateString()} &nbsp;•&nbsp;
                        {r.total_days} days &nbsp;•&nbsp; PKR {Number(r.total_price).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        📍 {r.pickup_location} → {r.dropoff_location}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <StatusBadge status={r.status} />
                      {['pending', 'confirmed'].includes(r.status) && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(r.id)}>Cancel</button>
                      )}
                      {r.status === 'completed' && (
                        <button className="btn btn-outline btn-sm" onClick={() => setReviewModal(r.id)}>Leave Review</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header"><h3>Leave a Review</h3><button className="modal-close" onClick={() => setReviewModal(null)}>×</button></div>
            <form onSubmit={handleReview}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Rating</label>
                  <select className="form-control" value={review.rating} onChange={e => setReview({...review, rating: parseInt(e.target.value)})}>
                    {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★ {['Excellent','Good','Average','Poor','Terrible'][5-n]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea className="form-control" rows="3" value={review.comment} onChange={e => setReview({...review, comment: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setReviewModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================== MY MECHANIC BOOKINGS ========================
export function MyMechanicBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mechanicsAPI.getUserBookings().then(r => setBookings(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header"><div className="container"><h1>My Service Bookings</h1><p>Track your mechanic service requests</p></div></div>
      <div className="container">
        {bookings.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">🔧</div><h3>No service bookings yet</h3><p><Link to="/mechanics">Find a mechanic →</Link></p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {bookings.map(b => (
              <div key={b.id} className="card">
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <h3>{b.service_name}</h3>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '0.5rem 0' }}>
                        👤 {b.mechanic_name} &nbsp;•&nbsp; 📅 {new Date(b.booking_date).toLocaleString()}
                      </div>
                      {b.car_make && <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🚗 {b.car_year} {b.car_make} {b.car_model} {b.car_license && `(${b.car_license})`}</div>}
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>📍 {b.address}</div>
                      {b.mechanic_notes && <div className="alert alert-info" style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem' }}>🔧 {b.mechanic_notes}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                      <StatusBadge status={b.status} />
                      <span className={`badge urgency-${b.urgency}`} style={{ background: 'var(--bg-elevated)' }}>
                        {b.urgency === 'emergency' ? '🚨' : b.urgency === 'urgent' ? '⚡' : '📋'} {b.urgency}
                      </span>
                      {b.final_price && <span style={{ fontWeight: 700, color: 'var(--primary)' }}>PKR {Number(b.final_price).toLocaleString()}</span>}
                      {b.estimated_price && !b.final_price && <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Est: PKR {Number(b.estimated_price).toLocaleString()}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ======================== PROFILE ========================
export function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '', driving_license: user?.driving_license || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const { authAPI } = require('../services/api');

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { authAPI: api } = await import('../services/api');
      await api.updateProfile(form);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword.length < 6) { toast.error('New password must be at least 6 characters'); return; }
    try {
      const { authAPI: api } = await import('../services/api');
      await api.changePassword(pwForm);
      toast.success('Password changed!');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header"><div className="container"><h1>My Profile</h1><p>Manage your account settings</p></div></div>
      <div className="container">
        <div className="grid-2" style={{ gap: '2rem' }}>
          <div className="card">
            <div className="card-header">Personal Information</div>
            <div className="card-body">
              <form onSubmit={handleProfile}>
                <div className="form-group"><label className="form-label">Full Name</label><input className="form-control" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-control" value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Address</label><input className="form-control" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Driving License</label><input className="form-control" value={form.driving_license || ''} onChange={e => setForm({...form, driving_license: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={user?.email} disabled style={{ opacity: 0.6 }} /></div>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              </form>
            </div>
          </div>
          <div className="card">
            <div className="card-header">Change Password</div>
            <div className="card-body">
              <form onSubmit={handlePassword}>
                <div className="form-group"><label className="form-label">Current Password</label><input type="password" className="form-control" value={pwForm.currentPassword} onChange={e => setPwForm({...pwForm, currentPassword: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">New Password</label><input type="password" className="form-control" value={pwForm.newPassword} onChange={e => setPwForm({...pwForm, newPassword: e.target.value})} required /></div>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ======================== SHARED: STATUS BADGE ========================
export function StatusBadge({ status }) {
  const map = {
    pending: 'badge-warning', confirmed: 'badge-info', active: 'badge-success',
    completed: 'badge-muted', cancelled: 'badge-danger',
    accepted: 'badge-info', en_route: 'badge-primary', in_progress: 'badge-success',
    available: 'badge-success', rented: 'badge-warning', maintenance: 'badge-danger',
    paid: 'badge-success', refunded: 'badge-info',
  };
  return <span className={`badge ${map[status] || 'badge-muted'}`} style={{ textTransform: 'capitalize' }}>{status?.replace('_', ' ')}</span>;
}

export default Dashboard;
