import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.post('/api/contact', formData);
      setSuccess('Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">
                <i className="fas fa-envelope me-2"></i>
                Liên hệ với chúng tôi
              </h4>
            </div>
            <div className="card-body">
              <div className="row">
                {/* Contact Info */}
                <div className="col-lg-5 mb-4 mb-lg-0">
                  <h5 className="mb-4">Thông tin liên hệ</h5>
                  
                  <div className="contact-info">
                    <div className="d-flex mb-4">
                      <div className="contact-icon me-3">
                        <i className="fas fa-map-marker-alt text-primary" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Địa chỉ</h6>
                        <p className="text-muted mb-0">
                          Số 126, đường Nguyễn Thiện Thành<br />
                          Phường Hòa Thuận, Tỉnh Vĩnh Long
                        </p>
                      </div>
                    </div>

                    <div className="d-flex mb-4">
                      <div className="contact-icon me-3">
                        <i className="fas fa-envelope text-primary" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Email</h6>
                        <p className="text-muted mb-0">
                          <a href="mailto:katozamata@gmail.com">katozamata@gmail.com</a>
                        </p>
                      </div>
                    </div>

                    <div className="d-flex mb-4">
                      <div className="contact-icon me-3">
                        <i className="fas fa-phone text-primary" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Điện thoại</h6>
                        <p className="text-muted mb-0">
                          0764 236 846<br />
                          (Thứ 2 - Thứ 6, 9:00 - 17:00)
                        </p>
                      </div>
                    </div>

                    <div className="d-flex mb-4">
                      <div className="contact-icon me-3">
                        <i className="fas fa-clock text-primary" style={{ fontSize: '1.5rem' }}></i>
                      </div>
                      <div>
                        <h6 className="mb-1">Thời gian phản hồi</h6>
                        <p className="text-muted mb-0">
                          Thường trong vòng 24-48 giờ làm việc
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Social Links */}
                  <h6 className="mb-3">Theo dõi chúng tôi</h6>
                  <div className="d-flex gap-2">
                    <a href="https://www.facebook.com/phu.uc.859680" target="_blank" rel="noopener noreferrer" className="btn btn-outline-primary btn-sm">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a href="mailto:katozamata@gmail.com" className="btn btn-outline-danger btn-sm">
                      <i className="fab fa-google"></i>
                    </a>
                    <a href="https://www.youtube.com/@katozamata9540" target="_blank" rel="noopener noreferrer" className="btn btn-outline-danger btn-sm">
                      <i className="fab fa-youtube"></i>
                    </a>
                    <a href="https://github.com/tranlamphuduc" target="_blank" rel="noopener noreferrer" className="btn btn-outline-secondary btn-sm github-btn">
                      <i className="fab fa-github"></i>
                    </a>
                  </div>
                </div>

                {/* Contact Form */}
                <div className="col-lg-7">
                  <h5 className="mb-4">Gửi tin nhắn</h5>
                  
                  <form onSubmit={handleSubmit}>
                    {success && (
                      <div className="alert alert-success mb-3">
                        <i className="fas fa-check-circle me-2"></i>
                        {success}
                      </div>
                    )}
                    {error && (
                      <div className="alert alert-danger mb-3">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        {error}
                      </div>
                    )}
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Họ tên <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Nhập họ tên của bạn"
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Chủ đề <span className="text-danger">*</span></label>
                      <select
                        className="form-select"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Chọn chủ đề</option>
                        <option value="general">Câu hỏi chung</option>
                        <option value="technical">Hỗ trợ kỹ thuật</option>
                        <option value="account">Vấn đề tài khoản</option>
                        <option value="report">Báo cáo vi phạm</option>
                        <option value="suggestion">Góp ý, đề xuất</option>
                        <option value="partnership">Hợp tác</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label">Nội dung <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows="5"
                        placeholder="Nhập nội dung tin nhắn..."
                        required
                      ></textarea>
                    </div>

                    <div className="d-grid">
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Gửi tin nhắn
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="mt-5 pt-4 border-top">
                <h5 className="mb-4">
                  <i className="fas fa-question-circle me-2"></i>
                  Câu hỏi thường gặp
                </h5>
                <div className="accordion" id="faqAccordion">
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                        Làm sao để đăng bài viết?
                      </button>
                    </h2>
                    <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        Sau khi đăng nhập, bạn có thể nhấn nút "Tạo bài viết" ở trang chủ hoặc thanh điều hướng. 
                        Điền tiêu đề, chọn danh mục, viết nội dung và nhấn "Đăng bài".
                      </div>
                    </div>
                  </div>
                  
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                        Tôi quên mật khẩu, phải làm sao?
                      </button>
                    </h2>
                    <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        Bạn có thể sử dụng chức năng "Quên mật khẩu" ở trang đăng nhập. 
                        Nhập email đã đăng ký và làm theo hướng dẫn trong email để đặt lại mật khẩu.
                      </div>
                    </div>
                  </div>
                  
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                        Bài viết của tôi bị xóa, tại sao?
                      </button>
                    </h2>
                    <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        Bài viết có thể bị xóa nếu vi phạm <Link to="/rules">quy tắc diễn đàn</Link>. 
                        Bạn sẽ nhận được thông báo với lý do cụ thể. Nếu có thắc mắc, vui lòng liên hệ admin.
                      </div>
                    </div>
                  </div>
                  
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                        Làm sao để trở thành admin/moderator?
                      </button>
                    </h2>
                    <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                      <div className="accordion-body">
                        Chúng tôi tuyển chọn moderator dựa trên đóng góp tích cực cho cộng đồng. 
                        Hãy tham gia đăng bài, bình luận hữu ích và tuân thủ quy tắc. 
                        Khi có nhu cầu, chúng tôi sẽ liên hệ với những thành viên phù hợp.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
