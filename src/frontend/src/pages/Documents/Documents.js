import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../../components/Reports/ReportButton';
import Pagination from '../../components/Pagination/Pagination';
import axios from 'axios';

const Documents = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [downloadingIds, setDownloadingIds] = useState(new Set());


  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchTerm, pagination.page]);

  const fetchData = async () => {
    try {
      const [documentsRes, categoriesRes] = await Promise.all([
        axios.get('/api/documents', {
          params: {
            category: selectedCategory,
            search: searchTerm,
            page: pagination.page,
            limit: pagination.limit
          }
        }),
        axios.get('/api/categories')
      ]);

      setDocuments(documentsRes.data.documents);
      setCategories(categoriesRes.data.categories);
      setPagination(prev => ({
        ...prev,
        total: documentsRes.data.pagination.total,
        pages: documentsRes.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (filterType, value) => {
    setPagination(prev => ({ ...prev, page: 1 }));
    if (filterType === 'category') {
      setSelectedCategory(value);
    } else if (filterType === 'search') {
      setSearchTerm(value);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'fas fa-file-pdf text-danger';
      case 'doc':
      case 'docx':
        return 'fas fa-file-word text-primary';
      case 'ppt':
      case 'pptx':
        return 'fas fa-file-powerpoint text-warning';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'fas fa-file-image text-success';
      default:
        return 'fas fa-file text-secondary';
    }
  };

  const handleDownload = async (documentId) => {
    // Tránh double download
    if (downloadingIds.has(documentId)) {
      return;
    }

    setDownloadingIds(prev => new Set(prev).add(documentId));

    try {
      const response = await axios.get(`/api/documents/download/${documentId}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Parse filename từ Content-Disposition header
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download.txt';
      
      if (contentDisposition) {
        console.log('Content-Disposition:', contentDisposition);
        
        // Thử parse filename*=UTF-8'' format trước
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
        } else {
          // Fallback sang filename="..." format
          const normalMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (normalMatch) {
            filename = normalMatch[1];
          }
        }
      }
      
      console.log('Download filename:', filename);
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Có lỗi xảy ra khi tải file');
    } finally {
      // Xóa khỏi downloading set sau 2 giây để cho phép download lại
      setTimeout(() => {
        setDownloadingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(documentId);
          return newSet;
        });
      }, 2000);
    }
  };



  const handleDeleteDocument = async (documentId, documentTitle) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${documentTitle}"?`)) {
      try {
        await axios.delete(`/api/admin/documents/${documentId}`);
        setDocuments(documents.filter(doc => doc.id !== documentId));
        alert('Đã xóa tài liệu thành công');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Có lỗi xảy ra khi xóa tài liệu');
      }
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container">


      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>
              <i className="fas fa-file-alt me-2"></i>
              Tài liệu học tập
            </h2>
            <Link to="/upload-document" className="btn btn-primary">
              <i className="fas fa-upload me-2"></i>
              Tải lên tài liệu
            </Link>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Filters */}
        <div className="col-lg-3">
          <div className="sidebar">
            <h5 className="mb-3">
              <i className="fas fa-filter me-2"></i>
              Bộ lọc
            </h5>
            
            {/* Search */}
            <div className="mb-3">
              <label className="form-label">Tìm kiếm</label>
              <input
                type="text"
                className="form-control"
                placeholder="Tìm kiếm tài liệu..."
                value={searchTerm}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            {/* Categories */}
            <div className="mb-3">
              <label className="form-label">Danh mục</label>
              <select
                className="form-select"
                value={selectedCategory}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="col-lg-9">
          {documents.length > 0 ? (
            <>
              <div className="row">
                {documents.map(document => (
                  <div key={document.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="card-body d-flex flex-column">
                        {/* File Icon */}
                        <div className="text-center mb-3">
                          <i className={`${getFileIcon(document.file_name)} fa-3x`}></i>
                        </div>

                        {/* Document Info */}
                        <h6 className="card-title">{document.title}</h6>
                        
                        {document.description && (
                          <p className="card-text text-muted small">
                            {document.description.length > 100 
                              ? document.description.substring(0, 100) + '...'
                              : document.description
                            }
                          </p>
                        )}

                        {/* Category */}
                        <div className="mb-2">
                          <span 
                            className="category-badge text-white"
                            style={{ backgroundColor: document.category_color || '#007bff' }}
                          >
                            {document.category_name}
                          </span>
                        </div>

                        {/* File Details */}
                        <div className="text-muted small mb-3">
                          <div>
                            <i className="fas fa-file me-1"></i>
                            {document.file_name}
                          </div>
                          <div>
                            <i className="fas fa-hdd me-1"></i>
                            {formatFileSize(document.file_size)}
                          </div>
                          <div>
                            <i className="fas fa-download me-1"></i>
                            {document.downloads} lượt tải
                          </div>
                        </div>

                        {/* Author and Date */}
                        <div className="text-muted small mb-3">
                          <div>
                            <i className="fas fa-user me-1"></i>
                            {document.full_name}
                          </div>
                          <div>
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(document.created_at)}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-auto">
                          {/* Download Button */}
                          <button
                            className="btn btn-primary w-100 mb-2"
                            onClick={() => handleDownload(document.id)}
                            disabled={downloadingIds.has(document.id)}
                          >
                            {downloadingIds.has(document.id) ? (
                              <>
                                <i className="fas fa-spinner fa-spin me-2"></i>
                                Đang tải...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-download me-2"></i>
                                Tải xuống
                              </>
                            )}
                          </button>

                          {/* Report and Admin Actions */}
                          <div className="d-flex justify-content-between align-items-center">
                            {/* Report Button */}
                            {currentUser && currentUser.id !== document.user_id && (
                              <ReportButton
                                reportType="document"
                                targetId={document.id}
                                targetTitle={document.title}
                                className="small outline"
                              />
                            )}

                            {/* Admin Delete Button */}
                            {currentUser && currentUser.role === 'admin' && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => handleDeleteDocument(document.id, document.title)}
                                title="Xóa tài liệu (Admin)"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination */}
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
              />
            </>
          ) : (
            <div className="text-center py-5">
              <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
              <h5>Không tìm thấy tài liệu nào</h5>
              <p className="text-muted">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
              <Link to="/upload-document" className="btn btn-primary">
                <i className="fas fa-upload me-2"></i>
                Tải lên tài liệu đầu tiên
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Documents;