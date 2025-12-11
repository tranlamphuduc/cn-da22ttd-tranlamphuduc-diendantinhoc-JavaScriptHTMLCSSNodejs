const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Cấu hình transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Gửi email liên hệ
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    // Map subject to Vietnamese
    const subjectMap = {
      'general': 'Câu hỏi chung',
      'technical': 'Hỗ trợ kỹ thuật',
      'account': 'Vấn đề tài khoản',
      'report': 'Báo cáo vi phạm',
      'suggestion': 'Góp ý, đề xuất',
      'partnership': 'Hợp tác',
      'other': 'Khác'
    };

    const subjectText = subjectMap[subject] || subject;

    // Email gửi đến admin
    const mailToAdmin = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Gửi đến chính email admin
      subject: `[Liên hệ] ${subjectText} - từ ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">📧 Tin nhắn liên hệ mới</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; width: 120px;">Họ tên:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Email:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Chủ đề:</td>
                <td style="padding: 10px; border-bottom: 1px solid #dee2e6;">${subjectText}</td>
              </tr>
            </table>
            <div style="margin-top: 20px;">
              <strong>Nội dung:</strong>
              <div style="background: white; padding: 15px; border-radius: 5px; margin-top: 10px; border: 1px solid #dee2e6;">
                ${message.replace(/\n/g, '<br>')}
              </div>
            </div>
          </div>
          <div style="padding: 15px; text-align: center; color: #6c757d; font-size: 12px;">
            Email này được gửi từ form liên hệ trên Diễn Đàn Tin Học
          </div>
        </div>
      `
    };

    // Email xác nhận gửi đến người dùng
    const mailToUser = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: `[Diễn Đàn Tin Học] Chúng tôi đã nhận được tin nhắn của bạn`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">✅ Xác nhận nhận tin nhắn</h2>
          </div>
          <div style="padding: 20px; background: #f8f9fa; border: 1px solid #dee2e6;">
            <p>Xin chào <strong>${name}</strong>,</p>
            <p>Cảm ơn bạn đã liên hệ với Diễn Đàn Tin Học!</p>
            <p>Chúng tôi đã nhận được tin nhắn của bạn với nội dung:</p>
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #667eea;">
              <strong>Chủ đề:</strong> ${subjectText}<br><br>
              <strong>Nội dung:</strong><br>
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p>Chúng tôi sẽ phản hồi trong vòng <strong>24-48 giờ làm việc</strong>.</p>
            <p>Trân trọng,<br><strong>Đội ngũ Diễn Đàn Tin Học</strong></p>
          </div>
          <div style="padding: 15px; text-align: center; color: #6c757d; font-size: 12px;">
            Đây là email tự động, vui lòng không trả lời trực tiếp email này.
          </div>
        </div>
      `
    };

    // Gửi cả 2 email
    await transporter.sendMail(mailToAdmin);
    await transporter.sendMail(mailToUser);

    res.json({ message: 'Gửi tin nhắn thành công!' });
  } catch (error) {
    console.error('Error sending contact email:', error);
    res.status(500).json({ message: 'Lỗi khi gửi tin nhắn. Vui lòng thử lại sau.' });
  }
});

module.exports = router;
