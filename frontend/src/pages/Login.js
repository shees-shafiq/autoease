import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      if (data.user.role === 'admin') navigate('/admin');
      else if (data.user.role === 'mechanic') navigate('/mechanic-dashboard');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Welcome Back</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to your AutoEase account</p>
        </div>
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Demo: <strong style={{ color: 'var(--text)' }}>admin@autoease.com</strong> / <strong style={{ color: 'var(--text)' }}>password</strong>
            </div>
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Don't have an account? <Link to="/register">Create one →</Link>
        </p>
      </div>
    </div>
  );
}

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '', driving_license: '' });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '500px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Join AutoEase today</p>
        </div>
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-control" placeholder="Ahmed Khan" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-control" placeholder="+923001234567" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input type="password" className="form-control" placeholder="Min. 6 characters" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-control" placeholder="Lahore, Punjab" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Driving License Number</label>
                <input className="form-control" placeholder="LHR-XXXXXXXX" value={form.driving_license} onChange={e => setForm({...form, driving_license: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login">Sign in →</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
