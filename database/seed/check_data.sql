-- Script kiểm tra dữ liệu hiện tại
USE `cinema_dev`;
-- 1. Kiểm tra số lượng phim
SELECT 
    COUNT(*) as total_movies,
    COUNT(CASE WHEN release_date <= NOW() THEN 1 END) as released_movies,
    COUNT(CASE WHEN release_date > NOW() THEN 1 END) as upcoming_movies
FROM Movies;

-- 2. Kiểm tra phim đang chiếu (theo logic backend)
SELECT 
    m.id,
    m.title,
    m.release_date,
    m.end_date,
    CASE 
        WHEN m.release_date <= NOW() AND (m.end_date IS NULL OR m.end_date >= NOW()) THEN 'Đủ điều kiện'
        ELSE 'Không đủ điều kiện'
    END as condition_status
FROM Movies m
WHERE m.release_date <= NOW() 
  AND (m.end_date IS NULL OR m.end_date >= NOW());

-- 3. Kiểm tra showtime
SELECT 
    COUNT(*) as total_showtimes,
    COUNT(CASE WHEN end_time >= NOW() THEN 1 END) as active_showtimes,
    COUNT(CASE WHEN end_time < NOW() THEN 1 END) as expired_showtimes
FROM ShowTimes;

-- 4. Kiểm tra phim có showtime chưa kết thúc
SELECT 
    m.id,
    m.title,
    COUNT(st.id) as active_showtime_count,
    MIN(st.start_time) as earliest_showtime,
    MAX(st.end_time) as latest_showtime
FROM Movies m
LEFT JOIN ShowTimes st ON st.movie_id = m.id AND st.end_time >= NOW()
WHERE m.release_date <= NOW() 
  AND (m.end_date IS NULL OR m.end_date >= NOW())
GROUP BY m.id, m.title
ORDER BY m.id;

-- 5. Kiểm tra phim chưa có showtime
SELECT 
    m.id,
    m.title,
    m.release_date
FROM Movies m
LEFT JOIN ShowTimes st ON st.movie_id = m.id
WHERE m.release_date <= NOW() 
  AND (m.end_date IS NULL OR m.end_date >= NOW())
  AND st.id IS NULL;

-- 6. Chi tiết showtime hiện tại
SELECT 
    st.id,
    m.title as movie_title,
    s.name as screen_name,
    st.start_time,
    st.end_time,
    TIMESTAMPDIFF(HOUR, NOW(), st.start_time) as hours_until_start,
    CASE 
        WHEN st.end_time >= NOW() THEN 'Còn hiệu lực'
        ELSE 'Đã hết hạn'
    END as status
FROM ShowTimes st
JOIN Movies m ON st.movie_id = m.id
LEFT JOIN Screens s ON st.screen_id = s.id
ORDER BY st.start_time ASC;

