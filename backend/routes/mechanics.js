const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, adminAuth, mechanicAuth } = require('../middleware/auth');

// GET /api/mechanics - Get all mechanics
router.get('/', async (req, res) => {
  try {
    const [mechanics] = await db.execute(
      `SELECT m.*, u.name, u.email, u.phone, u.profile_image
       FROM mechanics m
       JOIN users u ON m.user_id = u.id
       WHERE m.is_available = TRUE AND u.is_active = TRUE
       ORDER BY m.rating DESC`
    );
    res.json({ success: true, count: mechanics.length, data: mechanics });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/mechanics/services - Get all services
router.get('/services', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM mechanic_services WHERE is_active = TRUE';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY category, name';
    const [services] = await db.execute(query, params);
    res.json({ success: true, data: services });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/mechanics/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT m.*, u.name, u.email, u.phone, u.profile_image
       FROM mechanics m JOIN users u ON m.user_id = u.id
       WHERE m.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Mechanic not found' });

    const [reviews] = await db.execute(
      `SELECT r.*, u.name as user_name FROM reviews r
       JOIN users u ON r.user_id = u.id
       WHERE r.review_type = 'mechanic' AND r.reference_id = ?
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...rows[0], reviews } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/mechanics/bookings/all - For mechanic/admin
router.get('/bookings/my', auth, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'mechanic') {
      const [mech] = await db.execute('SELECT id FROM mechanics WHERE user_id = ?', [req.user.id]);
      if (!mech.length) return res.status(404).json({ success: false, message: 'Mechanic profile not found' });

      query = `SELECT mb.*, ms.name as service_name, ms.category as service_category,
               u.name as customer_name, u.phone as customer_phone, u.email as customer_email
               FROM mechanic_bookings mb
               JOIN mechanic_services ms ON mb.service_id = ms.id
               JOIN users u ON mb.user_id = u.id
               WHERE mb.mechanic_id = ?
               ORDER BY mb.created_at DESC`;
      params = [mech[0].id];
    } else if (req.user.role === 'admin') {
      query = `SELECT mb.*, ms.name as service_name, ms.category as service_category,
               u.name as customer_name, u.phone as customer_phone,
               um.name as mechanic_name
               FROM mechanic_bookings mb
               JOIN mechanic_services ms ON mb.service_id = ms.id
               JOIN users u ON mb.user_id = u.id
               JOIN mechanics m ON mb.mechanic_id = m.id
               JOIN users um ON m.user_id = um.id
               ORDER BY mb.created_at DESC`;
      params = [];
    } else {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const [bookings] = await db.execute(query, params);
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/mechanics/bookings/user - Customer's bookings
router.get('/bookings/user', auth, async (req, res) => {
  try {
    const [bookings] = await db.execute(
      `SELECT mb.*, ms.name as service_name, ms.category as service_category,
       u.name as mechanic_name, u.phone as mechanic_phone
       FROM mechanic_bookings mb
       JOIN mechanic_services ms ON mb.service_id = ms.id
       JOIN mechanics m ON mb.mechanic_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE mb.user_id = ?
       ORDER BY mb.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/mechanics/bookings - Create mechanic booking
router.post('/bookings', auth, async (req, res) => {
  try {
    const { mechanic_id, service_id, car_make, car_model, car_year, car_license, booking_date, address, problem_description, urgency } = req.body;

    if (!mechanic_id || !service_id || !booking_date || !address) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Check mechanic exists
    const [mechanic] = await db.execute('SELECT id FROM mechanics WHERE id = ? AND is_available = TRUE', [mechanic_id]);
    if (!mechanic.length) return res.status(400).json({ success: false, message: 'Mechanic not available' });

    // Get service base price
    const [service] = await db.execute('SELECT * FROM mechanic_services WHERE id = ? AND is_active = TRUE', [service_id]);
    if (!service.length) return res.status(400).json({ success: false, message: 'Service not found' });

    const [result] = await db.execute(
      `INSERT INTO mechanic_bookings (user_id, mechanic_id, service_id, car_make, car_model, car_year, car_license, booking_date, address, problem_description, urgency, estimated_price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, mechanic_id, service_id, car_make, car_model, car_year, car_license, booking_date, address, problem_description, urgency || 'normal', service[0].base_price]
    );

    // Notify user
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [req.user.id, 'Mechanic Booking Received', `Your booking for ${service[0].name} has been received. A mechanic will confirm shortly.`, 'booking']
    );

    res.status(201).json({
      success: true,
      message: 'Mechanic booking created successfully',
      data: { id: result.insertId, estimated_price: service[0].base_price }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/mechanics/bookings/:id/status - Mechanic or admin update status
router.put('/bookings/:id/status', auth, async (req, res) => {
  try {
    const { status, mechanic_notes, final_price } = req.body;
    const validStatuses = ['pending', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const [bookings] = await db.execute('SELECT * FROM mechanic_bookings WHERE id = ?', [req.params.id]);
    if (!bookings.length) return res.status(404).json({ success: false, message: 'Booking not found' });

    const booking = bookings[0];

    // Check authorization for mechanic role
    if (req.user.role === 'mechanic') {
      const [mech] = await db.execute('SELECT id FROM mechanics WHERE user_id = ?', [req.user.id]);
      if (!mech.length || mech[0].id !== booking.mechanic_id) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updates = { status };
    if (mechanic_notes) updates.mechanic_notes = mechanic_notes;
    if (final_price) updates.final_price = final_price;
    if (status === 'completed') updates.completed_at = new Date();

    await db.execute(
      'UPDATE mechanic_bookings SET status=?, mechanic_notes=?, final_price=?, completed_at=? WHERE id=?',
      [status, mechanic_notes || booking.mechanic_notes, final_price || booking.final_price, status === 'completed' ? new Date() : booking.completed_at, req.params.id]
    );

    // Notify customer
    await db.execute(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [booking.user_id, `Service ${status}`, `Your mechanic service request has been updated to: ${status}`, 'booking']
    );

    res.json({ success: true, message: 'Booking status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/mechanics/bookings/:id/review
router.post('/bookings/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const [bookings] = await db.execute(
      'SELECT * FROM mechanic_bookings WHERE id = ? AND user_id = ? AND status = "completed"',
      [req.params.id, req.user.id]
    );
    if (!bookings.length) return res.status(400).json({ success: false, message: 'Booking not found or not completed' });

    await db.execute(
      'INSERT INTO reviews (user_id, review_type, reference_id, booking_id, rating, comment) VALUES (?, "mechanic", ?, ?, ?, ?)',
      [req.user.id, bookings[0].mechanic_id, req.params.id, rating, comment]
    );

    // Update mechanic average rating
    const [avgResult] = await db.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM reviews WHERE review_type = "mechanic" AND reference_id = ?',
      [bookings[0].mechanic_id]
    );
    await db.execute(
      'UPDATE mechanics SET rating = ?, total_reviews = ? WHERE id = ?',
      [avgResult[0].avg_rating, avgResult[0].total, bookings[0].mechanic_id]
    );

    res.status(201).json({ success: true, message: 'Review submitted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
