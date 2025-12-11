import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../../components/Reports/ReportButton';
import axios from 'axios';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [relatedDocs, setRelatedDocs] = useState([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/documents/${id}`);
      setDocument(response.data.document);
      
      // Fetch related documents from same category
      if (response.data.document.category_id) {
        const relatedRes = await axios.get('/api/documents', {
          params: {
            category: response.data.document.category_id,
            limit: 4
          }
        });
        setRelatedDocs(relatedRes.data.documents.filter(doc => doc.id !== parseInt(id)));
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      if (error.response?.status === 404) {
        navigate('/documents');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf text-danger';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word text-primary';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint text-warning';
      case 'xls':
      case 'xlsx':
        return 'fas fa-file-excel text-success';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fas fa-file-image text-info';
      case 'zip':
      case 'rar':
        return 'fas fa-file-archive text-secondary';
      default:
        return 'fas fa-file text-secondary';
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);

    try {
      const response = await axios.get(`/api/documents/download/${id}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = document.file_name || 'download';
      
      if (contentDisposition) {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
        } else {
          const normalMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (normalMatch) {
            filename = normalMatch[1];
          }
        }
      }
      
      link.setAttribute('download', filename);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Update download count locally
      setDocument(prev => ({ ...prev, downloads: prev.downloads + 1 }));
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Có lỗi xảy ra khi tải file');
    } finally {
      setDownloading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback cho trình duyệt cũ
      const textArea = window.document.createElement('textarea');
      textArea.value = window.location.href;
      window.document.body.appendChild(textArea);
      textArea.select();
      window.document.execCommand('copy');
      window.document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <i className="fas fa-file-excel fa-4x text-muted mb-3"></i>
          <h4>Không tìm thấy tài liệu</h4>
          <Link to="/documents" className="btn btn-primary mt-3">
            <i className="fas fa-arrow-left me-2"></i>
            Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/">Trang chủ</Link>
          </li>
          <li className="breadcrumb-item">
            <Link to="/documents">Tài liệu</Link>
          </li>
          <li className="breadcrumb-item active" aria-current="page">
            {document.title}
          </li>
        </ol>
      </nav>

      <div className="row">
        {/* Main Content */}
        <div className="col-lg-8">
          <div className="card mb-4">
            <div className="card-body">
              {/* Header */}
              <div className="d-flex align-items-start mb-4">
                <div className="me-4">
                  <i className={`${getFileIcon(document.file_name)} fa-4x`}></i>
                </div>
                <div className="flex-grow-1">
                  <h2 className="mb-2">{document.title}</h2>
                  <span 
                    className="badge text-white mb-2"
                    style={{ backgroundColor: document.category_color || '#007bff' }}
                  >
                    {document.category_name}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-4">
                <h5>
                  <i className="fas fa-info-circle me-2"></i>
                  Mô tả
                </h5>
                <p className="text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {document.description || 'Không có mô tả cho tài liệu này.'}
                </p>
              </div>

              {/* File Info */}
              <div className="mb-4">
                <h5>
                  <i className="fas fa-file-alt me-2"></i>
                  Thông tin file
                </h5>
                <table className="table table-borderless">
                  <tbody>
                    <tr>
                      <td className="text-muted" style={{ width: '150px' }}>Tên file:</td>
                      <td><strong>{document.file_name}</strong></td>
                    </tr>
                    <tr>
                      <td className="text-muted">Kích thước:</td>
                      <td>{formatFileSize(document.file_size)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Loại file:</td>
                      <td>{document.file_type}</td>
                    </tr>
                    <tr>
                      <td className="text-muted">Lượt tải:</td>
                      <td>
                        <i className="fas fa-download me-1 text-primary"></i>
                        {document.downloads} lượt
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Download Button */}
              <div className="d-flex gap-2 flex-wrap">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={handleDownload}
                  disabled={downloading}
                >
                  {downloading ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-1"></i>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-download me-1"></i>
                      Tải xuống
                    </>
                  )}
                </button>
                
                <button
                  className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={copyLink}
                  title="Sao chép liên kết"
                >
                  {copied ? (
                    <>
                      <i className="fas fa-check me-1"></i>
                      Đã sao chép!
                    </>
                  ) : (
                    <>
                      <i className="fas fa-link me-1"></i>
                      Sao chép link
                    </>
                  )}
                </button>
                
                {currentUser && currentUser.id !== document.user_id && (
                  <ReportButton
                    reportType="document"
                    targetId={document.id}
                    targetTitle={document.title}
                    className="small"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Uploader Info */}
          <div className="card mb-4">
            <div className="card-body">
              <h5 className="card-title">
                <i className="fas fa-user me-2"></i>
                Người tải lên
              </h5>
              <Link to={`/profile/${document.user_id}`} className="d-flex align-items-center text-decoration-none">
                <img
                  src={document.avatar ? `http://localhost:5000/${document.avatar}` : '/default-avatar.png'}
                  alt={document.full_name}
                  className="rounded-circle me-3"
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = '/default-avatar.png'; }}
                />
                <div>
                  <strong>{document.full_name}</strong>
                  <div className="text-muted small">@{document.username}</div>
                </div>
              </Link>
              <hr />
              <div className="text-muted small">
                <i className="fas fa-calendar me-2"></i>
                Ngày tải lên: {formatDate(document.created_at)}
              </div>
            </div>
          </div>

          {/* Related Documents */}
          {relatedDocs.length > 0 && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">
                  <i className="fas fa-folder-open me-2"></i>
                  Tài liệu liên quan
                </h5>
                <div className="list-group list-group-flush">
                  {relatedDocs.slice(0, 3).map(doc => (
                    <Link
                      key={doc.id}
                      to={`/documents/${doc.id}`}
                      className="list-group-item list-group-item-action d-flex align-items-center"
                    >
                      <i className={`${getFileIcon(doc.file_name)} me-3`}></i>
                      <div className="flex-grow-1 overflow-hidden">
                        <div className="text-truncate">{doc.title}</div>
                        <small className="text-muted">{formatFileSize(doc.file_size)}</small>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
