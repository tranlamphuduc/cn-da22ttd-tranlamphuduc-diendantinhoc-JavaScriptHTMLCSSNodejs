-- Thêm các cột cho chức năng quên mật khẩu
ALTER TABLE users 
ADD COLUMN reset_otp VARCHAR(6) DEFAULT NULL,
ADD COLUMN reset_otp_expiry TIMESTAMP NULL DEFAULT NULL;