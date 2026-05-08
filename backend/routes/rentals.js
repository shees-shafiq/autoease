const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, adminAuth } = require('../middleware/auth');

// GET /api/rentals - Get user's rentals (or all for admin)
router.get('/', auth, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      query = `SELECT r.*, c.make, c.model, c.year, c.license_plate, c.category, c.images,
               u.name as user_name, u.email as user_email, u.phone as user_phone
               FROM rentals r
               JOIN cars c ON r.car_id = c.id
               JOIN users u ON r.user_id = u.id
               ORDER BY r.created_at DESC`;
      params = [];
    } else {
      query = `SELECT r.*, c.make, c.model, c.year, c.license_plate, c.category, c.images
               FROM rentals r
               JOIN cars c ON r.car_id = c.id
               WHERE r.user_id = ?
               ORDER BY r.created_at DESC`;
      params = [req.user.id];
    }

    const [rentals] = await db.execute(query, params);
    res.json({ success: true, count: rentals.length, data: rentals });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/rentals/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [rentals] = await db.execute(
      `SELECT r.*, c.make, c.model, c.year, c.license_plate, c.color, c.category, c.images, c.features,
       u.name as user_name, u.email as user_email, u.phone as user_phone, u.driving_license
       FROM rentals r
       JOIN cars c ON r.car_id = c.id
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (!rentals.length) return res.status(404).json({ success: false, message: 'Rental not found' });

    // Authorization check
    if (req.user.role !== 'admin' && rentals[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: rentals[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/rentals - Create a new rental booking
router.post('/', auth, async (req, res) => {
  try {
    const { car_id, pickup_date, return_date, pickup_location, dropoff_location, payment_method, notes } = req.body;

    if (!car_id || !pickup_date || !return_date || !pickup_location || !dropoff_location) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Check car exists and is available
    const [cars] = await db.execute('SELECT * FROM cars WHERE id = ? AND status = "available"', [car_id]);
    if (!cars.length) return res.status(400).json({ success: false, message: 'Car not available' });

    const car = cars[0];

    // Check date conflicts
    const [conflicts] = await db.execute(
      `SELECT id FROM rentals WHERE car_id = ? AND status NOT IN ('cancelled','completed') AND NOT (return_date <= ? OR pickup_date >= ?)`,
      [car_id, pickup_date, return_date]
    );
    if (conflicts.length) return res.status(400).json({ success: false, message: 'Car already booked for selected dates' });

    // Calculate price
    const pickup = new Date(pickup_date);
    const returnD = new Date(return_date);
    const totalDays = Math.max(1, Math.ceil((returnD - pickup) / (1000 * 60 * 60 * 24)));
    const totalPrice = totalDays * parseFloat(car.price_per_day);

    const [result] = await db.execute(
      `INSERT INTO rentals (user_id, car_id, pickup_date, return_date, pickup_location, dropoff_location, total_days, base_price, total_price, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, car_id, pickup_date, return_date, pickup_location, dropoff_location, totalDays, car.price_per_day, totalPrice, payment_method || null, notes || null]
    );

    // Create notification
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [req.user.id, 'Rental Booking Received', `Your booking for ${car.make} ${car.model} has been received and is pending confirmation.`, 'booking']
    );

    res.status(201).json({
      success: true,
      message: 'Rental booked successfully',
      data: { id: result.insertId, total_days: totalDays, total_price: totalPrice }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/rentals/:id/status - Update rental status (admin)
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [rentals] = await db.execute('SELECT r.*, c.make, c.model FROM rentals r JOIN cars c ON r.car_id = c.id WHERE r.id = ?', [req.params.id]);
    if (!rentals.length) return res.status(404).json({ success: false, message: 'Rental not found' });

    await db.execute('UPDATE rentals SET status = ? WHERE id = ?', [status, req.params.id]);

    // Update car status accordingly
    if (status === 'active') {
      await db.execute('UPDATE cars SET status = "rented" WHERE id = ?', [rentals[0].car_id]);
    } else if (['completed', 'cancelled'].includes(status)) {
      await db.execute('UPDATE cars SET status = "available" WHERE id = ?', [rentals[0].car_id]);
    }

    // Notify user
    const rental = rentals[0];
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [rental.user_id, `Rental ${status.charAt(0).toUpperCase() + status.slice(1)}`, `Your rental for ${rental.make} ${rental.model} has been ${status}.`, 'booking']
    );

    res.json({ success: true, message: 'Rental status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/rentals/:id/cancel - User cancel their own rental
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const [rentals] = await db.execute('SELECT * FROM rentals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!rentals.length) return res.status(404).json({ success: false, message: 'Rental not found' });

    const rental = rentals[0];
    if (!['pending', 'confirmed'].includes(rental.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel rental at this stage' });
    }

    await db.execute('UPDATE rentals SET status = "cancelled" WHERE id = ?', [req.params.id]);
    await db.execute('UPDATE cars SET status = "available" WHERE id = ?', [rental.car_id]);

    res.json({ success: true, message: 'Rental cancelled successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/rentals/:id/review
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const [rentals] = await db.execute('SELECT * FROM rentals WHERE id = ? AND user_id = ? AND status = "completed"', [req.params.id, req.user.id]);
    if (!rentals.length) return res.status(400).json({ success: false, message: 'Rental not found or not completed' });

    await db.execute(
      'INSERT INTO reviews (user_id, review_type, reference_id, booking_id, rating, comment) VALUES (?, "car", ?, ?, ?, ?)',
      [req.user.id, rentals[0].car_id, req.params.id, rating, comment]
    );

    res.status(201).json({ success: true, message: 'Review submitted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
