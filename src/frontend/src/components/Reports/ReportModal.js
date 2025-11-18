import React, { useState } from 'react';
import './ReportModal.css';

const ReportModal = ({ isOpen, onClose, reportType, targetId, targetTitle }) => {
    const [formData, setFormData] = useState({
        reason: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const reasons = {
        spam: 'Spam',
        inappropriate: 'Nội dung không phù hợp',
        harassment: 'Quấy rối',
        fake_info: 'Thông tin sai lệch',
        copyright: 'Vi phạm bản quyền',
        other: 'Khác'
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
                </div>
            </div>
        </div>
    );
};

export default ReportModal;