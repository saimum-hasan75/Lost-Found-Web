-- ============================================
-- Pinboard Lost & Found — Database Schema
-- MySQL 8.x
-- ============================================

CREATE DATABASE IF NOT EXISTS lost_and_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE lost_and_found;

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(150) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(30),
  role        ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_user_email (email),
  INDEX idx_user_role (role)
) ENGINE=InnoDB;

-- ============================================
-- Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS items (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  post_type      ENUM('lost', 'found') NOT NULL,
  title          VARCHAR(150) NOT NULL,
  category       VARCHAR(60)  NOT NULL,
  description    TEXT,
  location       VARCHAR(150) NOT NULL,
  date_occurred  DATE NOT NULL,
  contact_name   VARCHAR(100) NOT NULL,
  contact_email  VARCHAR(150) NOT NULL,
  contact_phone  VARCHAR(30),
  image_url      VARCHAR(255),
  status         ENUM('open', 'resolved') NOT NULL DEFAULT 'open',
  user_id        INT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_post_type (post_type),
  INDEX idx_category (category),
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  CONSTRAINT fk_items_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;
