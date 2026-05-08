import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://51.21.3.171:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const carsAPI = {
  getAll: (params) => api.get('/cars', { params }),
  getById: (id) => api.get(`/cars/${id}`),
  create: (data) => api.post('/cars', data),
  update: (id, data) => api.put(`/cars/${id}`, data),
  delete: (id) => api.delete(`/cars/${id}`),
  checkAvailability: (id, params) => api.get(`/cars/check-availability/${id}`, { params }),
};

export const rentalsAPI = {
  getAll: () => api.get('/rentals'),
  getById: (id) => api.get(`/rentals/${id}`),
  create: (data) => api.post('/rentals', data),
  updateStatus: (id, data) => api.put(`/rentals/${id}/status`, data),
  cancel: (id) => api.put(`/rentals/${id}/cancel`),
  addReview: (id, data) => api.post(`/rentals/${id}/review`, data),
};

export const mechanicsAPI = {
  getAll: () => api.get('/mechanics'),
  getById: (id) => api.get(`/mechanics/${id}`),
  getServices: (params) => api.get('/mechanics/services', { params }),
  getUserBookings: () => api.get('/mechanics/bookings/user'),
  getMechanicBookings: () => api.get('/mechanics/bookings/my'),
  createBooking: (data) => api.post('/mechanics/bookings', data),
  updateBookingStatus: (id, data) => api.put(`/mechanics/bookings/${id}/status`, data),
  addReview: (id, data) => api.post(`/mechanics/bookings/${id}/review`, data),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: () => api.get('/admin/users'),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  registerMechanic: (data) => api.post('/admin/mechanics', data),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAllRead: () => api.put('/notifications/read-all'),
};

export default api;
