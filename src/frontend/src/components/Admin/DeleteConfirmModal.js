import React, { useState } from 'react';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  itemName, 
  itemType,
  loading = false 
}) => {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim());
      setReason('');
    }
  };

  const handleClose = () => {
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="fas fa-exclamation-triangle text-warning me-2"></i>
              {title}
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
              disabled={loading}
            ></button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="alert alert-warning">
                <i className="fas fa-info-circle me-2"></i>
                Bạn có chắc chắn muốn xóa {itemType} <strong>"{itemName}"</strong>?
                <br />
                <small>Hành động này không thể hoàn tác và người dùng sẽ nhận được thông báo.</small>
              </div>
              
              <div className="mb-3">
                <label htmlFor="deleteReason" className="form-label">
                  <strong>Lý do xóa <span className="text-danger">*</span></strong>
                </label>
                <textarea
                  id="deleteReason"
                  className="form-control"
                  rows="3"
                  placeholder="Nhập lý do xóa để thông báo cho người dùng..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  disabled={loading}
                />
                <div className="form-text">
                  Lý do này sẽ được gửi thông báo đến người dùng.
                </div>
              </div>
            </div>
            
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
                className="btn btn-danger"
                disabled={loading || !reason.trim()}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Đang xóa...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash me-2"></i>
                    Xác nhận xóa
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;