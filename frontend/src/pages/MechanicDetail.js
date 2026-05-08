import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mechanicsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function MechanicDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mechanic, setMechanic] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState({ service_id: '', car_make: '', car_model: '', car_year: '', car_license: '', booking_date: '', address: '', problem_description: '', urgency: 'normal' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([mechanicsAPI.getById(id), mechanicsAPI.getServices()])
      .then(([mr, sr]) => { setMechanic(mr.data.data); setServices(sr.data.data); })
      .catch(() => toast.error('Mechanic not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    try {
      await mechanicsAPI.createBooking({ ...booking, mechanic_id: id });
      toast.success('Mechanic booking request sent! 🔧');
      setShowModal(false);
      navigate('/my-mechanic-bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!mechanic) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}><h2>Mechanic not found</h2></div>;

  const selectedService = services.find(s => s.id === parseInt(booking.service_id));

  return (
    <div className="page-wrapper">
      <div className="container">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/mechanics')} style={{ marginBottom: '1.5rem' }}>← Back to Mechanics</button>

        <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div className="card-body">
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div style={{ width: '80px', height: '80px', background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', border: '2px solid var(--border)' }}>🔧</div>
                  <div>
                    <h1 style={{ fontSize: '1.6rem', marginBottom: '0.25rem' }}>{mechanic.name}</h1>
                    <div style={{ color: 'var(--primary)', fontWeight: 600, marginBottom: '0.25rem' }}>{mechanic.specialization}</div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--primary)' }}>{'★'.repeat(Math.round(mechanic.rating))}{'☆'.repeat(5-Math.round(mechanic.rating))}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{Number(mechanic.rating).toFixed(1)} ({mechanic.total_reviews} reviews)</span>
                    </div>
                  </div>
                  <span className={`badge ${mechanic.is_available ? 'badge-success' : 'badge-danger'}`} style={{ marginLeft: 'auto' }}>
                    {mechanic.is_available ? '✓ Available' : '✗ Unavailable'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.7 }}>{mechanic.bio}</p>
                <div className="grid-2" style={{ gap: '0.75rem' }}>
                  {[
                    { icon: '📍', label: 'Service Area', val: mechanic.service_area },
                    { icon: '🏅', label: 'Experience', val: `${mechanic.experience_years} years` },
                    { icon: '📞', label: 'Phone', val: mechanic.phone },
                    { icon: '💰', label: 'Hourly Rate', val: `PKR ${Number(mechanic.hourly_rate).toLocaleString()}` },
                  ].map(({ icon, label, val }) => (
                    <div key={label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{icon} {label}</div>
                      <div style={{ fontWeight: 600 }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {mechanic.reviews?.length > 0 && (
              <div className="card">
                <div className="card-header">Customer Reviews</div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {mechanic.reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600 }}>{r.user_name}</span>
                        <span style={{ color: 'var(--primary)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                      </div>
                      {r.comment && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Panel */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="card">
              <div className="card-header">Book This Mechanic</div>
              <div className="card-body">
                <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'Rajdhani', marginBottom: '1.5rem' }}>
                  PKR {Number(mechanic.hourly_rate).toLocaleString()}<span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 400 }}>/hr</span>
                </div>
                {mechanic.is_available ? (
                  <button className="btn btn-primary btn-full btn-lg" onClick={() => user ? setShowModal(true) : navigate('/login')}>
                    {user ? 'Book Service' : 'Login to Book'}
                  </button>
                ) : (
                  <div className="alert alert-danger">This mechanic is currently unavailable.</div>
                )}
                <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>ℹ️ How it works</div>
                  <div style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
                    <p>1. Submit your booking request</p>
                    <p>2. Mechanic confirms and arrives at your location</p>
                    <p>3. Service performed on-site</p>
                    <p>4. Pay after completion</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h3>Book Service with {mechanic.name}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleBook}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Service Required *</label>
                  <select className="form-control" value={booking.service_id} onChange={e => setBooking({...booking, service_id: e.target.value})} required>
                    <option value="">Select a service</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} — PKR {Number(s.base_price).toLocaleString()}</option>)}
                  </select>
                </div>
                {selectedService && (
                  <div className="alert alert-info">⏱ Estimated duration: ~{selectedService.estimated_duration} minutes</div>
                )}
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Car Make</label>
                    <input className="form-control" placeholder="Toyota" value={booking.car_make} onChange={e => setBooking({...booking, car_make: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Car Model</label>
                    <input className="form-control" placeholder="Corolla" value={booking.car_model} onChange={e => setBooking({...booking, car_model: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input type="number" className="form-control" placeholder="2022" value={booking.car_year} onChange={e => setBooking({...booking, car_year: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">License Plate</label>
                    <input className="form-control" placeholder="LHR-1234" value={booking.car_license} onChange={e => setBooking({...booking, car_license: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Preferred Date & Time *</label>
                  <input type="datetime-local" className="form-control" value={booking.booking_date} onChange={e => setBooking({...booking, booking_date: e.target.value})} min={new Date().toISOString().slice(0,16)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Your Location / Address *</label>
                  <textarea className="form-control" rows="2" placeholder="Full address where mechanic should come" value={booking.address} onChange={e => setBooking({...booking, address: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Problem Description</label>
                  <textarea className="form-control" rows="3" placeholder="Describe the issue with your vehicle..." value={booking.problem_description} onChange={e => setBooking({...booking, problem_description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Urgency</label>
                  <select className="form-control" value={booking.urgency} onChange={e => setBooking({...booking, urgency: e.target.value})}>
                    <option value="low">Low — Within a week</option>
                    <option value="normal">Normal — Within 24-48 hrs</option>
                    <option value="urgent">Urgent — Today</option>
                    <option value="emergency">🚨 Emergency — ASAP</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Sending Request...' : 'Send Request'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
