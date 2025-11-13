# Hướng dẫn kiểm tra và tạo dữ liệu test

## Vấn đề: Trang lịch chiếu không hiển thị phim

Trang lịch chiếu yêu cầu:
1. **Phim phải đã phát hành** (`release_date <= hôm nay`)
2. **Phim chưa hết hạn** (`end_date >= hôm nay` hoặc `NULL`)
3. **Phim phải có showtime chưa kết thúc** (`end_time >= hôm nay`) HOẶC **chưa có showtime nào**

## Cách kiểm tra dữ liệu

### Bước 1: Kiểm tra dữ liệu hiện tại

Chạy script kiểm tra:
```bash
mysql -u root -p cinema_dev < check_data.sql
```

Hoặc mở file `check_data.sql` trong phpMyAdmin và chạy từng query.

Script này sẽ hiển thị:
- Tổng số phim, phim đã phát hành, phim sắp chiếu
- Phim đủ điều kiện để hiển thị
- Tổng số showtime, showtime còn hiệu lực, showtime đã hết hạn
- Chi tiết showtime hiện tại

### Bước 2: Tạo dữ liệu mẫu (nếu chưa có)

Nếu chưa có dữ liệu, chạy:
```bash
mysql -u root -p cinema_dev < demo_seed_mysql.sql
```

### Bước 3: Tạo showtime test

Để tạo showtime cho hôm nay và các ngày tiếp theo:
```bash
mysql -u root -p cinema_dev < create_test_showtimes.sql
```

Script này sẽ:
- Tạo showtime cho hôm nay (bắt đầu sau 2 giờ)
- Tạo showtime cho ngày mai (14:00)
- Tạo showtime cho ngày kia (18:00)
- Hiển thị kết quả sau khi tạo

## Cách tạo showtime thủ công trong Admin

1. **Đăng nhập Admin Panel**
2. Vào **Quản lý Lịch Chiếu**
3. Nhấn **"Thêm Lịch Chiếu"**
4. Điền thông tin:
   - **Phim**: Chọn phim đã phát hành
   - **Phòng chiếu**: Chọn phòng chiếu
   - **Thời gian bắt đầu**: Phải ít nhất 1 giờ từ bây giờ
   - **Thời gian kết thúc**: Phải sau thời gian bắt đầu
5. Nhấn **"Lưu"**

## Lưu ý quan trọng

- **Thời gian bắt đầu** phải ít nhất **1 giờ** từ thời điểm hiện tại
- **Thời gian kết thúc** phải sau **thời gian bắt đầu**
- Phim phải có **release_date <= hôm nay** để hiển thị
- Showtime phải có **end_time >= hôm nay** để phim hiển thị

## Troubleshooting

### Không có phim nào hiển thị

1. Kiểm tra có phim trong database:
   ```sql
   SELECT * FROM Movies;
   ```

2. Kiểm tra phim có release_date đúng:
   ```sql
   SELECT id, title, release_date, end_date 
   FROM Movies 
   WHERE release_date <= NOW() 
     AND (end_date IS NULL OR end_date >= NOW());
   ```

3. Kiểm tra có showtime:
   ```sql
   SELECT * FROM ShowTimes WHERE end_time >= NOW();
   ```

### Phim có nhưng không hiển thị

1. Kiểm tra showtime của phim:
   ```sql
   SELECT st.*, m.title 
   FROM ShowTimes st
   JOIN Movies m ON st.movie_id = m.id
   WHERE m.id = [ID_PHIM] AND st.end_time >= NOW();
   ```

2. Kiểm tra release_date và end_date:
   ```sql
   SELECT id, title, release_date, end_date 
   FROM Movies 
   WHERE id = [ID_PHIM];
   ```

## Test nhanh

Để test nhanh, chạy các lệnh SQL sau:

```sql
-- Tạo showtime cho hôm nay (nếu có phim ID = 1 và screen ID = 1)
INSERT INTO ShowTimes (screen_id, movie_id, start_time, end_time, created_at, updated_at) 
VALUES (1, 1, DATE_ADD(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 4 HOUR), NOW(), NULL);

-- Kiểm tra kết quả
SELECT m.title, st.start_time, st.end_time 
FROM ShowTimes st
JOIN Movies m ON st.movie_id = m.id
WHERE st.end_time >= NOW();
```

