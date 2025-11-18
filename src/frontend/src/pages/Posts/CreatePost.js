import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CreatePost = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/posts', formData);
      navigate(`/posts/${response.data.post_id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi tạo bài viết');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-plus me-2"></i>
                Tạo bài viết mới
              </h4>
            </div>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">
                    Tiêu đề bài viết <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Nhập tiêu đề..."
                    required
                  />
                </div>

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

                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    Nội dung (Markdown) <span className="text-danger">*</span>
                  </label>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Hỗ trợ Markdown</small>
                    <a 
                      href="https://www.markdownguide.org/basic-syntax/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      Xem trước
                    </a>
                  </div>
                  
                  {/* Markdown Toolbar */}
                  <div className="btn-toolbar mb-2" role="toolbar">
                    <div className="btn-group btn-group-sm me-2" role="group">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selectedText = text.substring(start, end);
                          const newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
                          setFormData({...formData, content: newText});
                        }}
                        title="Bold"
                      >
                        <i className="fas fa-bold"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selectedText = text.substring(start, end);
                          const newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
                          setFormData({...formData, content: newText});
                        }}
                        title="Italic"
                      >
                        <i className="fas fa-italic"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '# ' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}
                        title="Heading"
                      >
                        <i className="fas fa-heading"></i>
                      </button>
                    </div>
                    
                    <div className="btn-group btn-group-sm me-2" role="group">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '> ' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}
                        title="Quote"
                      >
                        <i className="fas fa-quote-left"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '- ' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}
                        title="List"
                      >
                        <i className="fas fa-list-ul"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '1. ' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}
                        title="Numbered List"
                      >
                        <i className="fas fa-list-ol"></i>
                      </button>
                    </div>
                    
                    <div className="btn-group btn-group-sm" role="group">
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '[Liên kết](url)' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}
                        title="Link"
                      >
                        <i className="fas fa-link"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '![Alt text](image-url)' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}
                        title="Image"
                      >
                        <i className="fas fa-image"></i>
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '```\ncode\n```' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}
                        title="Code Block"
                      >
                        <i className="fas fa-code"></i>
                      </button>
                    </div>
                  </div>

                  <textarea
                    className="form-control markdown-editor"
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleChange}
                    placeholder="Viết nội dung bài viết của bạn (hỗ trợ Markdown)..."
                    rows="15"
                    required
                  />
                  <small className="form-text text-muted">
                    Bạn có thể sử dụng Markdown để định dạng văn bản. Ví dụ: **in đậm**, *in nghiêng*, `code`, etc.
                  </small>
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-times me-2"></i>
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang đăng...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Đăng bài
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

export default CreatePost;