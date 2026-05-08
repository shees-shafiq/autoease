import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { carsAPI } from '../services/api';

const CAR_EMOJI = { sedan: '🚗', suv: '🚙', economy: '🚘', luxury: '🏎️', van: '🚐', sports: '🏎️' };

export default function Cars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ category: '', location: '', min_price: '', max_price: '', transmission: '' });
  const navigate = useNavigate();

  const fetchCars = () => {
    setLoading(true);
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
    carsAPI.getAll(params).then(r => setCars(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCars(); }, []);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchCars();
  };

  const resetFilters = () => {
    setFilters({ category: '', location: '', min_price: '', max_price: '', transmission: '' });
    carsAPI.getAll({}).then(r => setCars(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container">
          <h1>Our Fleet</h1>
          <p>{cars.length} vehicles available for rental</p>
        </div>
      </div>
      <div className="container">
        {/* Filters */}
        <form onSubmit={handleFilter} className="filter-bar">
          <div className="form-group">
            <label className="form-label">Category</label>
            <select className="form-control" value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})}>
              <option value="">All Categories</option>
              <option value="economy">Economy</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="luxury">Luxury</option>
              <option value="van">Van</option>
              <option value="sports">Sports</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input className="form-control" placeholder="Lahore, Karachi..." value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Min Price/Day</label>
            <input type="number" className="form-control" placeholder="PKR" value={filters.min_price} onChange={e => setFilters({...filters, min_price: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Max Price/Day</label>
            <input type="number" className="form-control" placeholder="PKR" value={filters.max_price} onChange={e => setFilters({...filters, max_price: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Transmission</label>
            <select className="form-control" value={filters.transmission} onChange={e => setFilters({...filters, transmission: e.target.value})}>
              <option value="">Any</option>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Search</button>
            <button type="button" className="btn btn-outline" onClick={resetFilters}>Reset</button>
          </div>
        </form>

        {loading ? (
          <div className="loading-overlay"><div className="spinner"></div></div>
        ) : cars.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚗</div>
            <h3>No cars found</h3>
            <p>Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid-3">
            {cars.map(car => (
              <div key={car.id} className="card car-card" onClick={() => navigate(`/cars/${car.id}`)}>
                <div className="car-card-image" style={{ background: `linear-gradient(135deg, var(--bg-elevated), var(--bg-card))` }}>
                  <span className="car-emoji" style={{ fontSize: '5rem' }}>{CAR_EMOJI[car.category] || '🚗'}</span>
                  <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
                    <span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{car.category}</span>
                  </div>
                  <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                    <span className={`badge ${car.status === 'available' ? 'badge-success' : 'badge-danger'}`}>
                      {car.status === 'available' ? '✓ Available' : car.status}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  <h3 className="car-card-title">{car.year} {car.make} {car.model}</h3>
                  <div className="car-card-meta">
                    <span>📍 {car.location}</span>
                    <span>💺 {car.seats} seats</span>
                    <span>⚙️ {car.transmission}</span>
                    <span>⛽ {car.fuel_type}</span>
                  </div>
                  {car.color && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>🎨 {car.color}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '1rem' }}>
                    <div className="car-card-price">
                      PKR {Number(car.price_per_day).toLocaleString()} <span>/day</span>
                    </div>
                    <span className="btn btn-sm btn-primary">View Details</span>
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
