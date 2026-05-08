import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { carsAPI, mechanicsAPI } from '../services/api';

const CAR_EMOJI = { sedan: '🚗', suv: '🚙', economy: '🚘', luxury: '🏎️', van: '🚐', sports: '🏎️' };

export default function Home() {
  const [featuredCars, setFeaturedCars] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    carsAPI.getAll({ status: 'available' }).then(r => setFeaturedCars(r.data.data.slice(0, 3))).catch(() => {});
    mechanicsAPI.getAll().then(r => setMechanics(r.data.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            Drive More.<br />
            Worry <span className="highlight">Less.</span>
          </h1>
          <p className="hero-subtitle">
            Premium car rentals and certified remote mechanic services — all in one platform. Book a ride or get your car fixed, wherever you are.
          </p>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/cars" className="btn btn-primary btn-lg">Browse Fleet</Link>
            <Link to="/mechanics" className="btn btn-outline btn-lg">Find Mechanic</Link>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="grid-4" style={{ padding: '2rem 0' }}>
            {[
              { icon: '🚗', value: '50+', label: 'Vehicles Available' },
              { icon: '🔧', value: '20+', label: 'Certified Mechanics' },
              { icon: '⭐', value: '4.8', label: 'Average Rating' },
              { icon: '✅', value: '1000+', label: 'Bookings Completed' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '1rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.8rem', fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <div className="grid-2" style={{ gap: '4rem', alignItems: 'center' }}>
            <div>
              <h2 className="section-title">🚗 Car Rental</h2>
              <p className="section-subtitle">Simple, transparent, reliable.</p>
              {[
                { step: '01', title: 'Browse Our Fleet', desc: 'Filter by category, location, price and availability.' },
                { step: '02', title: 'Book Instantly', desc: 'Select dates, pickup & dropoff locations, confirm.' },
                { step: '03', title: 'Drive & Return', desc: 'Pick up your car and enjoy the journey.' },
              ].map(({ step, title, desc }) => (
                <div key={step} style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--primary)', minWidth: '40px' }}>{step}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{desc}</div>
                  </div>
                </div>
              ))}
              <Link to="/cars" className="btn btn-primary">Browse Cars →</Link>
            </div>
            <div>
              <h2 className="section-title">🔧 Remote Mechanic</h2>
              <p className="section-subtitle">Expert help, right at your location.</p>
              {[
                { step: '01', title: 'Describe Your Issue', desc: 'Select service type and describe the problem.' },
                { step: '02', title: 'Choose a Mechanic', desc: 'View certified mechanics with ratings and specializations.' },
                { step: '03', title: 'Get Fixed On-Site', desc: 'Mechanic comes to your location and fixes the issue.' },
              ].map(({ step, title, desc }) => (
                <div key={step} style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '1.5rem', fontFamily: 'Rajdhani', fontWeight: 700, color: 'var(--primary)', minWidth: '40px' }}>{step}</div>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{title}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{desc}</div>
                  </div>
                </div>
              ))}
              <Link to="/mechanics" className="btn btn-primary">Find Mechanics →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED CARS */}
      {featuredCars.length > 0 && (
        <section className="section" style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <h2 className="section-title">Featured Vehicles</h2>
            <p className="section-subtitle">Top picks from our fleet</p>
            <div className="grid-3">
              {featuredCars.map(car => (
                <div key={car.id} className="card car-card" onClick={() => navigate(`/cars/${car.id}`)}>
                  <div className="car-card-image">
                    <span className="car-emoji">{CAR_EMOJI[car.category] || '🚗'}</span>
                  </div>
                  <div className="car-card-body">
                    <h3 className="car-card-title">{car.year} {car.make} {car.model}</h3>
                    <div className="car-card-meta">
                      <span>📍 {car.location}</span>
                      <span>💺 {car.seats} seats</span>
                      <span>⚙️ {car.transmission}</span>
                    </div>
                    <div className="car-card-price">
                      PKR {Number(car.price_per_day).toLocaleString()} <span>/day</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/cars" className="btn btn-outline btn-lg">View All Vehicles</Link>
            </div>
          </div>
        </section>
      )}

      {/* MECHANICS */}
      {mechanics.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 className="section-title">Our Mechanics</h2>
            <p className="section-subtitle">Certified professionals ready to help</p>
            <div className="grid-3">
              {mechanics.map(m => (
                <div key={m.id} className="card" onClick={() => navigate(`/mechanics/${m.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                      <div className="mechanic-card-avatar">🔧</div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{m.specialization}</div>
                        <div className="stars" style={{ fontSize: '0.75rem' }}>
                          {'★'.repeat(Math.round(m.rating))}{'☆'.repeat(5 - Math.round(m.rating))}
                          <span style={{ color: 'var(--text-muted)', marginLeft: '0.25rem' }}>({m.total_reviews})</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>📍 {m.service_area}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>PKR {Number(m.hourly_rate).toLocaleString()}/hr</span>
                      <span className={`badge ${m.is_available ? 'badge-success' : 'badge-danger'}`}>
                        {m.is_available ? '✓ Available' : '✗ Busy'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section style={{ background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', padding: '4rem 0', textAlign: 'center' }}>
        <div className="container">
          <h2 style={{ fontSize: '2.2rem', color: '#0A0B0D', marginBottom: '1rem', fontFamily: 'Rajdhani' }}>Ready to Get Started?</h2>
          <p style={{ color: 'rgba(10,11,13,0.7)', marginBottom: '2rem', fontSize: '1.05rem' }}>Join thousands of satisfied customers across Pakistan.</p>
          <Link to="/register" className="btn btn-lg" style={{ background: '#0A0B0D', color: 'var(--primary)' }}>Create Free Account</Link>
        </div>
      </section>

      <footer className="footer">
        <div className="container">
          <p>© 2025 AutoEase — Car Rental & Remote Mechanic Service. Built for AWS deployment.</p>
        </div>
      </footer>
    </div>
  );
}
