# QIU Campus Lost & Found System

A full-stack web application for Quest International University to manage lost and found item reports digitally.

## Tech Stack

| Layer    | Technology          |
|----------|---------------------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend  | Node.js + Express   |
| Database | MySQL 8.x           |
| Auth     | JWT (jsonwebtoken)  |
| Security | Helmet, bcryptjs, express-validator, xss |

## Features

- 🔐 User Registration & Login (JWT auth)
- 🔍 Submit Lost Item Reports
- 📦 Submit Found Item Reports
- ✏️  Edit your own reports
- 🗑️  Delete your own reports
- ✅ Update status (Active → Claimed/Resolved)
- 🔎 Filter by status, category, search
- 🔒 Full security: SQL injection prevention, XSS prevention, Helmet headers

## Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/qiu-lost-found.git
cd qiu-lost-found
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your MySQL credentials
```

### 4. Set up the database
```bash
mysql -u root -p < database/schema.sql
```

### 5. Start the server
```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

Visit `http://localhost:3000`

## Project Structure

```
qiu-lost-found/
├── server.js           # Main Express application
├── db.js               # MySQL connection pool
├── .env.example        # Environment variables template
├── routes/
│   ├── auth.js         # POST /api/auth/login, /register
│   └── items.js        # GET/POST/PUT/PATCH/DELETE /api/items
├── middleware/
│   └── authMiddleware.js  # JWT verification
├── public/
│   ├── css/style.css   # All styles
│   ├── js/app.js       # Shared JS utilities
│   ├── index.html      # Redirect to login
│   ├── login.html      # Auth page
│   ├── home.html       # Dashboard
│   ├── report.html     # Submit report
│   ├── lost.html       # Lost items list
│   └── found.html      # Found items list
└── database/
    └── schema.sql      # Database schema
```

## API Endpoints

| Method | Endpoint                  | Auth | Description          |
|--------|---------------------------|------|----------------------|
| POST   | /api/auth/register        | ✗    | Register new user    |
| POST   | /api/auth/login           | ✗    | Login, get JWT       |
| GET    | /api/items                | ✓    | List all items       |
| GET    | /api/items/:id            | ✓    | Get single item      |
| POST   | /api/items                | ✓    | Create new report    |
| PUT    | /api/items/:id            | ✓    | Update full report   |
| PATCH  | /api/items/:id/status     | ✓    | Update status only   |
| DELETE | /api/items/:id            | ✓    | Delete report        |

## Security Measures

- Passwords hashed with **bcrypt** (cost factor 12)
- All SQL uses **parameterized queries** (no SQL injection)
- Input sanitized with **xss** library
- HTTP headers secured with **Helmet**
- Rate limiting on auth endpoints (20 req/15min)
- JWT expiry (7 days)
- `.env` for all credentials (never committed to git)
- Owner-only edit/delete enforcement

## Deployment

Deployed on [Railway / Render / Heroku]:  
🔗 **Live URL:** https://your-deployed-url.com

## Author

Student Name: ___________________  
Student ID: ___________________  
Course: BIT1107 / BCS2024 Web Technologies  
Institution: Quest International University
