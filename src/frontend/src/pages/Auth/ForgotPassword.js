import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: nhập email, 2: nhập OTP và mật khẩu mới
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [inputKey, setInputKey] = useState(Date.now()); // Key để force re-render input
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        email: formData.email
      });

      setMessage(response.data.message);
      setStep(2);
      // Reset input key để force re-render và tránh autocomplete
      setInputKey(Date.now());
      // Clear form data để tránh autocomplete
      setFormData(prev => ({
        ...prev,
        otp: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('/api/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword
      });

      setMessage(response.data.message);
      // Chuyển về bước 1 sau 3 giây
      setTimeout(() => {
        setStep(1);
        setFormData({
          email: '',
          otp: '',
          newPassword: '',
          confirmPassword: ''
        });
        setMessage('');
      }, 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep(1);
    setFormData({
      ...formData,
      otp: '',
      newPassword: '',
      confirmPassword: ''
    });
    setError('');
    setMessage('');
  };

  // Force clear inputs khi chuyển sang bước 2
  useEffect(() => {
    if (step === 2) {
      // Delay một chút để đảm bảo DOM đã render
      setTimeout(() => {
        const otpInput = document.querySelector(`#otp-${inputKey}`);
        const pwdInput = document.querySelector('#newPassword');
        const confirmPwdInput = document.querySelector('#confirmPassword');

        if (otpInput && otpInput.value !== formData.otp) {
          otpInput.value = '';
          setFormData(prev => ({ ...prev, otp: '' }));
        }
        if (pwdInput && pwdInput.value !== formData.newPassword) {
          pwdInput.value = '';
          setFormData(prev => ({ ...prev, newPassword: '' }));
        }
        if (confirmPwdInput && confirmPwdInput.value !== formData.confirmPassword) {
          confirmPwdInput.value = '';
          setFormData(prev => ({ ...prev, confirmPassword: '' }));
        }
      }, 100);
    }
  }, [step, inputKey]);

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <div className="card">
            <div className="card-header text-center">
              <h4 className="mb-0">
                <i className="fas fa-key me-2"></i>
                Quên mật khẩu
              </h4>
            </div>
            <div className="card-body">
              {message && (
                <div className="alert alert-success" role="alert">
                  <i className="fas fa-check-circle me-2"></i>
                  {message}
                </div>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              {step === 1 ? (
                // Bước 1: Nhập email
                <form onSubmit={handleSendOTP}>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="fas fa-envelope me-2"></i>
                      Email đăng ký
                    </label>
                    <input
                      type="email"
                      className="form-control"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Nhập email của bạn"
                      required
                    />
                    <div className="form-text">
                      Chúng tôi sẽ gửi mã OTP đến email này
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Gửi mã OTP
                      </>
                    )}
                  </button>
                </form>
              ) : (
                // Bước 2: Nhập OTP và mật khẩu mới
                <form onSubmit={handleResetPassword} autoComplete="off">
                  {/* Hidden input để đánh lừa browser autocomplete */}
                  <input type="text" style={{ display: 'none' }} />
                  <input type="password" style={{ display: 'none' }} />

                  <div className="mb-3">
                    <label htmlFor="otp" className="form-label">
                      <i className="fas fa-shield-alt me-2"></i>
                      Mã OTP
                    </label>
                    <input
                      key={`otp-${inputKey}`}
                      type="text"
                      className="form-control text-center"
                      id={`otp-${inputKey}`}
                      name={`otp-code-${inputKey}`}
                      value={formData.otp}
                      onChange={(e) => {
                        // Chỉ cho phép nhập số
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setFormData({ ...formData, otp: value });
                      }}
                      onInput={(e) => {
                        // Xóa bất kỳ giá trị tự động điền nào không phải số
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value !== e.target.value) {
                          e.target.value = value;
                          setFormData({ ...formData, otp: value });
                        }
                      }}
                      placeholder="Nhập 6 chữ số"
                      maxLength="6"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      data-lpignore="true"
                      data-form-type="other"
                      style={{}}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      <i className="fas fa-lock me-2"></i>
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="new-pwd-field"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                      placeholder="Nhập mật khẩu mới"
                      minLength="6"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      <i className="fas fa-lock me-2"></i>
                      Xác nhận mật khẩu
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="confirmPassword"
                      name="confirm-pwd-field"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Nhập lại mật khẩu mới"
                      minLength="6"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      data-lpignore="true"
                      data-form-type="other"
                      required
                    />
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i>
                          Đặt lại mật khẩu
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleBackToEmail}
                      disabled={loading}
                    >
                      <i className="fas fa-arrow-left me-2"></i>
                      Quay lại
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-3">
                <p className="mb-0">
                  Nhớ mật khẩu? <Link to="/login">Đăng nhập</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;