import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import ReportStatus from '../../components/Reports/ReportStatus';

const MyReports = () => {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchMyReports();
    }
  }, [currentUser]);

  const fetchMyReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports/my-reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        setError('Không thể tải danh sách báo cáo');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Có lỗi xảy ra khi tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status, isFalseReport) => {
    if (isFalseReport) return 'bg-danger';
    
    switch (status) {
      case 'pending': return 'bg-warning text-dark';
      case 'reviewed': return 'bg-info';
      case 'resolved': return 'bg-success';
      case 'dismissed': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  const getStatusLabel = (status, isFalseReport) => {
    if (isFalseReport) return 'Báo cáo sai';
    
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'reviewed': return 'Đã xem xét';
      case 'resolved': return 'Đã giải quyết';
      case 'dismissed': return 'Đã bỏ qua';
      default: return 'Không xác định';
    }
  };

  const getReportTypeLabel = (type) => {
    switch (type) {
      case 'user': return 'Người dùng';
      case 'post': return 'Bài viết';
      case 'document': return 'Tài liệu';
      default: return 'Không xác định';
    }
  };

  const getReasonLabel = (reason) => {
    const reasons = {
      spam: 'Spam',
      inappropriate: 'Nội dung không phù hợp',
      harassment: 'Quấy rối',
      fake_info: 'Thông tin sai lệch',
      copyright: 'Vi phạm bản quyền',
      other: 'Khác'
    };
    return reasons[reason] || reason;
  };

  if (!currentUser) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning">
          <i className="fas fa-sign-in-alt me-2"></i>
          Vui lòng đăng nhập để xem báo cáo của bạn.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-2">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-flag me-2"></i>
              Báo cáo của tôi
            </h2>
          </div>

          {/* Hiển thị trạng thái báo cáo */}
          <ReportStatus />

          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          {/* Danh sách báo cáo */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-list me-2"></i>
                Lịch sử báo cáo
              </h5>
            </div>
            <div className="card-body">
              {reports.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fas fa-flag fa-3x text-muted mb-3"></i>
                  <h5>Chưa có báo cáo nào</h5>
                  <p className="text-muted">Bạn chưa gửi báo cáo nào.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Loại</th>
                        <th>Đối tượng</th>
                        <th>Lý do</th>
                        <th>Trạng thái</th>
                        <th>Ngày gửi</th>
                        <th>Ghi chú admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(report => (
                        <tr key={report.id} className={report.is_false_report ? 'table-danger' : ''}>
                          <td>#{report.id}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {getReportTypeLabel(report.report_type)}
                            </span>
                          </td>
                          <td>
                            <div className="text-truncate" style={{ maxWidth: '200px' }}>
                              {report.reported_content_name || 'Đã bị xóa'}
                            </div>
                          </td>
                          <td>{getReasonLabel(report.reason)}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(report.status, report.is_false_report)}`}>
                              {getStatusLabel(report.status, report.is_false_report)}
                            </span>
                          </td>
                          <td>
                            <small>{new Date(report.created_at).toLocaleString('vi-VN')}</small>
                          </td>
                          <td>
                            {report.admin_note ? (
                              <div className="text-truncate" style={{ maxWidth: '200px' }} title={report.admin_note}>
                                {report.admin_note}
                              </div>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Hướng dẫn sử dụng */}
          <div className="card mt-4">
            <div className="card-header">
              <h6 className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                Hướng dẫn báo cáo
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Quy định báo cáo:</h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-check text-success me-2"></i>Mỗi người chỉ được có tối đa 3 báo cáo đang chờ xử lý</li>
                    <li><i className="fas fa-check text-success me-2"></i>Không được báo cáo sai hoặc spam</li>
                    <li><i className="fas fa-check text-success me-2"></i>Cung cấp mô tả chi tiết và chính xác</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Hệ thống cảnh báo:</h6>
                  <ul className="list-unstyled">
                    <li><i className="fas fa-exclamation-triangle text-warning me-2"></i>3+ báo cáo sai: Cấm 7 ngày</li>
                    <li><i className="fas fa-ban text-danger me-2"></i>5+ báo cáo sai: Cấm vĩnh viễn</li>
                    <li><i className="fas fa-info-circle text-info me-2"></i>Liên hệ admin nếu có thắc mắc</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyReports;