import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const ReportStatus = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchReportStatus();
    }
  }, [currentUser]);

  const fetchReportStatus = async () => {
    try {
      const response = await fetch('/api/reports/my-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching report status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || loading) {
    return null;
  }

  if (!status) {
    return null;
  }

  return (
    <div className="report-status-widget">
      {/* Hiển thị cảnh báo nếu có */}
      {status.warning_count > 0 && (
        <div className={`alert ${status.is_banned ? 'alert-danger' : 'alert-warning'} mb-3`}>
          <div className="d-flex align-items-center">
            <i className="fas fa-exclamation-triangle me-2"></i>
            <div>
              <strong>Cảnh báo báo cáo sai:</strong>
              <p className="mb-0">
                {status.is_banned ? (
                  status.ban_until ? (
                    <>Bạn đã bị cấm báo cáo đến {new Date(status.ban_until).toLocaleString('vi-VN')} do báo cáo sai {status.warning_count} lần.</>
                  ) : (
                    <>Bạn đã bị cấm báo cáo vĩnh viễn do báo cáo sai {status.warning_count} lần.</>
                  )
                ) : (
                  <>Bạn đã nhận {status.warning_count} cảnh báo do báo cáo sai. Hãy cẩn thận khi gửi báo cáo.</>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hiển thị số báo cáo đang chờ */}
      {status.pending_reports_count > 0 && (
        <div className="alert alert-info mb-3">
          <div className="d-flex align-items-center">
            <i className="fas fa-clock me-2"></i>
            <div>
              <strong>Báo cáo đang chờ xử lý:</strong>
              <p className="mb-0">
                Bạn có {status.pending_reports_count}/3 báo cáo đang chờ quản trị viên xử lý.
                {status.pending_reports_count >= 3 && (
                  <span className="text-warning"> Bạn cần đợi xử lý xong mới có thể gửi báo cáo mới.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Hiển thị lịch sử báo cáo gần đây */}
      {status.recent_reports && status.recent_reports.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">
              <i className="fas fa-history me-2"></i>
              Báo cáo gần đây
            </h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-sm">
                <thead>
                  <tr>
                    <th>Loại</th>
                    <th>Nội dung</th>
                    <th>Trạng thái</th>
                    <th>Ngày gửi</th>
                  </tr>
                </thead>
                <tbody>
                  {status.recent_reports.map(report => (
                    <tr key={report.id}>
                      <td>
                        <span className="badge bg-secondary">
                          {report.report_type === 'user' ? 'Người dùng' : 
                           report.report_type === 'post' ? 'Bài viết' : 'Tài liệu'}
                        </span>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {report.reported_content_name || 'Đã bị xóa'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(report.status, report.is_false_report)}`}>
                          {getStatusLabel(report.status, report.is_false_report)}
                        </span>
                      </td>
                      <td>
                        <small>{new Date(report.created_at).toLocaleDateString('vi-VN')}</small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusBadgeClass = (status, isFalseReport) => {
  if (isFalseReport) return 'bg-danger';
  
  switch (status) {
    case 'pending': return 'bg-warning';
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

export default ReportStatus;