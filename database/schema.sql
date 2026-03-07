-- ============================================================
-- Campus Lost & Found System — Database Schema
-- Run this file once to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS lost_found_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lost_found_db;

-- ─── USERS TABLE ─────────────────────────────────────────────
-- Stores registered users (students / staff)
CREATE TABLE IF NOT EXISTS users (
  id         INT          AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,              -- bcrypt hash, never plaintext
  created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── ITEMS TABLE ─────────────────────────────────────────────
-- Each row = one lost OR found report
CREATE TABLE IF NOT EXISTS items (
  id              INT          AUTO_INCREMENT PRIMARY KEY,
  user_id         INT          NOT NULL,

  -- Core fields
  type            ENUM('lost','found')                      NOT NULL,
  title           VARCHAR(200)                              NOT NULL,
  description     TEXT                                      NOT NULL,
  category        ENUM('Electronics','Clothing','Accessories',
                       'Books & Stationery','ID & Cards',
                       'Keys','Bags','Sports Equipment','Other') NOT NULL,
  location        VARCHAR(250) NOT NULL,
  date_occurred   DATE         NOT NULL,
  time_occurred   TIME         DEFAULT NULL,

  -- Contact details (person who reported)
  contact_name    VARCHAR(100) NOT NULL,
  contact_email   VARCHAR(150) NOT NULL,
  contact_phone   VARCHAR(20)  DEFAULT NULL,

  -- Workflow status
  status          ENUM('active','claimed','resolved') DEFAULT 'active',

  created_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_items_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── INDEXES ─────────────────────────────────────────────────
-- Speed up common queries (filter by type & status)
CREATE INDEX idx_items_type   ON items(type);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_user   ON items(user_id);

-- ─── DEMO DATA (optional — remove in production) ─────────────
-- Insert a test user  (password = "Test@1234" — bcrypt hash below)
INSERT IGNORE INTO users (name, email, password) VALUES
('Demo Student', 'demo@qiu.edu.my',
 '$2a$12$LQv3c1yqBW0Hq0H0E0K0u.Fvm7W8v/QQ0zH5K0UGTBjQ0ZcM9tBni');
