import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Cars from './pages/Cars';
import CarDetail from './pages/CarDetail';
import Mechanics from './pages/Mechanics';
import MechanicDetail from './pages/MechanicDetail';
import Dashboard from './pages/Dashboard';
import MyRentals from './pages/MyRentals';
import MyMechanicBookings from './pages/MyMechanicBookings';
import AdminDashboard from './pages/AdminDashboard';
import AdminCars from './pages/AdminCars';
import AdminRentals from './pages/AdminRentals';
import AdminMechanicBookings from './pages/AdminMechanicBookings';
import Profile from './pages/Profile';
import MechanicDashboard from './pages/MechanicDashboard';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return user?.role === 'admin' ? children : <Navigate to="/" />;
};

const MechanicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner"></div></div>;
  return ['admin', 'mechanic'].includes(user?.role) ? children : <Navigate to="/" />;
};

function AppContent() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cars" element={<Cars />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/mechanics" element={<Mechanics />} />
          <Route path="/mechanics/:id" element={<MechanicDetail />} />

          {/* Customer routes */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/my-rentals" element={<PrivateRoute><MyRentals /></PrivateRoute>} />
          <Route path="/my-mechanic-bookings" element={<PrivateRoute><MyMechanicBookings /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Mechanic routes */}
          <Route path="/mechanic-dashboard" element={<MechanicRoute><MechanicDashboard /></MechanicRoute>} />

          {/* Admin routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/cars" element={<AdminRoute><AdminCars /></AdminRoute>} />
          <Route path="/admin/rentals" element={<AdminRoute><AdminRentals /></AdminRoute>} />
          <Route path="/admin/mechanic-bookings" element={<AdminRoute><AdminMechanicBookings /></AdminRoute>} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
