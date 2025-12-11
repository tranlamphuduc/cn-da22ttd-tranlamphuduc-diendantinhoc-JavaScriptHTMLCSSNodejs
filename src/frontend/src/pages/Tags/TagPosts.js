import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Pagination from '../../components/Pagination/Pagination';

const TagPosts = () => {
  const { slug } = useParams();
  const [tag, setTag] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchTagPosts();
  }, [slug, pagination.page]);

  const fetchTagPosts = async () => {
    try {
      const response = await axios.get(`/api/tags/${slug}/posts`, {
        params: {
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setTag(response.data.tag);
      setPosts(response.data.posts);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching tag posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (!tag) {
    return (
      <div className="container">
        <div className="alert alert-danger">Không tìm thấy tag này</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-8">
          {/* Tag Header */}
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ 
                    width: '60px', 
                    height: '60px', 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    fontSize: '1.5rem'
                  }}
                >
                  #
                </div>
                <div>
                  <h2 className="mb-1">#{tag.name}</h2>
                  <p className="text-muted mb-0">
                    {pagination.total} bài viết
                  </p>
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
                          <img src={post.avatar} alt="Avatar" className="avatar me-3" />
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
                      <Link to={`/posts/${post.id}`} className="text-decoration-none text-dark">
                        {post.title}
                      </Link>
                    </h5>

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
                      <Link to={`/posts/${post.id}`} className="btn btn-outline-primary btn-sm">
                        Đọc thêm
                      </Link>
                    </div>
                  </div>
                ))}

                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={handlePageChange}
                  totalItems={pagination.total}
                />
              </>
            ) : (
              <div className="text-center py-5">
                <i className="fas fa-hashtag fa-3x text-muted mb-3"></i>
                <h5>Chưa có bài viết nào với tag này</h5>
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-4">
          <div className="sidebar">
            <h5 className="mb-3">
              <i className="fas fa-arrow-left me-2"></i>
              Quay lại
            </h5>
            <Link to="/" className="btn btn-outline-primary w-100">
              <i className="fas fa-home me-2"></i>
              Trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagPosts;
