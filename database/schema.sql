-- AutoEase Database Schema
-- MySQL / Amazon RDS Compatible

CREATE DATABASE IF NOT EXISTS autoease_db;
USE autoease_db;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('customer', 'admin', 'mechanic') DEFAULT 'customer',
  profile_image VARCHAR(255),
  driving_license VARCHAR(100),
  license_expiry DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: cars
-- ============================================================
CREATE TABLE IF NOT EXISTS cars (
  id INT AUTO_INCREMENT PRIMARY KEY,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  year INT NOT NULL,
  color VARCHAR(30),
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  category ENUM('economy', 'sedan', 'suv', 'luxury', 'van', 'sports') NOT NULL,
  transmission ENUM('automatic', 'manual') DEFAULT 'automatic',
  fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') DEFAULT 'petrol',
  seats INT DEFAULT 5,
  price_per_day DECIMAL(10,2) NOT NULL,
  price_per_hour DECIMAL(10,2),
  mileage INT DEFAULT 0,
  description TEXT,
  features JSON,
  images JSON,
  status ENUM('available', 'rented', 'maintenance', 'inactive') DEFAULT 'available',
  location VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE: rentals
-- ============================================================
CREATE TABLE IF NOT EXISTS rentals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  car_id INT NOT NULL,
  pickup_date DATETIME NOT NULL,
  return_date DATETIME NOT NULL,
  actual_return_date DATETIME,
  pickup_location VARCHAR(255) NOT NULL,
  dropoff_location VARCHAR(255) NOT NULL,
  total_days INT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  additional_charges DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') DEFAULT 'pending',
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: mechanics
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  specialization VARCHAR(100),
  experience_years INT DEFAULT 0,
  certifications JSON,
  service_area VARCHAR(255),
  hourly_rate DECIMAL(10,2) NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  bio TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: mechanic_services
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_services (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category ENUM('engine', 'transmission', 'brakes', 'electrical', 'tires', 'ac', 'body', 'diagnostics', 'general') NOT NULL,
  estimated_duration INT COMMENT 'in minutes',
  base_price DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- TABLE: mechanic_bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS mechanic_bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  mechanic_id INT NOT NULL,
  service_id INT NOT NULL,
  car_make VARCHAR(50),
  car_model VARCHAR(50),
  car_year INT,
  car_license VARCHAR(20),
  booking_date DATETIME NOT NULL,
  address TEXT NOT NULL,
  coordinates VARCHAR(100),
  problem_description TEXT,
  urgency ENUM('low', 'normal', 'urgent', 'emergency') DEFAULT 'normal',
  status ENUM('pending', 'accepted', 'en_route', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  mechanic_notes TEXT,
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  payment_status ENUM('pending', 'paid', 'refunded') DEFAULT 'pending',
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mechanic_id) REFERENCES mechanics(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES mechanic_services(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  review_type ENUM('car', 'mechanic') NOT NULL,
  reference_id INT NOT NULL COMMENT 'car_id or mechanic_id',
  booking_id INT COMMENT 'rental_id or mechanic_booking_id',
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: payments
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  booking_type ENUM('rental', 'mechanic') NOT NULL,
  booking_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  method ENUM('credit_card', 'debit_card', 'bank_transfer', 'cash', 'wallet') NOT NULL,
  transaction_id VARCHAR(100),
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('booking', 'payment', 'reminder', 'promotion', 'system') DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin User', 'admin@autoease.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '+923001234567');

-- Sample customers (password: password)
INSERT INTO users (name, email, password, role, phone, address) VALUES
('Ahmed Khan', 'ahmed@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+923101234567', 'Lahore, Punjab'),
('Sara Ali', 'sara@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+923201234567', 'Karachi, Sindh'),
('Bilal Hassan', 'bilal@example.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+923331234567', 'Islamabad');

-- Mechanic users (password: password)
INSERT INTO users (name, email, password, role, phone) VALUES
('Usman Raza', 'usman.mechanic@autoease.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mechanic', '+923451234567'),
('Tariq Mehmood', 'tariq.mechanic@autoease.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'mechanic', '+923461234567');

-- Mechanics profile
INSERT INTO mechanics (user_id, specialization, experience_years, service_area, hourly_rate, rating, total_reviews, bio) VALUES
(5, 'Engine & Transmission Specialist', 8, 'Lahore, Islamabad', 2500.00, 4.7, 45, 'Certified master mechanic with 8 years of experience in engine overhauls and transmission repairs.'),
(6, 'Electrical & Diagnostics Expert', 5, 'Karachi, Lahore', 2000.00, 4.5, 30, 'Expert in modern vehicle electrical systems, ECU diagnostics and air conditioning repairs.');

-- Cars
INSERT INTO cars (make, model, year, color, license_plate, category, transmission, fuel_type, seats, price_per_day, price_per_hour, mileage, description, features, status, location) VALUES
('Toyota', 'Corolla', 2022, 'White', 'LHR-1234', 'sedan', 'automatic', 'petrol', 5, 5000.00, 700.00, 15000, 'Well-maintained Toyota Corolla, perfect for city drives.', '["AC", "GPS", "Bluetooth", "Backup Camera"]', 'available', 'Lahore'),
('Honda', 'Civic', 2023, 'Silver', 'LHR-5678', 'sedan', 'automatic', 'petrol', 5, 6000.00, 850.00, 8000, 'Latest Honda Civic with all modern features.', '["AC", "GPS", "Sunroof", "Apple CarPlay", "Heated Seats"]', 'available', 'Lahore'),
('Toyota', 'Fortuner', 2022, 'Black', 'KHI-2345', 'suv', 'automatic', 'diesel', 7, 12000.00, 1500.00, 22000, 'Powerful Fortuner SUV ideal for long trips and rough terrain.', '["AC", "4WD", "GPS", "7 Seats", "Roof Rails"]', 'available', 'Karachi'),
('Suzuki', 'Alto', 2023, 'Red', 'ISB-3456', 'economy', 'manual', 'petrol', 5, 2500.00, 400.00, 5000, 'Fuel-efficient economy car for budget-conscious travelers.', '["AC", "Power Windows"]', 'available', 'Islamabad'),
('Kia', 'Sportage', 2023, 'Grey', 'LHR-7890', 'suv', 'automatic', 'petrol', 5, 9000.00, 1200.00, 12000, 'Stylish Kia Sportage with premium interior and safety features.', '["AC", "GPS", "Panoramic Sunroof", "Cruise Control", "Lane Assist"]', 'available', 'Lahore'),
('Mercedes', 'E-Class', 2022, 'Black', 'LHR-9999', 'luxury', 'automatic', 'petrol', 5, 25000.00, 3000.00, 18000, 'Luxurious Mercedes E-Class for executive travel.', '["AC", "GPS", "Massage Seats", "Premium Sound", "Night Vision"]', 'available', 'Lahore'),
('Toyota', 'Hiace', 2021, 'White', 'KHI-1111', 'van', 'manual', 'diesel', 12, 15000.00, 1800.00, 45000, 'Spacious Toyota Hiace for group travel and cargo.', '["AC", "Large Cargo Space", "12 Seats"]', 'available', 'Karachi');

-- Mechanic Services
INSERT INTO mechanic_services (name, description, category, estimated_duration, base_price) VALUES
('Engine Diagnostics', 'Full computer diagnostics of engine systems', 'diagnostics', 60, 1500.00),
('Oil Change', 'Engine oil and filter replacement', 'engine', 30, 800.00),
('Brake Inspection & Repair', 'Complete brake system check and pad replacement', 'brakes', 90, 2500.00),
('Tyre Replacement', 'Tyre removal, replacement and balancing', 'tires', 45, 500.00),
('Battery Replacement', 'Battery testing and replacement', 'electrical', 30, 1000.00),
('AC Service & Repair', 'AC gas refill and compressor check', 'ac', 120, 3000.00),
('Transmission Service', 'Automatic/manual transmission fluid change and inspection', 'transmission', 120, 4000.00),
('Roadside Assistance', 'Emergency roadside help — jump starts, towing coordination', 'general', 30, 1200.00),
('Full Service Package', 'Comprehensive vehicle health check and maintenance', 'general', 180, 8000.00),
('Suspension Check', 'Shock absorbers, struts and alignment inspection', 'general', 90, 2000.00);
