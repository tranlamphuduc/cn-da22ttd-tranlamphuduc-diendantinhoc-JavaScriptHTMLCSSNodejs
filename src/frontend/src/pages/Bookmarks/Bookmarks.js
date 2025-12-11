import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Pagination from '../../components/Pagination/Pagination';

const Bookmarks = () => {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchBookmarks();
  }, [pagination.page]);

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get('/api/bookmarks', {
        params: {
          page: pagination.page,
          limit: pagination.limit
        }
      });
      setBookmarks(response.data.bookmarks);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total,
        pages: response.data.pagination.pages
      }));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (postId) => {
    if (window.confirm('Bạn có chắc muốn bỏ lưu bài viết này?')) {
      try {
        await axios.delete(`/api/bookmarks/${postId}`);
        setBookmarks(bookmarks.filter(b => b.id !== postId));
        setPagination(prev => ({ ...prev, total: prev.total - 1 }));
      } catch (error) {
        console.error('Error removing bookmark:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    const plainText = content
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '[Code]')
      .replace(/!\[.*?\]\(.*?\)/g, '[Image]')
      .replace(/\[.*?\]\(.*?\)/g, '[Link]')
      .trim();
    
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
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
        <div className="col-lg-10 mx-auto">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-bookmark me-2 text-warning"></i>
                Bài viết đã lưu ({pagination.total})
              </h4>
            </div>
            <div className="card-body">
              {bookmarks.length > 0 ? (
                <>
                  {bookmarks.map(bookmark => (
                    <div key={bookmark.bookmark_id} className="post-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          <Link to={`/profile/${bookmark.user_id}`}>
                            {bookmark.avatar ? (
                              <img src={bookmark.avatar} alt="Avatar" className="avatar me-3" />
                            ) : (
                              <div className="avatar me-3 bg-primary d-flex align-items-center justify-content-center text-white">
                                {bookmark.full_name.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div>
                            <Link to={`/profile/${bookmark.user_id}`} className="text-decoration-none">
                              <h6 className="mb-0 text-dark">{bookmark.full_name}</h6>
                            </Link>
                            <small className="text-muted">@{bookmark.username}</small>
                          </div>
                        </div>
                        <span 
                          className="category-badge text-white"
                          style={{ backgroundColor: bookmark.category_color || '#007bff' }}
                        >
                          {bookmark.category_name}
                        </span>
                      </div>

                      <h5 className="mb-2">
                        <Link to={`/posts/${bookmark.id}`} className="text-decoration-none text-dark">
                          {bookmark.title}
                        </Link>
                      </h5>

                      <p className="text-muted mb-3">
                        {truncateContent(bookmark.content)}
                      </p>

                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                          <span className="me-3">
                            <i className="fas fa-eye me-1"></i>
                            {bookmark.views} lượt xem
                          </span>
                          <span className="me-3">
                            <i className="fas fa-comments me-1"></i>
                            {bookmark.comment_count} bình luận
                          </span>
                          <span className="me-3">
                            <i className="fas fa-bookmark me-1 text-warning"></i>
                            Đã lưu {formatDate(bookmark.bookmarked_at)}
                          </span>
                        </div>
                        <div className="d-flex gap-2">
                          <Link to={`/posts/${bookmark.id}`} className="btn btn-outline-primary btn-sm">
                            <i className="fas fa-eye me-1"></i>
                            Xem
                          </Link>
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleRemoveBookmark(bookmark.id)}
                          >
                            <i className="fas fa-trash me-1"></i>
                            Bỏ lưu
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Pagination
                    currentPage={pagination.page}
                    totalPages={pagination.pages}
                    onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                    totalItems={pagination.total}
                  />
                </>
              ) : (
                <div className="text-center py-5">
                  <i className="far fa-bookmark fa-4x text-muted mb-3"></i>
                  <h5>Chưa có bài viết nào được lưu</h5>
                  <p className="text-muted">Nhấn vào nút "Lưu" trên các bài viết để lưu lại đọc sau</p>
                  <Link to="/" className="btn btn-primary">
                    <i className="fas fa-home me-2"></i>
                    Khám phá bài viết
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bookmarks;
