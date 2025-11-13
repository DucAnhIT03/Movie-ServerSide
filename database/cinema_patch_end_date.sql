USE `cinema_dev`;

-- 1. Thêm cột end_date cho bảng Movies (nếu chưa có)
ALTER TABLE `Movies`
  ADD COLUMN `end_date` DATETIME NULL
  AFTER `release_date`;

-- 2. Thêm index cho end_date để tăng tốc truy vấn theo ngày kết thúc
ALTER TABLE `Movies`
  ADD INDEX `idx_movies_end_date` (`end_date`);

-- 3. (Tuỳ chọn) Đồng bộ dữ liệu cũ:
--    Nếu muốn set end_date mặc định bằng release_date cho các phim chưa có giá trị.
-- UPDATE `Movies`
-- SET `end_date` = `release_date`
-- WHERE `end_date` IS NULL;

-- 4. Truy vấn kiểm tra: phát hiện phim có end_date nhỏ hơn release_date
SELECT 
    m.id,
    m.title,
    m.release_date,
    m.end_date,
    'Phim có end_date < release_date' AS issue
FROM `Movies` m
WHERE m.end_date IS NOT NULL
  AND m.end_date < m.release_date;

