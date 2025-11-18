import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Pagination from '../components/Pagination/Pagination';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchTerm, pagination.page]);

  const fetchData = async () => {
    try {
      const [postsRes, categoriesRes] = await Promise.all([
        axios.get('/api/posts', {
          params: {
            category: selectedCategory,
            search: searchTerm,
            page: pagination.page,
            limit: pagination.limit
          }
        }),
        axios.get('/api/categories')
      ]);

      setPosts(postsRes.data.posts);
      setCategories(categoriesRes.data.categories);
      setPagination(prev => ({
        ...prev,
        total: postsRes.data.pagination.total,
        pages: postsRes.data.pagination.pages
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
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
        {/* Main Content */}
        <div className="col-lg-8">
          {/* Search and Filter */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
                <div className="col-md-4">
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
          </div>

          {/* Posts List */}
          <div className="posts-list">
            {posts.length > 0 ? (
              <>
                {posts.map(post => (
                  <div key={post.id} className="post-card">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        {post.avatar ? (
                          <img 
                            src={post.avatar} 
                            alt="Avatar" 
                            className="avatar me-3"
                          />
                        ) : (
                          <div className="avatar me-3 bg-primary d-flex align-items-center justify-content-center text-white">
                            {post.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h6 className="mb-0">{post.full_name}</h6>
                          <small className="text-muted">@{post.username}</small>
                        </div>
                      </div>
                      <span 
                        className="category-badge text-white"
                        style={{ backgroundColor: post.category_color || '#007bff' }}
                      >
                        {post.category_name}
                      </span>
                    </div>

                    <h5 className="mb-3">
                      <Link 
                        to={`/posts/${post.id}`} 
                        className="text-decoration-none text-dark"
                      >
                        {post.title}
                      </Link>
                    </h5>

                    <p className="text-muted mb-3">
                      {truncateContent(post.content)}
                    </p>

                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center text-muted">
                        <small className="me-3">
                          <i className="fas fa-eye me-1"></i>
                          {post.views} lượt xem
                        </small>
                        <small className="me-3">
                          <i className="fas fa-comments me-1"></i>
                          {post.comment_count} bình luận
                        </small>
                        <small>
                          <i className="fas fa-clock me-1"></i>
                          {formatDate(post.created_at)}
                        </small>
                      </div>
                      <Link 
                        to={`/posts/${post.id}`}
                        className="btn btn-outline-primary btn-sm"
                      >
                        Đọc thêm
                      </Link>
                    </div>
                  </div>
                ))}
                
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
                <i className="fas fa-search fa-3x text-muted mb-3"></i>
                <h5>Không tìm thấy bài viết nào</h5>
                <p className="text-muted">Thử thay đổi từ khóa tìm kiếm hoặc danh mục</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          {/* Categories */}
          <div className="sidebar">
            <h5 className="mb-3">
              <i className="fas fa-list me-2"></i>
              Danh mục
            </h5>
            <div className="list-group list-group-flush">
              <button
                className={`list-group-item list-group-item-action border-0 ${!selectedCategory ? 'active' : ''}`}
                onClick={() => handleFilterChange('category', '')}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <span>Tất cả</span>
                  <span className="badge bg-secondary rounded-pill">
                    {categories.reduce((sum, cat) => sum + cat.post_count, 0)}
                  </span>
                </div>
              </button>
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`list-group-item list-group-item-action border-0 ${selectedCategory == category.id ? 'active' : ''}`}
                  onClick={() => handleFilterChange('category', category.id)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span>{category.name}</span>
                    <span className="badge bg-secondary rounded-pill">
                      {category.post_count}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="sidebar">
            <h5 className="mb-3">
              <i className="fas fa-bolt me-2"></i>
              Thao tác nhanh
            </h5>
            <div className="d-grid gap-2">
              <Link to="/create-post" className="btn btn-primary">
                <i className="fas fa-plus me-2"></i>
                Tạo bài viết
              </Link>
              <Link to="/upload-document" className="btn btn-success">
                <i className="fas fa-upload me-2"></i>
                Tải lên tài liệu
              </Link>
              <Link to="/documents" className="btn btn-info">
                <i className="fas fa-file-alt me-2"></i>
                Xem tài liệu
              </Link>
            </div>
          </div>

          {/* Statistics */}
          <div className="sidebar">
            <h5 className="mb-3">
              <i className="fas fa-chart-bar me-2"></i>
              Thống kê
            </h5>
            <div className="row g-2">
              <div className="col-6">
                <div className="text-center p-3 bg-light rounded">
                  <div className="h4 text-primary mb-1">
                    {categories.reduce((sum, cat) => sum + cat.post_count, 0)}
                  </div>
                  <small className="text-muted">Bài viết</small>
                </div>
              </div>
              <div className="col-6">
                <div className="text-center p-3 bg-light rounded">
                  <div className="h4 text-success mb-1">{categories.length}</div>
                  <small className="text-muted">Danh mục</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;