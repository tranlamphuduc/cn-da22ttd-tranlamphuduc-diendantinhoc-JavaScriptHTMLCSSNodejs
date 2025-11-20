import React, { useState, useEffect } from 'react';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, reportType, targetId, targetTitle }) => {
    const [formData, setFormData] = useState({
        reason: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [reportStatus, setReportStatus] = useState(null);
    const [statusLoading, setStatusLoading] = useState(true);

    const reasons = {
        spam: 'Spam',
        inappropriate: 'Nội dung không phù hợp',
        harassment: 'Quấy rối',
        fake_info: 'Thông tin sai lệch',
        copyright: 'Vi phạm bản quyền',
        other: 'Khác'
    };

    // Lấy trạng thái báo cáo khi modal mở
    useEffect(() => {
        if (isOpen) {
            fetchReportStatus();
        }
    }, [isOpen]);

    const fetchReportStatus = async () => {
        setStatusLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/reports/my-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setReportStatus(data);
            }
        } catch (error) {
            console.error('Error fetching report status:', error);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.reason) {
            setError('Vui lòng chọn lý do báo cáo');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');
            const reportData = {
                report_type: reportType,
                reason: formData.reason,
                description: formData.description
            };

            if (reportType === 'user') {
                reportData.reported_user_id = targetId;
            } else if (reportType === 'post') {
                reportData.reported_post_id = targetId;
            } else if (reportType === 'document') {
                reportData.reported_document_id = targetId;
            }

            const response = await fetch('/api/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(reportData)
            });

            const data = await response.json();

            if (response.ok) {
                alert('Báo cáo đã được gửi thành công!');
                onClose();
                setFormData({ reason: '', description: '' });
            } else {
                setError(data.message || 'Có lỗi xảy ra khi gửi báo cáo');
            }
        } catch (error) {
            console.error('Error submitting report:', error);
            setError('Có lỗi xảy ra khi gửi báo cáo');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (!isOpen) return null;

    return (
        <div className="report-modal-overlay" onClick={onClose}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h3>Báo cáo {
                        reportType === 'user' ? 'người dùng' : 
                        reportType === 'post' ? 'bài viết' : 'tài liệu'
                    }</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="report-modal-body">
                    <div className="report-target">
                        <strong>Đối tượng báo cáo:</strong> {targetTitle}
                    </div>

                    {/* Hiển thị trạng thái báo cáo */}
                    {statusLoading ? (
                        <div className="text-center py-3">
                            <div className="spinner-border spinner-border-sm" role="status">
                                <span className="visually-hidden">Đang tải...</span>
                            </div>
                        </div>
                    ) : reportStatus && (
                        <div className="report-status-info mb-3">
                            {/* Hiển thị cảnh báo nếu bị cấm */}
                            {reportStatus.is_banned && (
                                <div className="alert alert-danger">
                                    <i className="fas fa-ban me-2"></i>
                                    <strong>Bạn đã bị cấm báo cáo!</strong>
                                    <p className="mb-0">
                                        {reportStatus.ban_until ? (
                                            <>Bạn bị cấm báo cáo đến {new Date(reportStatus.ban_until).toLocaleString('vi-VN')} do báo cáo sai {reportStatus.warning_count} lần.</>
                                        ) : (
                                            <>Bạn đã bị cấm báo cáo vĩnh viễn do báo cáo sai {reportStatus.warning_count} lần.</>
                                        )}
                                    </p>
                                </div>
                            )}

                            {/* Hiển thị cảnh báo nếu đạt giới hạn báo cáo */}
                            {!reportStatus.is_banned && reportStatus.pending_reports_count >= 3 && (
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    <strong>Đã đạt giới hạn báo cáo!</strong>
                                    <p className="mb-0">
                                        Bạn đã có {reportStatus.pending_reports_count}/3 báo cáo đang chờ xử lý. 
                                        Vui lòng đợi quản trị viên xử lý xong trước khi gửi báo cáo mới.
                                    </p>
                                </div>
                            )}

                            {/* Hiển thị cảnh báo nếu có lịch sử báo cáo sai */}
                            {!reportStatus.is_banned && reportStatus.warning_count > 0 && reportStatus.warning_count < 3 && (
                                <div className="alert alert-info">
                                    <i className="fas fa-info-circle me-2"></i>
                                    <strong>Lưu ý:</strong> Bạn đã nhận {reportStatus.warning_count} cảnh báo do báo cáo sai. 
                                    Hãy cẩn thận khi gửi báo cáo để tránh bị cấm.
                                </div>
                            )}

                            {/* Hiển thị số báo cáo đang chờ */}
                            {!reportStatus.is_banned && reportStatus.pending_reports_count > 0 && reportStatus.pending_reports_count < 3 && (
                                <div className="alert alert-light">
                                    <i className="fas fa-clock me-2"></i>
                                    Bạn có {reportStatus.pending_reports_count}/3 báo cáo đang chờ xử lý.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Form báo cáo - chỉ hiển thị nếu có thể báo cáo */}
                    {reportStatus && reportStatus.can_report ? (
                        <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Lý do báo cáo *</label>
                            <select
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Chọn lý do</option>
                                {Object.entries(reasons).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Mô tả chi tiết (tùy chọn)</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Mô tả thêm về vấn đề..."
                                rows="4"
                                maxLength="1000"
                            />
                            <small>{formData.description.length}/1000 ký tự</small>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="form-actions">
                            <button type="button" onClick={onClose} disabled={loading}>
                                Hủy
                            </button>
                            <button type="submit" disabled={loading}>
                                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                            </button>
                        </div>
                    </form>
                    ) : reportStatus && !reportStatus.can_report ? (
                        <div className="text-center py-4">
                            <i className="fas fa-ban fa-3x text-muted mb-3"></i>
                            <h5>Không thể gửi báo cáo</h5>
                            <p className="text-muted">
                                {reportStatus.is_banned ? 
                                    'Bạn đã bị cấm báo cáo.' : 
                                    'Bạn đã đạt giới hạn báo cáo cho phép.'
                                }
                            </p>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default ReportModal;