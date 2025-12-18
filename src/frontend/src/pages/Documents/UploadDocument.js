import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UploadDocument = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: ''
  });
  const [file, setFile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile && !formData.title) {
      setFormData({
        ...formData,
        title: selectedFile.name.split('.')[0]
      });
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
      if (!formData.title) {
        setFormData({
          ...formData,
          title: droppedFile.name.split('.')[0]
        });
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Vui lòng chọn file để upload');
      return;
    }

    setLoading(true);
    setError('');

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('title', formData.title);
    uploadData.append('description', formData.description);
    uploadData.append('category_id', formData.category_id);

    try {
      await axios.post('/api/documents/upload', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      navigate('/documents');
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi upload tài liệu');
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-upload me-2"></i>
                Tải lên tài liệu
              </h4>
              <p className="mb-0 text-light">Chọn file (PDF, DOCX, PPTX, hình ảnh) - Tối đa 50MB</p>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                {/* File Upload Area */}
                <div className="mb-4">
                  <label className="form-label">
                    Chọn file (PDF, DOCX, PPTX, hình ảnh) - Tối đa 50MB <span className="text-danger">*</span>
                  </label>
                  <div
                    className={`file-upload-area ${dragOver ? 'dragover' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('fileInput').click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <input
                      type="file"
                      id="fileInput"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
                      style={{ display: 'none' }}
                    />
                    
                    {file ? (
                      <div className="text-center">
                        <i className={`${getFileIcon(file.name)} fa-3x mb-3`}></i>
                        <h5>{file.name}</h5>
                        <p className="text-muted">{formatFileSize(file.size)}</p>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                        >
                          <i className="fas fa-times me-1"></i>
                          Xóa file
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <i className="fas fa-cloud-upload-alt fa-3x text-muted mb-3"></i>
                        <h5>Chọn tệp</h5>
                        <p className="text-muted mb-0">Không có tệp nào được chọn</p>
                        <small className="text-muted">
                          Kéo thả file vào đây hoặc click để chọn file
                        </small>
                      </div>
                    )}
                  </div>
                  
                </div>

                {/* Category Selection */}
                <div className="mb-3">
                  <label htmlFor="category_id" className="form-label">
                    Danh mục <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Chọn danh mục</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Tiêu đề tài liệu <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Nhập tiêu đề tài liệu..."
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label htmlFor="description" className="form-label">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    className="form-control"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Mô tả ngắn về tài liệu..."
                    rows="4"
                  />
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/documents')}
                  >
                    <i className="fas fa-times me-2"></i>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading || !file}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang tải lên...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload me-2"></i>
                        Tải lên
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadDocument;