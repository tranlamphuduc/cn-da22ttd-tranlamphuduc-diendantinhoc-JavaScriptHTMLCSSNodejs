import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import TagInput from '../../components/Tags/TagInput';

const EditPost = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    tags: []
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [postRes, categoriesRes] = await Promise.all([
        axios.get(`/api/posts/${id}`),
        axios.get('/api/categories')
      ]);

      const post = postRes.data.post;
      
      // Kiểm tra quyền chỉnh sửa
      if (post.user_id !== currentUser?.id && currentUser?.role !== 'admin') {
        alert('Bạn không có quyền chỉnh sửa bài viết này');
        navigate(`/posts/${id}`);
        return;
      }

      // Lấy tags của bài viết
      let postTags = [];
      try {
        const tagsRes = await axios.get(`/api/tags/post/${id}`);
        postTags = tagsRes.data.tags.map(t => t.name);
      } catch (e) {
        console.error('Error fetching tags:', e);
      }

      setFormData({
        title: post.title,
        content: post.content,
        category_id: post.category_id,
        tags: postTags
      });
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Không thể tải bài viết');
    } finally {
      setPageLoading(false);
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
      await axios.put(`/api/posts/${id}`, formData);
      navigate(`/posts/${id}`);
    } catch (error) {
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bài viết');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
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
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-edit me-2"></i>
                Chỉnh sửa bài viết
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
                  <label className="form-label">Tags</label>
                  <TagInput
                    selectedTags={formData.tags}
                    onChange={(tags) => setFormData({ ...formData, tags })}
                    maxTags={10}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="content" className="form-label">
                    Nội dung (Markdown) <span className="text-danger">*</span>
                  </label>
                  
                  {/* Markdown Toolbar */}
                  <div className="btn-toolbar mb-2" role="toolbar">
                    <div className="btn-group btn-group-sm me-2" role="group">
                      <button type="button" className="btn btn-outline-secondary" title="Bold"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selectedText = text.substring(start, end);
                          const newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
                          setFormData({...formData, content: newText});
                        }}>
                        <i className="fas fa-bold"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" title="Italic"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = textarea.value;
                          const selectedText = text.substring(start, end);
                          const newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
                          setFormData({...formData, content: newText});
                        }}>
                        <i className="fas fa-italic"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" title="Heading"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '# ' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}>
                        <i className="fas fa-heading"></i>
                      </button>
                    </div>
                    
                    <div className="btn-group btn-group-sm me-2" role="group">
                      <button type="button" className="btn btn-outline-secondary" title="Quote"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '> ' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}>
                        <i className="fas fa-quote-left"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" title="Code Block"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '```\ncode\n```' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}>
                        <i className="fas fa-code"></i>
                      </button>
                      <button type="button" className="btn btn-outline-secondary" title="Link"
                        onClick={() => {
                          const textarea = document.getElementById('content');
                          const start = textarea.selectionStart;
                          const text = textarea.value;
                          const newText = text.substring(0, start) + '[Liên kết](url)' + text.substring(start);
                          setFormData({...formData, content: newText});
                        }}>
                        <i className="fas fa-link"></i>
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
                </div>

                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(`/posts/${id}`)}
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
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Lưu thay đổi
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

export default EditPost;
