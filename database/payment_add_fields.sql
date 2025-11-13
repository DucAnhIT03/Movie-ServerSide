-- Migration: Thêm các field mới cho Payment entity
-- Chạy migration này để thêm payment_url, qr_code, expires_at vào bảng Payments
USE `cinema_dev`;
ALTER TABLE Payments 
ADD COLUMN payment_url TEXT NULL AFTER transaction_id,
ADD COLUMN qr_code TEXT NULL AFTER payment_url,
ADD COLUMN expires_at DATETIME NULL AFTER qr_code;

