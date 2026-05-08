import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { carsAPI, rentalsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CAR_EMOJI = { sedan: '🚗', suv: '🚙', economy: '🚘', luxury: '🏎️', van: '🚐', sports: '🏎️' };

export default function CarDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [booking, setBooking] = useState({ pickup_date: '', return_date: '', pickup_location: '', dropoff_location: '', payment_method: 'cash', notes: '' });
  const [submitting, setSubmitting] = useState(false);
  const [priceCalc, setPriceCalc] = useState(null);

  useEffect(() => {
    carsAPI.getById(id).then(r => setCar(r.data.data)).catch(() => toast.error('Car not found')).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (booking.pickup_date && booking.return_date && car) {
      const days = Math.max(1, Math.ceil((new Date(booking.return_date) - new Date(booking.pickup_date)) / (1000 * 60 * 60 * 24)));
      setPriceCalc({ days, total: days * parseFloat(car.price_per_day) });
    }
  }, [booking.pickup_date, booking.return_date, car]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to book a car'); navigate('/login'); return; }
    if (!booking.pickup_date || !booking.return_date) { toast.error('Please select dates'); return; }
    if (new Date(booking.pickup_date) >= new Date(booking.return_date)) { toast.error('Return date must be after pickup date'); return; }
    if (new Date(booking.pickup_date) < new Date()) { toast.error('Pickup date cannot be in the past'); return; }

    setSubmitting(true);
    try {
      await rentalsAPI.create({ ...booking, car_id: id });
      toast.success('Booking confirmed! 🎉');
      setShowModal(false);
      navigate('/my-rentals');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  if (!car) return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}><h2>Car not found</h2></div>;

  const features = typeof car.features === 'string' ? JSON.parse(car.features || '[]') : (car.features || []);

  return (
    <div className="page-wrapper">
      <div className="container">
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/cars')} style={{ marginBottom: '1.5rem' }}>
          ← Back to Fleet
        </button>

        <div className="grid-2" style={{ gap: '2rem', alignItems: 'start' }}>
          {/* Left */}
          <div>
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ height: '280px', background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-card))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8rem', position: 'relative' }}>
                {CAR_EMOJI[car.category] || '🚗'}
                <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{car.category}</span>
                  <span className={`badge ${car.status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                    {car.status === 'available' ? '✓ Available' : car.status}
                  </span>
                </div>
              </div>
              <div className="card-body">
                <h1 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{car.year} {car.make} {car.model}</h1>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem' }}>{car.description}</p>

                <div className="grid-2" style={{ gap: '0.75rem', marginBottom: '1.25rem' }}>
                  {[
                    { icon: '🎨', label: 'Color', val: car.color },
                    { icon: '📍', label: 'Location', val: car.location },
                    { icon: '💺', label: 'Seats', val: car.seats },
                    { icon: '⚙️', label: 'Transmission', val: car.transmission },
                    { icon: '⛽', label: 'Fuel', val: car.fuel_type },
                    { icon: '🔢', label: 'Plate', val: car.license_plate },
                  ].map(({ icon, label, val }) => (
                    <div key={label} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>{icon} {label}</div>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>{val || 'N/A'}</div>
                    </div>
                  ))}
                </div>

                {features.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>FEATURES</div>
                    <div className="features-list">
                      {features.map((f, i) => <span key={i} className="feature-tag">✓ {f}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Reviews */}
            {car.reviews?.length > 0 && (
              <div className="card">
                <div className="card-header">Customer Reviews</div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {car.reviews.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                      <div style={{ display: 'flex', justify: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 600 }}>{r.user_name}</span>
                        <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5-r.rating)}</span>
                      </div>
                      {r.comment && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Booking Panel */}
          <div style={{ position: 'sticky', top: '80px' }}>
            <div className="card">
              <div className="card-header">Book This Vehicle</div>
              <div className="card-body">
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <div>
                      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)', fontFamily: 'Rajdhani' }}>
                        PKR {Number(car.price_per_day).toLocaleString()}
                      </div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>per day</div>
                    </div>
                    {car.price_per_hour && (
                      <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)', fontFamily: 'Rajdhani' }}>
                          PKR {Number(car.price_per_hour).toLocaleString()}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>per hour</div>
                      </div>
                    )}
                  </div>
                </div>

                {car.status === 'available' ? (
                  <button className="btn btn-primary btn-full btn-lg" onClick={() => user ? setShowModal(true) : navigate('/login')}>
                    {user ? 'Book Now' : 'Login to Book'}
                  </button>
                ) : (
                  <div className="alert alert-danger">This car is currently not available for rental.</div>
                )}

                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.5rem' }}>📋 Rental Policy</div>
                  <p>• Valid driving license required</p>
                  <p>• Fuel must be returned at same level</p>
                  <p>• Late returns charged at hourly rate</p>
                  <p>• Free cancellation up to 24hrs before pickup</p>
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
              <h3>Book {car.year} {car.make} {car.model}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleBook}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Pickup Date *</label>
                    <input type="datetime-local" className="form-control" value={booking.pickup_date} onChange={e => setBooking({...booking, pickup_date: e.target.value})} min={new Date().toISOString().slice(0,16)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Return Date *</label>
                    <input type="datetime-local" className="form-control" value={booking.return_date} onChange={e => setBooking({...booking, return_date: e.target.value})} min={booking.pickup_date || new Date().toISOString().slice(0,16)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Location *</label>
                  <input className="form-control" placeholder="e.g. Gulberg, Lahore" value={booking.pickup_location} onChange={e => setBooking({...booking, pickup_location: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Dropoff Location *</label>
                  <input className="form-control" placeholder="e.g. DHA, Lahore" value={booking.dropoff_location} onChange={e => setBooking({...booking, dropoff_location: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-control" value={booking.payment_method} onChange={e => setBooking({...booking, payment_method: e.target.value})}>
                    <option value="cash">Cash on Pickup</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Additional Notes</label>
                  <textarea className="form-control" rows="2" placeholder="Any special requests..." value={booking.notes} onChange={e => setBooking({...booking, notes: e.target.value})} />
                </div>

                {priceCalc && (
                  <div className="price-breakdown">
                    <div className="price-row"><span>Duration</span><span>{priceCalc.days} day(s)</span></div>
                    <div className="price-row"><span>Rate per day</span><span>PKR {Number(car.price_per_day).toLocaleString()}</span></div>
                    <div className="price-row total"><span>Total</span><span>PKR {Number(priceCalc.total).toLocaleString()}</span></div>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? 'Booking...' : 'Confirm Booking'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
