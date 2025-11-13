-- Script tạo showtime test để hiển thị phim đang chiếu
-- Chạy script này để tạo showtime cho hôm nay và các ngày tiếp theo
USE `cinema_dev`;
START TRANSACTION;

-- Xóa các showtime cũ nếu cần (tùy chọn)
-- DELETE FROM ShowTimes WHERE id > 100;

-- Tạo showtime cho hôm nay (bắt đầu từ 2 giờ sau, kết thúc sau 2 giờ)
INSERT INTO ShowTimes (screen_id, movie_id, start_time, end_time, created_at, updated_at) 
SELECT 
    1 as screen_id,
    id as movie_id,
    DATE_ADD(NOW(), INTERVAL 2 HOUR) as start_time,
    DATE_ADD(NOW(), INTERVAL 4 HOUR) as end_time,
    NOW() as created_at,
    NULL as updated_at
FROM Movies 
WHERE release_date <= NOW() 
  AND (end_date IS NULL OR end_date >= NOW())
LIMIT 5
ON DUPLICATE KEY UPDATE 
    start_time = VALUES(start_time),
    end_time = VALUES(end_time);

-- Tạo showtime cho ngày mai
INSERT INTO ShowTimes (screen_id, movie_id, start_time, end_time, created_at, updated_at) 
SELECT 
    1 as screen_id,
    id as movie_id,
    DATE_ADD(DATE(NOW() + INTERVAL 1 DAY), INTERVAL 14 HOUR) as start_time, -- 14:00 ngày mai
    DATE_ADD(DATE(NOW() + INTERVAL 1 DAY), INTERVAL 16 HOUR) as end_time,   -- 16:00 ngày mai
    NOW() as created_at,
    NULL as updated_at
FROM Movies 
WHERE release_date <= DATE_ADD(NOW(), INTERVAL 1 DAY)
  AND (end_date IS NULL OR end_date >= DATE_ADD(NOW(), INTERVAL 1 DAY))
LIMIT 5
ON DUPLICATE KEY UPDATE 
    start_time = VALUES(start_time),
    end_time = VALUES(end_time);

-- Tạo showtime cho ngày kia
INSERT INTO ShowTimes (screen_id, movie_id, start_time, end_time, created_at, updated_at) 
SELECT 
    1 as screen_id,
    id as movie_id,
    DATE_ADD(DATE(NOW() + INTERVAL 2 DAY), INTERVAL 18 HOUR) as start_time, -- 18:00 ngày kia
    DATE_ADD(DATE(NOW() + INTERVAL 2 DAY), INTERVAL 20 HOUR) as end_time,   -- 20:00 ngày kia
    NOW() as created_at,
    NULL as updated_at
FROM Movies 
WHERE release_date <= DATE_ADD(NOW(), INTERVAL 2 DAY)
  AND (end_date IS NULL OR end_date >= DATE_ADD(NOW(), INTERVAL 2 DAY))
LIMIT 5
ON DUPLICATE KEY UPDATE 
    start_time = VALUES(start_time),
    end_time = VALUES(end_time);

COMMIT;

-- Kiểm tra kết quả
SELECT 
    st.id,
    m.title as movie_title,
    s.name as screen_name,
    st.start_time,
    st.end_time,
    CASE 
        WHEN st.end_time >= NOW() THEN 'Còn hiệu lực'
        ELSE 'Đã hết hạn'
    END as status
FROM ShowTimes st
JOIN Movies m ON st.movie_id = m.id
JOIN Screens s ON st.screen_id = s.id
ORDER BY st.start_time ASC
LIMIT 20;

