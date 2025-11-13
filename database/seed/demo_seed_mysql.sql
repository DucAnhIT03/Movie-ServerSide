-- Demo seed data for MySQL/XAMPP
-- Compatible with current project schema
-- NOTE: Adjust bcrypt hash for admin password before running.

START TRANSACTION;

-- 1) Roles
INSERT INTO roles (role_name) VALUES ('ROLE_ADMIN'), ('ROLE_USER')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- 2) Admin user (replace password hash)
-- bcrypt for 'Admin@123' example: $2b$10$hZb8eKc6wX2a1oX1WJ8x0uP3ZkqVw3B5rjRr1pTQTHb6i7oQf1m2u
-- You SHOULD replace with your own secure hash
SET @admin_email := 'admin@example.com';
INSERT INTO users (first_name, last_name, email, password, status, created_at)
VALUES ('Admin', 'Root', @admin_email, '$2b$10$hZb8eKc6wX2a1oX1WJ8x0uP3ZkqVw3B5rjRr1pTQTHb6i7oQf1m2u', 'ACTIVE', NOW())
ON DUPLICATE KEY UPDATE email = VALUES(email);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = @admin_email AND r.role_name = 'ROLE_ADMIN'
ON DUPLICATE KEY UPDATE user_id = user_id;

-- 3) Theater, Screen, Seats
INSERT INTO Theaters (id, name, location, phone) VALUES (1, 'Cờ Thanh Xuân', 'Hà Nội', '0123456789')
ON DUPLICATE KEY UPDATE name = VALUES(name), location = VALUES(location), phone = VALUES(phone);

INSERT INTO Screens (id, theater_id, name, seat_capacity)
VALUES (1, 1, 'Phòng 1', 36)
ON DUPLICATE KEY UPDATE theater_id = VALUES(theater_id), name = VALUES(name), seat_capacity = VALUES(seat_capacity);

-- Minimal seats (extend as needed)
INSERT INTO Seats (screen_id, seat_number, is_variable, price, type, created_at, updated_at) VALUES
(1, 'A1', 0, NULL, 'STANDARD', NOW(), NULL),
(1, 'A2', 0, NULL, 'STANDARD', NOW(), NULL),
(1, 'A3', 0, NULL, 'VIP', NOW(), NULL),
(1, 'A4', 0, NULL, 'VIP', NOW(), NULL),
(1, 'A5', 0, NULL, 'SWEETBOX', NOW(), NULL),
(1, 'A6', 0, NULL, 'STANDARD', NOW(), NULL)
ON DUPLICATE KEY UPDATE type = VALUES(type);

-- 4) Movies (2D/3D)
INSERT INTO Movies (id, title, descriptions, author, image, trailer, type, duration, release_date, created_at) VALUES
(1, 'Phim Demo 2D', 'Mô tả phim 2D', NULL, NULL, NULL, '2D', 120, NOW(), NOW()),
(2, 'Phim Demo 3D', 'Mô tả phim 3D', NULL, NULL, NULL, '3D', 110, NOW(), NOW())
ON DUPLICATE KEY UPDATE title = VALUES(title), type = VALUES(type), duration = VALUES(duration);

-- 5) Showtimes for screen 1
INSERT INTO ShowTimes (id, screen_id, movie_id, start_time, end_time, created_at, updated_at) VALUES
(1, 1, 1, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 1 DAY + 2 HOUR), NOW(), NULL),
(2, 1, 2, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 2 DAY + 2 HOUR), NOW(), NULL)
ON DUPLICATE KEY UPDATE screen_id = VALUES(screen_id), movie_id = VALUES(movie_id), start_time = VALUES(start_time), end_time = VALUES(end_time);

-- 6) Ticket Prices (complete matrix for day_type 0/1)
-- Weekdays (Mon-Thu)
INSERT INTO Ticket_Prices (type_seat, type_movie, price, day_type, start_time, end_time, created_at) VALUES
('STANDARD','2D',70000, 0,'00:00','23:59', NOW()),
('VIP','2D',90000, 0,'00:00','23:59', NOW()),
('SWEETBOX','2D',120000, 0,'00:00','23:59', NOW()),
('STANDARD','3D',90000, 0,'00:00','23:59', NOW()),
('VIP','3D',110000, 0,'00:00','23:59', NOW()),
('SWEETBOX','3D',150000, 0,'00:00','23:59', NOW())
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- Weekends/Holidays (Fri-Sun)
INSERT INTO Ticket_Prices (type_seat, type_movie, price, day_type, start_time, end_time, created_at) VALUES
('STANDARD','2D',80000, 1,'00:00','23:59', NOW()),
('VIP','2D',100000, 1,'00:00','23:59', NOW()),
('SWEETBOX','2D',130000, 1,'00:00','23:59', NOW()),
('STANDARD','3D',100000, 1,'00:00','23:59', NOW()),
('VIP','3D',120000, 1,'00:00','23:59', NOW()),
('SWEETBOX','3D',160000, 1,'00:00','23:59', NOW())
ON DUPLICATE KEY UPDATE price = VALUES(price);

-- 7) Festival sample
INSERT INTO Festival (id, title, image, content, start_time, end_time, created_at, updated_at)
VALUES (1, 'Lễ hội phim 2026', NULL, 'Nội dung lễ hội demo', DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 15 DAY), NOW(), NULL)
ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), start_time = VALUES(start_time), end_time = VALUES(end_time);

COMMIT;

-- How to run:
-- Import this file via phpMyAdmin or:
-- mysql -u root -p cinema_dev < demo_seed_mysql.sql


