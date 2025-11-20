import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const TestNotifications = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const createTestNotification = async (type) => {
    setLoading(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const testData = {
        comment: {
          user_id: currentUser.id,
          type: 'comment',
          title: 'Có bình luận mới',
          message: 'Ai đó đã bình luận về bài viết "Test Post" của bạn',
          related_id: 1
        },
        post_deleted: {
          user_id: currentUser.id,
          type: 'post_deleted',
          title: 'Bài viết bị xóa',
          message: 'Bài viết "Test Post" của bạn đã bị xóa bởi quản trị viên. Lý do: Nội dung không phù hợp',
          related_id: null
        },
        comment_deleted: {
          user_id: currentUser.id,
          type: 'comment_deleted',
          title: 'Bình luận bị xóa',
          message: 'Bình luận "Test comment..." của bạn đã bị xóa bởi quản trị viên. Lý do: Vi phạm quy định',
          related_id: null
        },
        document_deleted: {
          user_id: currentUser.id,
          type: 'document_deleted',
          title: 'Tài liệu bị xóa',
          message: 'Tài liệu "Test Document.pdf" của bạn đã bị xóa bởi quản trị viên. Lý do: Vi phạm bản quyền',
          related_id: null
        }
      };

      const response = await fetch('/api/notifications/create-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(testData[type])
      });

      if (response.ok) {
        setMessage(`Đã tạo thông báo test "${type}" thành công!`);
        // Reload trang để cập nhật số thông báo
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setMessage('Có lỗi xảy ra khi tạo thông báo test');
      }
    } catch (error) {
      console.error('Error creating test notification:', error);
      setMessage('Có lỗi xảy ra khi tạo thông báo test');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          Vui lòng đăng nhập để test hệ thống thông báo
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-bell me-2"></i>
                Test Hệ Thống Thông Báo
              </h4>
            </div>
            <div className="card-body">
              <p className="text-muted">
                Trang này dùng để test hệ thống thông báo. Nhấn các nút bên dưới để tạo thông báo test.
              </p>

              {message && (
                <div className={`alert ${message.includes('thành công') ? 'alert-success' : 'alert-danger'}`}>
                  {message}
                </div>
              )}

              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-comment fa-3x text-primary mb-3"></i>
                      <h5>Thông báo bình luận</h5>
                      <p className="text-muted">Test thông báo khi có người bình luận bài viết</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => createTestNotification('comment')}
                        disabled={loading}
                      >
                        {loading ? 'Đang tạo...' : 'Tạo thông báo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-trash fa-3x text-danger mb-3"></i>
                      <h5>Bài viết bị xóa</h5>
                      <p className="text-muted">Test thông báo khi admin xóa bài viết</p>
                      <button 
                        className="btn btn-danger"
                        onClick={() => createTestNotification('post_deleted')}
                        disabled={loading}
                      >
                        {loading ? 'Đang tạo...' : 'Tạo thông báo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-comment-slash fa-3x text-warning mb-3"></i>
                      <h5>Bình luận bị xóa</h5>
                      <p className="text-muted">Test thông báo khi admin xóa bình luận</p>
                      <button 
                        className="btn btn-warning"
                        onClick={() => createTestNotification('comment_deleted')}
                        disabled={loading}
                      >
                        {loading ? 'Đang tạo...' : 'Tạo thông báo'}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 mb-3">
                  <div className="card h-100">
                    <div className="card-body text-center">
                      <i className="fas fa-file-times fa-3x text-info mb-3"></i>
                      <h5>Tài liệu bị xóa</h5>
                      <p className="text-muted">Test thông báo khi admin xóa tài liệu</p>
                      <button 
                        className="btn btn-info"
                        onClick={() => createTestNotification('document_deleted')}
                        disabled={loading}
                      >
                        {loading ? 'Đang tạo...' : 'Tạo thông báo'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info mt-4">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Hướng dẫn:</strong>
                <ul className="mb-0 mt-2">
                  <li>Nhấn các nút trên để tạo thông báo test</li>
                  <li>Kiểm tra chuông thông báo ở góc phải trên để xem thông báo</li>
                  <li>Thông báo sẽ hiển thị với icon và màu sắc tương ứng</li>
                  <li>Nhấn vào thông báo để đánh dấu đã đọc</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestNotifications;