# AutoEase — Car Rental & Remote Mechanic Service

A full-stack web application with 3 core modules, built for AWS deployment.

---

## 📦 Project Structure

```
autoease/
├── backend/              # Node.js + Express REST API
│   ├── config/db.js      # MySQL/RDS connection
│   ├── middleware/auth.js # JWT auth middleware
│   ├── routes/
│   │   ├── auth.js       # Register, login, profile
│   │   ├── cars.js       # Car CRUD + availability
│   │   ├── rentals.js    # Rental bookings
│   │   ├── mechanics.js  # Mechanic bookings
│   │   ├── admin.js      # Admin dashboard
│   │   └── notifications.js
│   └── server.js
├── frontend/             # React.js SPA
│   └── src/
│       ├── pages/        # All page components
│       ├── components/   # Reusable UI (Navbar)
│       ├── context/      # Auth context
│       └── services/api.js  # Axios API layer
└── database/
    └── schema.sql        # Full DB schema + seed data
```

---

## 🧩 Core Modules (3 FYP-Level)

### Module 1: Car Rental System
- Browse, filter, and search available vehicles (by category, location, price, transmission)
- View car details with features and customer reviews
- Book a car with date/location selection and price calculation
- Admin manages fleet (CRUD), updates rental statuses
- Customers can cancel pending/confirmed bookings
- Post-rental review system

### Module 2: Remote Mechanic Service
- Browse certified mechanics with ratings and specializations
- View available services with categories, pricing, duration
- Book a mechanic with vehicle info, address, urgency level
- Mechanic dashboard to accept, track progress, and complete jobs
- Real-time status tracking (pending → accepted → en_route → in_progress → completed)
- Post-service review and mechanic rating aggregation

### Module 3: User & Admin Management
- JWT-based authentication with role system (customer / admin / mechanic)
- Customer registration, profile management, password change
- Admin dashboard with revenue stats and recent activity
- Admin user management (activate/deactivate accounts)
- Notification system for booking updates
- Multi-role access control middleware

---

## 🧪 Test Cases (15 Scenarios)

### Authentication Module (TC01–TC04)
| ID | Scenario | Expected |
|----|----------|----------|
| TC01 | Register with valid data | 201 + JWT token |
| TC02 | Login with wrong password | 400 Invalid credentials |
| TC03 | Access protected route without token | 401 Unauthorized |
| TC04 | Register with duplicate email | 400 Email already registered |

### Car Rental Module (TC05–TC09)
| ID | Scenario | Expected |
|----|----------|----------|
| TC05 | Browse cars with category filter | Returns filtered list |
| TC06 | Book a car with valid dates | 201 Booking confirmed |
| TC07 | Book an already-rented car | 400 Car already booked |
| TC08 | Book with return date before pickup | 400 Validation error |
| TC09 | Admin updates rental status to 'active' | Car status changes to 'rented' |

### Mechanic Service Module (TC10–TC13)
| ID | Scenario | Expected |
|----|----------|----------|
| TC10 | Create mechanic booking with valid data | 201 Booking created |
| TC11 | Book unavailable mechanic | 400 Mechanic not available |
| TC12 | Mechanic updates status to 'completed' | Final price saved, customer notified |
| TC13 | Customer submits review after completed service | Rating aggregated on mechanic profile |

### Admin & Notifications (TC14–TC15)
| ID | Scenario | Expected |
|----|----------|----------|
| TC14 | Admin fetches dashboard stats | Returns revenue, counts, recent activity |
| TC15 | Booking triggers notification | Notification created in DB for customer |

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- MySQL 8.0+

### 1. Database Setup
```bash
mysql -u root -p < database/schema.sql
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your DB credentials and JWT secret
npm install
npm run dev
```
Server runs on: `http://localhost:5000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
```
App runs on: `http://localhost:3000`

### Default Login Credentials
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@autoease.com | password |
| Customer | ahmed@example.com | password |
| Mechanic | usman.mechanic@autoease.com | password |

---

## ☁️ AWS Deployment Guide

### Architecture
```
Route 53 (DNS)
    ↓
CloudFront CDN ←── S3 (React frontend static files)
    ↓
Application Load Balancer
    ↓
EC2 (Node.js backend) or ECS/Fargate
    ↓
Amazon RDS (MySQL)
    ↓
ElastiCache (optional: sessions/caching)
```

### Step-by-Step

#### 1. RDS (MySQL Database)
```
- Create RDS MySQL 8.0 instance (db.t3.micro for dev)
- Enable Multi-AZ for production
- Set DB name: autoease_db
- Note the endpoint URL
- Run schema.sql against the RDS endpoint
```

#### 2. EC2 (Backend)
```bash
# Launch EC2 (Ubuntu 22.04, t2.micro)
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Copy backend files, set .env with RDS endpoint
cd backend && npm install
pm2 start server.js --name autoease-api
pm2 startup && pm2 save
```

#### 3. S3 + CloudFront (Frontend)
```bash
# Build React app
cd frontend
REACT_APP_API_URL=https://your-ec2-or-alb-url/api npm run build

# Upload to S3
aws s3 sync build/ s3://your-bucket-name --delete

# Create CloudFront distribution pointing to S3 bucket
# Set default root object: index.html
# Add error page: 404 → /index.html (for React Router)
```

#### 4. Backend .env for Production
```env
NODE_ENV=production
DB_HOST=autoease-db.xxxxxxxx.us-east-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_PASSWORD=your_rds_password
DB_NAME=autoease_db
JWT_SECRET=your_production_secret_here
FRONTEND_URL=https://your-cloudfront-domain.cloudfront.net
```

#### 5. Security Groups
```
EC2 inbound: port 5000 from ALB security group only
RDS inbound: port 3306 from EC2 security group only
ALB inbound: port 80, 443 from 0.0.0.0/0
```

---

## 🔌 API Endpoints Summary

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` 🔒
- `PUT /api/auth/profile` 🔒
- `PUT /api/auth/change-password` 🔒

### Cars
- `GET /api/cars` — Filter by category, location, price, etc.
- `GET /api/cars/:id`
- `POST /api/cars` 🔒 Admin
- `PUT /api/cars/:id` 🔒 Admin
- `DELETE /api/cars/:id` 🔒 Admin
- `GET /api/cars/check-availability/:id`

### Rentals
- `GET /api/rentals` 🔒
- `GET /api/rentals/:id` 🔒
- `POST /api/rentals` 🔒
- `PUT /api/rentals/:id/status` 🔒 Admin
- `PUT /api/rentals/:id/cancel` 🔒
- `POST /api/rentals/:id/review` 🔒

### Mechanics
- `GET /api/mechanics`
- `GET /api/mechanics/services`
- `GET /api/mechanics/:id`
- `POST /api/mechanics/bookings` 🔒
- `GET /api/mechanics/bookings/user` 🔒
- `GET /api/mechanics/bookings/my` 🔒 Mechanic/Admin
- `PUT /api/mechanics/bookings/:id/status` 🔒 Mechanic/Admin
- `POST /api/mechanics/bookings/:id/review` 🔒

### Admin
- `GET /api/admin/dashboard` 🔒 Admin
- `GET /api/admin/users` 🔒 Admin
- `PUT /api/admin/users/:id/status` 🔒 Admin
- `POST /api/admin/mechanics` 🔒 Admin

### Notifications
- `GET /api/notifications` 🔒
- `PUT /api/notifications/read-all` 🔒

---

## 🚀 CI / AWS Setup Helpers

- Selenium tests are now organized under `tests/`:
  - `tests/pom.xml`
  - `tests/src/test/java/com/autoease/AutoEaseTest.java`
- Use `Dockerfile.tests` plus `run-tests.sh` to build the test image and execute the suite.
- On Ubuntu EC2, you can bootstrap Docker/Jenkins/Java with `ec2-setup.sh`.

### Run tests locally on an EC2 instance
```bash
APP_URL=http://<EC2_IP>:3000 ./run-tests.sh
```

### EC2 bootstrap
```bash
chmod +x ec2-setup.sh
./ec2-setup.sh
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, React Router v6, Axios |
| Backend | Node.js, Express.js |
| Database | MySQL 8.0 (Amazon RDS compatible) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Styling | Custom CSS (no framework) |
| AWS | EC2 + RDS + S3 + CloudFront |
