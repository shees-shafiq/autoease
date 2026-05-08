const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { auth, adminAuth } = require('../middleware/auth');

// GET /api/cars - Get all available cars with filters
router.get('/', async (req, res) => {
  try {
    const { category, location, min_price, max_price, transmission, fuel_type, seats, status } = req.query;

    let query = 'SELECT * FROM cars WHERE 1=1';
    const params = [];

    if (category) { query += ' AND category = ?'; params.push(category); }
    if (location) { query += ' AND location LIKE ?'; params.push(`%${location}%`); }
    if (min_price) { query += ' AND price_per_day >= ?'; params.push(parseFloat(min_price)); }
    if (max_price) { query += ' AND price_per_day <= ?'; params.push(parseFloat(max_price)); }
    if (transmission) { query += ' AND transmission = ?'; params.push(transmission); }
    if (fuel_type) { query += ' AND fuel_type = ?'; params.push(fuel_type); }
    if (seats) { query += ' AND seats >= ?'; params.push(parseInt(seats)); }
    if (status) { query += ' AND status = ?'; params.push(status); }
    else { query += ' AND status = "available"'; }

    query += ' ORDER BY created_at DESC';

    const [cars] = await db.execute(query, params);
    res.json({ success: true, count: cars.length, data: cars });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/cars/:id
router.get('/:id', async (req, res) => {
  try {
    const [cars] = await db.execute('SELECT * FROM cars WHERE id = ?', [req.params.id]);
    if (!cars.length) return res.status(404).json({ success: false, message: 'Car not found' });

    // Get car reviews
    const [reviews] = await db.execute(
      `SELECT r.*, u.name as user_name FROM reviews r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.review_type = 'car' AND r.reference_id = ? 
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );

    res.json({ success: true, data: { ...cars[0], reviews } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/cars - Admin only
router.post('/', adminAuth, async (req, res) => {
  try {
    const { make, model, year, color, license_plate, category, transmission, fuel_type, seats, price_per_day, price_per_hour, description, features, images, location } = req.body;

    if (!make || !model || !year || !license_plate || !category || !price_per_day) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    const [result] = await db.execute(
      `INSERT INTO cars (make, model, year, color, license_plate, category, transmission, fuel_type, seats, price_per_day, price_per_hour, description, features, images, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [make, model, year, color, license_plate, category, transmission || 'automatic', fuel_type || 'petrol', seats || 5, price_per_day, price_per_hour || null, description, JSON.stringify(features || []), JSON.stringify(images || []), location]
    );

    res.status(201).json({ success: true, message: 'Car added successfully', id: result.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'License plate already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/cars/:id - Admin only
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { make, model, year, color, category, transmission, fuel_type, seats, price_per_day, price_per_hour, description, features, images, status, location } = req.body;

    await db.execute(
      `UPDATE cars SET make=?, model=?, year=?, color=?, category=?, transmission=?, fuel_type=?, seats=?, price_per_day=?, price_per_hour=?, description=?, features=?, images=?, status=?, location=? WHERE id=?`,
      [make, model, year, color, category, transmission, fuel_type, seats, price_per_day, price_per_hour, description, JSON.stringify(features || []), JSON.stringify(images || []), status, location, req.params.id]
    );

    res.json({ success: true, message: 'Car updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/cars/:id - Admin only
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    // Check if car has active rentals
    const [activeRentals] = await db.execute(
      "SELECT id FROM rentals WHERE car_id = ? AND status IN ('pending','confirmed','active')",
      [req.params.id]
    );

    if (activeRentals.length) {
      return res.status(400).json({ success: false, message: 'Cannot delete car with active rentals' });
    }

    await db.execute('DELETE FROM cars WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Car deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/cars/check-availability/:id
router.get('/check-availability/:id', async (req, res) => {
  try {
    const { pickup_date, return_date } = req.query;
    if (!pickup_date || !return_date) {
      return res.status(400).json({ success: false, message: 'Pickup and return dates required' });
    }

    const [conflicts] = await db.execute(
      `SELECT id FROM rentals 
       WHERE car_id = ? 
       AND status NOT IN ('cancelled', 'completed')
       AND NOT (return_date <= ? OR pickup_date >= ?)`,
      [req.params.id, pickup_date, return_date]
    );

    res.json({ success: true, available: conflicts.length === 0 });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
