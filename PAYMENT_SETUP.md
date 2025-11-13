# Hướng dẫn cấu hình hệ thống thanh toán

## 📋 Các bước cần thực hiện

### 1. Cập nhật Database

Chạy migration SQL để thêm các field mới:

```bash
# Chạy file migration
mysql -u your_username -p your_database < database/payment_add_fields.sql
```

Hoặc chạy trực tiếp trong MySQL:
```sql
ALTER TABLE Payments 
ADD COLUMN payment_url TEXT NULL AFTER transaction_id,
ADD COLUMN qr_code TEXT NULL AFTER payment_url,
ADD COLUMN expires_at DATETIME NULL AFTER qr_code;
```

### 2. Cấu hình biến môi trường (.env)

Thêm các biến sau vào file `.env` của backend:

```env
# ============================================
# PAYMENT GATEWAY CONFIGURATION
# ============================================

# VNPAY Configuration
VNPAY_TMN_CODE=your_vnpay_tmn_code
VNPAY_HASH_SECRET=your_vnpay_hash_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
# Production: https://www.vnpayment.vn/paymentv2/vpcpay.html

# VietQR Configuration
VIETQR_ACCOUNT_NO=your_bank_account_number
VIETQR_ACCOUNT_NAME=YOUR_COMPANY_NAME
VIETQR_TEMPLATE=compact2
# Template options: compact, compact2, qr_only

# Viettel Money Configuration
VIETTEL_MERCHANT_ID=your_viettel_merchant_id

# PayPal Configuration (Optional)
PAYPAL_URL=https://www.sandbox.paypal.com/checkoutnow
# Production: https://www.paypal.com/checkoutnow

# Application URL (for return URLs)
APP_URL=http://localhost:3000
# Production: https://yourdomain.com
```

### 3. Lấy thông tin từ các cổng thanh toán

#### VNPAY:
1. Đăng ký tài khoản tại: https://sandbox.vnpayment.vn/
2. Lấy `TMN_CODE` và `HASH_SECRET` từ dashboard
3. Cấu hình IPN URL (Webhook): `https://yourdomain.com/payments/webhook`

#### VietQR:
1. Đăng ký tại: https://www.vietqr.io/
2. Lấy thông tin tài khoản ngân hàng
3. Sử dụng API để tạo QR code động

#### Viettel Money:
1. Liên hệ Viettel để đăng ký merchant account
2. Lấy Merchant ID và API credentials

### 4. Cấu hình Webhook

Các cổng thanh toán sẽ gửi callback đến endpoint:
```
POST /payments/webhook
```

Body format:
```json
{
  "method": "VNPAY",
  "data": {
    // Callback data từ cổng thanh toán
  }
}
```

**Lưu ý:** 
- Đảm bảo server của bạn có thể nhận request từ internet (không chỉ localhost)
- Sử dụng HTTPS trong production
- Cấu hình firewall để cho phép webhook từ các cổng thanh toán

### 5. Test hệ thống

#### Test với VNPAY Sandbox:
1. Sử dụng thẻ test: `9704198526191432198`
2. Ngày hết hạn: Bất kỳ ngày trong tương lai
3. CVV: `123`
4. OTP: `123456`

#### Test flow:
1. Tạo booking
2. Chọn phương thức thanh toán
3. Kiểm tra payment URL/QR code được tạo
4. Thực hiện thanh toán
5. Kiểm tra polling tự động cập nhật trạng thái
6. Xác nhận chuyển đến trang thành công

### 6. Frontend Configuration

Đảm bảo `axiosClient.js` trỏ đúng backend URL:

```javascript
const axiosClient = axios.create({
  baseURL: "http://localhost:3000", // Hoặc URL backend của bạn
  // ...
});
```

### 7. Production Checklist

- [ ] Cập nhật database với migration
- [ ] Cấu hình tất cả biến môi trường
- [ ] Đăng ký tài khoản với các cổng thanh toán
- [ ] Cấu hình webhook URLs
- [ ] Test toàn bộ flow thanh toán
- [ ] Chuyển sang production URLs (không dùng sandbox)
- [ ] Cấu hình HTTPS
- [ ] Kiểm tra security (CORS, authentication)
- [ ] Monitor logs và errors

## 🔍 Troubleshooting

### Lỗi: "Payment verification failed"
- Kiểm tra HASH_SECRET có đúng không
- Kiểm tra signature verification logic

### QR Code không hiển thị
- Kiểm tra VIETQR_ACCOUNT_NO và VIETQR_ACCOUNT_NAME
- Kiểm tra network có thể truy cập vietqr.io không

### Polling không hoạt động
- Kiểm tra console log trong browser
- Kiểm tra payment status trong database
- Kiểm tra network requests

### Webhook không nhận được
- Kiểm tra server có thể nhận request từ internet
- Kiểm tra firewall settings
- Kiểm tra logs của cổng thanh toán

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Backend logs
2. Browser console
3. Network tab trong DevTools
4. Database để xem payment status

