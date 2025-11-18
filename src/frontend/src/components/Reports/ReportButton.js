import React, { useState } from 'react';
import ReportModal from './ReportModal';
import './ReportButton.css';

const ReportButton = ({ reportType, targetId, targetTitle, className = '' }) => {
    const [showModal, setShowModal] = useState(false);

    const handleReport = () => {
        setShowModal(true);
    };

    return (
        <>
            <button 
                className={`report-btn ${className}`}
                onClick={handleReport}
                title={`Báo cáo ${
                    reportType === 'user' ? 'người dùng' : 
                    reportType === 'post' ? 'bài viết' : 'tài liệu'
                }`}
            >
                <i className="fas fa-flag"></i>
                <span>Báo cáo</span>
            </button>

            <ReportModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                reportType={reportType}
                targetId={targetId}
                targetTitle={targetTitle}
            />
        </>
    );
};

export default ReportButton;