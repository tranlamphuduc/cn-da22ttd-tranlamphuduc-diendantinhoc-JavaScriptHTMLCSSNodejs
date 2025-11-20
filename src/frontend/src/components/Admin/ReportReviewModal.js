import React, { useState } from 'react';

const ReportReviewModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  report,
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    status: 'reviewed',
    admin_note: '',
    is_false_report: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClose = () => {
    setFormData({
      status: 'reviewed',
      admin_note: '',
      is_false_report: false
    });
    onClose();
  };

  if (!isOpen || !report) return null;

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

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-flag me-2"></i>
              Xử lý báo cáo #{report.id}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>
          
          <div className="modal-body">
            {/* Thông tin báo cáo */}
            <div className="card mb-4">
              <div className="card-header">
                <h6 className="mb-0">Thông tin báo cáo</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6">
                    <p><strong>Người báo cáo:</strong> {report.reporter_name} (@{report.reporter_username})</p>
                    <p><strong>Loại báo cáo:</strong> {getReportTypeLabel(report.report_type)}</p>
                    <p><strong>Lý do:</strong> {getReasonLabel(report.reason)}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Ngày tạo:</strong> {new Date(report.created_at).toLocaleString('vi-VN')}</p>
                    <p><strong>Trạng thái hiện tại:</strong> 
                      <span className={`badge ms-2 ${
                        report.status === 'pending' ? 'bg-warning' :
                        report.status === 'reviewed' ? 'bg-info' :
                        report.status === 'resolved' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {report.status === 'pending' ? 'Chờ xử lý' :
                         report.status === 'reviewed' ? 'Đã xem xét' :
                         report.status === 'resolved' ? 'Đã giải quyết' : 'Đã bỏ qua'}
                      </span>
                    </p>
                  </div>
                </div>
                
                {report.description && (
                  <div className="mt-3">
                    <strong>Mô tả:</strong>
                    <div className="bg-light p-3 rounded mt-2">
                      {report.description}
                    </div>
                  </div>
                )}

                {/* Thông tin đối tượng bị báo cáo */}
                <div className="mt-3">
                  <strong>Đối tượng bị báo cáo:</strong>
                  <div className="bg-light p-3 rounded mt-2">
                    {report.report_type === 'user' && (
                      <p className="mb-0">
                        <i className="fas fa-user me-2"></i>
                        {report.reported_user_name} (@{report.reported_username})
                      </p>
                    )}
                    {report.report_type === 'post' && (
                      <p className="mb-0">
                        <i className="fas fa-file-alt me-2"></i>
                        {report.post_title || 'Bài viết đã bị xóa'}
                      </p>
                    )}
                    {report.report_type === 'document' && (
                      <p className="mb-0">
                        <i className="fas fa-file me-2"></i>
                        {report.document_title || 'Tài liệu đã bị xóa'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form xử lý */}
            <form onSubmit={handleSubmit}>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="status" className="form-label">
                      <strong>Trạng thái mới <span className="text-danger">*</span></strong>
                    </label>
                    <select
                      id="status"
                      name="status"
                      className="form-select"
                      value={formData.status}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    >
                      <option value="reviewed">Đã xem xét</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="dismissed">Đã bỏ qua</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <div className="form-check mt-4">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="is_false_report"
                        name="is_false_report"
                        checked={formData.is_false_report}
                        onChange={handleChange}
                        disabled={loading}
                      />
                      <label className="form-check-label text-danger" htmlFor="is_false_report">
                        <strong>Đánh dấu là báo cáo sai</strong>
                      </label>
                      <div className="form-text">
                        Người báo cáo sẽ nhận cảnh báo và có thể bị cấm báo cáo nếu vi phạm nhiều lần
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="admin_note" className="form-label">
                  <strong>Ghi chú của quản trị viên</strong>
                </label>
                <textarea
                  id="admin_note"
                  name="admin_note"
                  className="form-control"
                  rows="4"
                  placeholder="Ghi chú về việc xử lý báo cáo này..."
                  value={formData.admin_note}
                  onChange={handleChange}
                  maxLength="500"
                  disabled={loading}
                />
                <div className="form-text">
                  {formData.admin_note.length}/500 ký tự
                </div>
              </div>

              {formData.is_false_report && (
                <div className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  <strong>Cảnh báo:</strong> Bạn đang đánh dấu báo cáo này là sai. 
                  Người báo cáo sẽ nhận cảnh báo và có thể bị cấm báo cáo nếu tiếp tục vi phạm.
                </div>
              )}

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleClose}
                  disabled={loading}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
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
                      Cập nhật trạng thái
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportReviewModal;