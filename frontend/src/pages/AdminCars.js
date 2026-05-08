import React, { useState, useEffect } from 'react';
import { carsAPI } from '../services/api';
import { StatusBadge } from './Dashboard';
import toast from 'react-hot-toast';

const EMPTY_CAR = { make: '', model: '', year: '', color: '', license_plate: '', category: 'sedan', transmission: 'automatic', fuel_type: 'petrol', seats: 5, price_per_day: '', price_per_hour: '', description: '', location: '', status: 'available', features: '' };

export default function AdminCars() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCar, setEditCar] = useState(null);
  const [form, setForm] = useState(EMPTY_CAR);
  const [saving, setSaving] = useState(false);

  const fetchCars = () => carsAPI.getAll({ status: 'all' }).then(r => { 
    // Get all including non-available
    return carsAPI.getAll({}).then(r2 => setCars(r2.data.data));
  }).finally(() => setLoading(false));

  useEffect(() => { fetchCars(); }, []);

  const openAdd = () => { setForm(EMPTY_CAR); setEditCar(null); setShowModal(true); };
  const openEdit = (car) => {
    const features = typeof car.features === 'string' ? JSON.parse(car.features || '[]') : (car.features || []);
    setForm({ ...car, features: features.join(', ') });
    setEditCar(car.id);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, features: form.features.split(',').map(f => f.trim()).filter(Boolean) };
    try {
      if (editCar) {
        await carsAPI.update(editCar, payload);
        toast.success('Car updated');
      } else {
        await carsAPI.create(payload);
        toast.success('Car added');
      }
      setShowModal(false);
      fetchCars();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save car');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this car?')) return;
    try {
      await carsAPI.delete(id);
      toast.success('Car deleted');
      setCars(cars.filter(c => c.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete');
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><h1>Fleet Management</h1><p>{cars.length} vehicles</p></div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Vehicle</button>
        </div>
      </div>
      <div className="container">
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Vehicle</th><th>Plate</th><th>Category</th><th>Location</th><th>Price/Day</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {cars.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.year} {c.make} {c.model}</td>
                    <td><code style={{ background: 'var(--bg-elevated)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.82rem' }}>{c.license_plate}</code></td>
                    <td style={{ textTransform: 'capitalize' }}>{c.category}</td>
                    <td>{c.location}</td>
                    <td>PKR {Number(c.price_per_day).toLocaleString()}</td>
                    <td><StatusBadge status={c.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editCar ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group"><label className="form-label">Make *</label><input className="form-control" value={form.make} onChange={e => setForm({...form, make: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Model *</label><input className="form-control" value={form.model} onChange={e => setForm({...form, model: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Year *</label><input type="number" className="form-control" value={form.year} onChange={e => setForm({...form, year: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Color</label><input className="form-control" value={form.color} onChange={e => setForm({...form, color: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">License Plate *</label><input className="form-control" value={form.license_plate} onChange={e => setForm({...form, license_plate: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Category</label>
                    <select className="form-control" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {['economy','sedan','suv','luxury','van','sports'].map(c => <option key={c} value={c} style={{textTransform:'capitalize'}}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Transmission</label>
                    <select className="form-control" value={form.transmission} onChange={e => setForm({...form, transmission: e.target.value})}>
                      <option value="automatic">Automatic</option><option value="manual">Manual</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Fuel Type</label>
                    <select className="form-control" value={form.fuel_type} onChange={e => setForm({...form, fuel_type: e.target.value})}>
                      {['petrol','diesel','electric','hybrid'].map(f => <option key={f} value={f} style={{textTransform:'capitalize'}}>{f}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Seats</label><input type="number" className="form-control" value={form.seats} onChange={e => setForm({...form, seats: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Price Per Day (PKR) *</label><input type="number" className="form-control" value={form.price_per_day} onChange={e => setForm({...form, price_per_day: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Price Per Hour (PKR)</label><input type="number" className="form-control" value={form.price_per_hour} onChange={e => setForm({...form, price_per_hour: e.target.value})} /></div>
                  <div className="form-group"><label className="form-label">Location</label><input className="form-control" placeholder="Lahore" value={form.location} onChange={e => setForm({...form, location: e.target.value})} /></div>
                </div>
                {editCar && (
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      {['available','rented','maintenance','inactive'].map(s => <option key={s} value={s} style={{textTransform:'capitalize'}}>{s}</option>)}
                    </select>
                  </div>
                )}
                <div className="form-group"><label className="form-label">Features (comma-separated)</label><input className="form-control" placeholder="AC, GPS, Sunroof" value={form.features} onChange={e => setForm({...form, features: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-control" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Vehicle'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
