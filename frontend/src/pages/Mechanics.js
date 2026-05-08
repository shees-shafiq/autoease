import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { mechanicsAPI } from '../services/api';

export default function Mechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([mechanicsAPI.getAll(), mechanicsAPI.getServices()])
      .then(([mr, sr]) => { setMechanics(mr.data.data); setServices(sr.data.data); })
      .finally(() => setLoading(false));
  }, []);

  const serviceCategories = [...new Set(services.map(s => s.category))];

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Remote Mechanic Service</h1>
          <p>Certified mechanics come to your location</p>
        </div>
      </div>
      <div className="container">

        {/* Services grid */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '0.5rem' }}>Our Services</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Professional automotive services at your doorstep</p>

          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <button className={`btn btn-sm ${!categoryFilter ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategoryFilter('')}>All</button>
            {serviceCategories.map(c => (
              <button key={c} className={`btn btn-sm ${categoryFilter === c ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCategoryFilter(c)} style={{ textTransform: 'capitalize' }}>{c}</button>
            ))}
          </div>

          <div className="grid-3">
            {services.filter(s => !categoryFilter || s.category === categoryFilter).map(s => (
              <div key={s.id} className="card">
                <div className="card-body">
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {{ engine: '🔧', transmission: '⚙️', brakes: '🛑', electrical: '⚡', tires: '🛞', ac: '❄️', body: '🚗', diagnostics: '🔍', general: '🔩' }[s.category] || '🔧'}
                  </div>
                  <h3 style={{ marginBottom: '0.3rem' }}>{s.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{s.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>PKR {Number(s.base_price).toLocaleString()}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>~{s.estimated_duration} min</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mechanics */}
        <h2 style={{ marginBottom: '0.5rem' }}>Available Mechanics</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>All verified and background-checked</p>

        {loading ? <div className="loading-overlay"><div className="spinner"></div></div> :
          mechanics.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">🔧</div><h3>No mechanics available</h3></div>
          ) : (
            <div className="grid-3">
              {mechanics.map(m => (
                <div key={m.id} className="card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/mechanics/${m.id}`)}>
                  <div className="card-body">
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div className="mechanic-card-avatar">🔧</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.1rem' }}>{m.name}</div>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{m.specialization}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>
                            {'★'.repeat(Math.round(m.rating))}{'☆'.repeat(5 - Math.round(m.rating))}
                          </span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{Number(m.rating).toFixed(1)} ({m.total_reviews})</span>
                        </div>
                      </div>
                      <span className={`badge ${m.is_available ? 'badge-success' : 'badge-muted'}`}>{m.is_available ? 'Available' : 'Busy'}</span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>{m.bio?.slice(0, 100)}...</p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      <span>📍 {m.service_area}</span>
                      <span>🏅 {m.experience_years} yrs exp</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>PKR {Number(m.hourly_rate).toLocaleString()}/hr</span>
                      <span className="btn btn-sm btn-primary">Book Now</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  );
}
