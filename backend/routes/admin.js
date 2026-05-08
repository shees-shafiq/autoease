const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { adminAuth } = require('../middleware/auth');

// GET /api/admin/dashboard - Stats overview
router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const [[totalUsers]] = await db.execute("SELECT COUNT(*) as count FROM users WHERE role = 'customer'");
    const [[totalCars]] = await db.execute("SELECT COUNT(*) as count FROM cars");
    const [[availableCars]] = await db.execute("SELECT COUNT(*) as count FROM cars WHERE status = 'available'");
    const [[totalRentals]] = await db.execute("SELECT COUNT(*) as count FROM rentals");
    const [[activeRentals]] = await db.execute("SELECT COUNT(*) as count FROM rentals WHERE status = 'active'");
    const [[totalMechanicBookings]] = await db.execute("SELECT COUNT(*) as count FROM mechanic_bookings");
    const [[pendingMechanicBookings]] = await db.execute("SELECT COUNT(*) as count FROM mechanic_bookings WHERE status = 'pending'");
    const [[rentalRevenue]] = await db.execute("SELECT SUM(total_price) as total FROM rentals WHERE status = 'completed'");
    const [[mechanicRevenue]] = await db.execute("SELECT SUM(final_price) as total FROM mechanic_bookings WHERE status = 'completed'");

    // Recent rentals
    const [recentRentals] = await db.execute(
      `SELECT r.id, r.status, r.total_price, r.created_at, u.name as user_name, c.make, c.model
       FROM rentals r JOIN users u ON r.user_id = u.id JOIN cars c ON r.car_id = c.id
       ORDER BY r.created_at DESC LIMIT 5`
    );

    // Recent mechanic bookings
    const [recentMechanic] = await db.execute(
      `SELECT mb.id, mb.status, mb.urgency, mb.created_at, u.name as user_name, ms.name as service_name
       FROM mechanic_bookings mb JOIN users u ON mb.user_id = u.id JOIN mechanic_services ms ON mb.service_id = ms.id
       ORDER BY mb.created_at DESC LIMIT 5`
    );

    // Monthly revenue for chart
    const [monthlyRevenue] = await db.execute(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_price) as revenue, COUNT(*) as bookings
       FROM rentals WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month`
    );

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers: totalUsers.count,
          totalCars: totalCars.count,
          availableCars: availableCars.count,
          totalRentals: totalRentals.count,
          activeRentals: activeRentals.count,
          totalMechanicBookings: totalMechanicBookings.count,
          pendingMechanicBookings: pendingMechanicBookings.count,
          rentalRevenue: rentalRevenue.total || 0,
          mechanicRevenue: mechanicRevenue.total || 0,
          totalRevenue: (rentalRevenue.total || 0) + (mechanicRevenue.total || 0)
        },
        recentRentals,
        recentMechanic,
        monthlyRevenue
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/users
router.get('/users', adminAuth, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', adminAuth, async (req, res) => {
  try {
    const { is_active } = req.body;
    await db.execute('UPDATE users SET is_active = ? WHERE id = ?', [is_active, req.params.id]);
    res.json({ success: true, message: `User ${is_active ? 'activated' : 'deactivated'} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/admin/mechanics - Register a mechanic
router.post('/mechanics', adminAuth, async (req, res) => {
  try {
    const { user_id, specialization, experience_years, service_area, hourly_rate, bio } = req.body;

    // Update user role to mechanic
    await db.execute("UPDATE users SET role = 'mechanic' WHERE id = ?", [user_id]);

    const [result] = await db.execute(
      'INSERT INTO mechanics (user_id, specialization, experience_years, service_area, hourly_rate, bio) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, specialization, experience_years || 0, service_area, hourly_rate, bio]
    );

    res.status(201).json({ success: true, message: 'Mechanic registered', id: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
