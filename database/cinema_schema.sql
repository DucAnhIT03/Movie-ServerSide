
CREATE DATABASE IF NOT EXISTS `cinema_dev`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `cinema_dev`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) users
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(255) NULL,
  `phone` VARCHAR(11) NULL,
  `address` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  `status` ENUM('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_status` (`status`),
  INDEX `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) roles
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_name` ENUM('ROLE_ADMIN','ROLE_USER') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) user_roles (composite PK)
CREATE TABLE IF NOT EXISTS `user_roles` (
  `user_id` INT NOT NULL,
  `role_id` INT NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  CONSTRAINT `fk_user_role_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_role_role` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) Theaters
CREATE TABLE IF NOT EXISTS `Theaters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `location` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_theater_location` (`location`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5) Screens
CREATE TABLE IF NOT EXISTS `Screens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `seat_capacity` INT NOT NULL,
  `theater_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_screens_theater` FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_screens_theater_id` (`theater_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6) Genre
CREATE TABLE IF NOT EXISTS `Genre` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `genre_name` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  UNIQUE KEY `uk_genre_name` (`genre_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7) Movies
CREATE TABLE IF NOT EXISTS `Movies` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `descriptions` TEXT NULL,
  `author` VARCHAR(100) NULL,
  `image` VARCHAR(255) NULL,
  `trailer` VARCHAR(255) NULL,
  `type` ENUM('2D','3D') NOT NULL,
  `duration` INT NOT NULL,
  `release_date` DATETIME NOT NULL,
  `end_date` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_movies_type` (`type`),
  INDEX `idx_movies_release_date` (`release_date`),
  INDEX `idx_movies_end_date` (`end_date`),
  FULLTEXT INDEX `ft_movies_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8) Movie_Genre (composite PK)
CREATE TABLE IF NOT EXISTS `Movie_Genre` (
  `movie_id` INT NOT NULL,
  `genre_id` INT NOT NULL,
  PRIMARY KEY (`movie_id`,`genre_id`),
  CONSTRAINT `fk_movie_genre_movie` FOREIGN KEY (`movie_id`) REFERENCES `Movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_movie_genre_genre` FOREIGN KEY (`genre_id`) REFERENCES `Genre`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9) ShowTimes
CREATE TABLE IF NOT EXISTS `ShowTimes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `screen_id` INT NOT NULL,
  `movie_id` INT NOT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_showtimes_screen` FOREIGN KEY (`screen_id`) REFERENCES `Screens`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_showtimes_movie` FOREIGN KEY (`movie_id`) REFERENCES `Movies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_showtimes_screen_id` (`screen_id`),
  INDEX `idx_showtimes_movie_id` (`movie_id`),
  INDEX `idx_showtimes_start_time` (`start_time`),
  INDEX `idx_showtimes_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10) Bookings
CREATE TABLE IF NOT EXISTS `Bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `showtime_id` INT NOT NULL,
  `total_seat` INT NOT NULL,
  `total_price_movie` DOUBLE NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_showtime` FOREIGN KEY (`showtime_id`) REFERENCES `ShowTimes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_bookings_user_id` (`user_id`),
  INDEX `idx_bookings_showtime_id` (`showtime_id`),
  INDEX `idx_bookings_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11) Seats
CREATE TABLE IF NOT EXISTS `Seats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `screen_id` INT NOT NULL,
  `seat_number` VARCHAR(50) NOT NULL,
  `is_variable` BIT(1) NOT NULL DEFAULT b'0',
  `price` DOUBLE NULL,
  `type` ENUM('STANDARD','VIP','SWEETBOX') NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_seats_screen` FOREIGN KEY (`screen_id`) REFERENCES `Screens`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY `uk_seat_screen_number` (`screen_id`,`seat_number`),
  INDEX `idx_seats_screen_id` (`screen_id`),
  INDEX `idx_seats_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12) Booking_Seat
CREATE TABLE IF NOT EXISTS `Booking_Seat` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `seat_id` INT NOT NULL,
  `quantity` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_booking_seat_booking` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_seat_seat` FOREIGN KEY (`seat_id`) REFERENCES `Seats`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_booking_seat_booking_id` (`booking_id`),
  INDEX `idx_booking_seat_seat_id` (`seat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13) Banners
CREATE TABLE IF NOT EXISTS `Banners` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `url` VARCHAR(255) NOT NULL,
  `type` ENUM('IMAGE','VIDEO') NOT NULL,
  `position` VARCHAR(255) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_banner_type` (`type`),
  INDEX `idx_banner_position` (`position`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14) Festival
CREATE TABLE IF NOT EXISTS `Festival` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `image` VARCHAR(255) NULL,
  `content` TEXT NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_festival_start_time` (`start_time`),
  INDEX `idx_festival_end_time` (`end_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14.5) Events
CREATE TABLE IF NOT EXISTS `Events` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `image` VARCHAR(255) NULL,
  `location` VARCHAR(255) NULL,
  `start_time` DATETIME NOT NULL,
  `end_time` DATETIME NOT NULL,
  `status` ENUM('UPCOMING','ONGOING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'UPCOMING',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_events_status` (`status`),
  INDEX `idx_events_start_time` (`start_time`),
  INDEX `idx_events_end_time` (`end_time`),
  INDEX `idx_events_location` (`location`),
  FULLTEXT INDEX `ft_events_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15) News
CREATE TABLE IF NOT EXISTS `News` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` LONGTEXT NULL,
  `festival_id` INT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  CONSTRAINT `fk_news_festival` FOREIGN KEY (`festival_id`) REFERENCES `Festival`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_news_festival_id` (`festival_id`),
  INDEX `idx_news_created_at` (`created_at`),
  FULLTEXT INDEX `ft_news_title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16) Ticket_Prices
CREATE TABLE IF NOT EXISTS `Ticket_Prices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type_seat` ENUM('STANDARD','VIP','SWEETBOX') NOT NULL,
  `type_movie` ENUM('2D','3D') NOT NULL,
  `theater_id` INT NULL,
  `price` DOUBLE NOT NULL,
  `day_type` BIT(1) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_ticket_price_type_seat` (`type_seat`),
  INDEX `idx_ticket_price_type_movie` (`type_movie`),
  INDEX `idx_ticket_price_theater_id` (`theater_id`),
  CONSTRAINT `fk_ticket_price_theater` FOREIGN KEY (`theater_id`) REFERENCES `Theaters`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_ticket_price_day_type` (`day_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17) Payments
CREATE TABLE IF NOT EXISTS `Payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `booking_id` INT NOT NULL,
  `payment_method` ENUM('VIETQR','VNPAY','VIETTEL_PAY','PAYPAL') NOT NULL,
  `payment_status` ENUM('PENDING','COMPLETED','FAILED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `payment_time` DATETIME NULL,
  `amount` DECIMAL(12,2) NOT NULL DEFAULT 0,
  `transaction_id` VARCHAR(255) NULL,
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`booking_id`) REFERENCES `Bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_payments_booking_id` (`booking_id`),
  INDEX `idx_payments_status` (`payment_status`),
  INDEX `idx_payments_method` (`payment_method`),
  INDEX `idx_payments_transaction_id` (`transaction_id`),
  INDEX `idx_payments_payment_time` (`payment_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18) Promotions
CREATE TABLE IF NOT EXISTS `promotions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(100) NOT NULL UNIQUE,
  `title` VARCHAR(255) NULL,
  `description` TEXT NULL,
  `discountType` ENUM('PERCENT','AMOUNT') NOT NULL DEFAULT 'PERCENT',
  `discountValue` DECIMAL(10,2) NOT NULL,
  `startAt` DATETIME NULL,
  `endAt` DATETIME NULL,
  `status` ENUM('ACTIVE','BLOCKED') NOT NULL DEFAULT 'ACTIVE',
  `channelEmail` BIT(1) NOT NULL DEFAULT b'0',
  `channelInApp` BIT(1) NOT NULL DEFAULT b'1',
  `usageLimit` INT NULL,
  `perUserLimit` INT NULL,
  `active` BIT(1) NOT NULL DEFAULT b'1',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL,
  INDEX `idx_promotions_code` (`code`),
  INDEX `idx_promotions_status` (`status`),
  INDEX `idx_promotions_active` (`active`),
  INDEX `idx_promotions_start_at` (`startAt`),
  INDEX `idx_promotions_end_at` (`endAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19) user_promotions (composite PK)
CREATE TABLE IF NOT EXISTS `user_promotions` (
  `user_id` INT NOT NULL,
  `promotion_id` INT NOT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`user_id`,`promotion_id`),
  CONSTRAINT `fk_user_promotion_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_user_promotion_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_user_promotions_user_id` (`user_id`),
  INDEX `idx_user_promotions_promotion_id` (`promotion_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Email Logs (for tracking sent emails)
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `to` VARCHAR(255) NOT NULL,
  `subject` VARCHAR(500) NOT NULL,
  `type` VARCHAR(50) NULL,
  `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
  `error` TEXT NULL,
  `message_id` VARCHAR(255) NULL,
  `sent_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `metadata` JSON NULL,
  INDEX `idx_to` (`to`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- 1) Insert Roles
INSERT INTO `roles` (`id`, `role_name`) VALUES
(1, 'ROLE_ADMIN'),
(2, 'ROLE_USER')
ON DUPLICATE KEY UPDATE `role_name` = VALUES(`role_name`);


-- Email: admin@cinema.com
-- Password: admin123

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password`, `avatar`, `phone`, `address`, `created_at`, `updated_at`, `status`) VALUES
(1, 'Admin', 'System', 'admin@cinema.com', '$2b$10$d.on067W8auJwc6RvmDAdeMfWL3LL73O0p5qY9hxEDnPtwkjYoCB6', NULL, NULL, NULL, NOW(), NULL, 'ACTIVE')
ON DUPLICATE KEY UPDATE `email` = VALUES(`email`);

-- 3) Assign ROLE_ADMIN to admin user
INSERT INTO `user_roles` (`user_id`, `role_id`) VALUES
(1, 1)
ON DUPLICATE KEY UPDATE `user_id` = VALUES(`user_id`);

-- ============================================
-- KIỂM TRA TÍNH NHẤT QUÁN DỮ LIỆU
-- ============================================

-- 1. KIỂM TRA MOVIES VÀ GENRES
-- 1.1. Phim không có thể loại nào
SELECT 
    m.id,
    m.title,
    'Phim không có thể loại' AS issue
FROM Movies m
LEFT JOIN Movie_Genre mg ON m.id = mg.movie_id
WHERE mg.movie_id IS NULL;

-- 1.2. Movie_Genre có movie_id không tồn tại
SELECT 
    mg.movie_id,
    mg.genre_id,
    'Movie_Genre có movie_id không tồn tại' AS issue
FROM Movie_Genre mg
LEFT JOIN Movies m ON mg.movie_id = m.id
WHERE m.id IS NULL;

-- 1.3. Movie_Genre có genre_id không tồn tại
SELECT 
    mg.movie_id,
    mg.genre_id,
    'Movie_Genre có genre_id không tồn tại' AS issue
FROM Movie_Genre mg
LEFT JOIN Genre g ON mg.genre_id = g.id
WHERE g.id IS NULL;

-- 2. KIỂM TRA MOVIES VÀ SHOWTIMES
-- 2.1. Phim không có suất chiếu nào
SELECT 
    m.id,
    m.title,
    'Phim không có suất chiếu' AS issue
FROM Movies m
LEFT JOIN ShowTimes st ON m.id = st.movie_id
WHERE st.movie_id IS NULL;

-- 2.2. ShowTimes có movie_id không tồn tại
SELECT 
    st.id,
    st.movie_id,
    st.screen_id,
    'ShowTimes có movie_id không tồn tại' AS issue
FROM ShowTimes st
LEFT JOIN Movies m ON st.movie_id = m.id
WHERE m.id IS NULL;

-- 2.3. ShowTimes có screen_id không tồn tại
SELECT 
    st.id,
    st.movie_id,
    st.screen_id,
    'ShowTimes có screen_id không tồn tại' AS issue
FROM ShowTimes st
LEFT JOIN Screens s ON st.screen_id = s.id
WHERE s.id IS NULL;

-- 3. KIỂM TRA SCREENS VÀ THEATERS
-- 3.1. Phòng chiếu không có rạp (theater_id không tồn tại)
SELECT 
    s.id,
    s.name,
    s.theater_id,
    'Phòng chiếu có theater_id không tồn tại' AS issue
FROM Screens s
LEFT JOIN Theaters t ON s.theater_id = t.id
WHERE t.id IS NULL;

-- 3.2. Rạp không có phòng chiếu nào
SELECT 
    t.id,
    t.name,
    t.location,
    'Rạp không có phòng chiếu nào' AS issue
FROM Theaters t
LEFT JOIN Screens s ON t.id = s.theater_id
WHERE s.theater_id IS NULL;

-- 4. KIỂM TRA SHOWTIMES VÀ SCREENS
-- 4.1. Phòng chiếu không có suất chiếu nào
SELECT 
    s.id,
    s.name,
    s.theater_id,
    'Phòng chiếu không có suất chiếu' AS issue
FROM Screens s
LEFT JOIN ShowTimes st ON s.id = st.screen_id
WHERE st.screen_id IS NULL;

-- 5. KIỂM TRA DỮ LIỆU HỢP LỆ
-- 5.1. ShowTimes có end_time < start_time
SELECT 
    st.id,
    st.movie_id,
    st.screen_id,
    st.start_time,
    st.end_time,
    'ShowTimes có end_time < start_time' AS issue
FROM ShowTimes st
WHERE st.end_time < st.start_time;

-- 5.2. Movies có duration <= 0
SELECT 
    m.id,
    m.title,
    m.duration,
    'Phim có duration <= 0' AS issue
FROM Movies m
WHERE m.duration <= 0;

-- 5.3. Screens có seat_capacity <= 0
SELECT 
    s.id,
    s.name,
    s.seat_capacity,
    'Phòng chiếu có seat_capacity <= 0' AS issue
FROM Screens s
WHERE s.seat_capacity <= 0;

-- 5.4. Movies có end_date < release_date
SELECT 
    m.id,
    m.title,
    m.release_date,
    m.end_date,
    'Phim có end_date < release_date' AS issue
FROM Movies m
WHERE m.end_date IS NOT NULL
  AND m.end_date < m.release_date;

-- 6. TỔNG HỢP THỐNG KÊ
SELECT 
    'Tổng số phim' AS metric,
    COUNT(*) AS count
FROM Movies
UNION ALL
SELECT 
    'Tổng số thể loại' AS metric,
    COUNT(*) AS count
FROM Genre
UNION ALL
SELECT 
    'Tổng số rạp' AS metric,
    COUNT(*) AS count
FROM Theaters
UNION ALL
SELECT 
    'Tổng số phòng chiếu' AS metric,
    COUNT(*) AS count
FROM Screens
UNION ALL
SELECT 
    'Tổng số suất chiếu' AS metric,
    COUNT(*) AS count
FROM ShowTimes
UNION ALL
SELECT 
    'Tổng số liên kết Movie-Genre' AS metric,
    COUNT(*) AS count
FROM Movie_Genre
UNION ALL
SELECT 
    'Phim có thể loại' AS metric,
    COUNT(DISTINCT movie_id) AS count
FROM Movie_Genre
UNION ALL
SELECT 
    'Phim có suất chiếu' AS metric,
    COUNT(DISTINCT movie_id) AS count
FROM ShowTimes;