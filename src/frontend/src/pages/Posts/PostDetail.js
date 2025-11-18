import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../../components/Reports/ReportButton';
import axios from 'axios';

const PostDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const viewIncrementedRef = useRef(new Set());

  useEffect(() => {
    fetchPost();
    fetchComments();
    
    // Tăng view chỉ một lần cho mỗi bài viết trong session
    if (!viewIncrementedRef.current.has(id)) {
      viewIncrementedRef.current.add(id);
      // Delay một chút để tránh race condition
      setTimeout(() => {
        incrementView();
      }, 500);
    }
  }, [id]);

  const fetchPost = async () => {
    try {
      // Chỉ lấy dữ liệu, không tăng view
      const response = await axios.get(`/api/posts/${id}`);
      setPost(response.data.post);
    } catch (error) {
      console.error('Error fetching post:', error);
    }
  };

  const incrementView = async () => {
    try {
      // Gọi API riêng để tăng view
      await axios.post(`/api/posts/${id}/view`);
    } catch (error) {
      console.error('Error incrementing view:', error);
      // Nếu lỗi, xóa khỏi set để có thể thử lại
      viewIncrementedRef.current.delete(id);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/comments/post/${id}`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await axios.post('/api/comments', {
        content: newComment,
        post_id: id
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
      try {
        await axios.delete(`/api/admin/comments/${commentId}`);
        setComments(comments.filter(comment => comment.id !== commentId));
        alert('Đã xóa bình luận thành công');
      } catch (error) {
        console.error('Error deleting comment:', error);
        alert('Có lỗi xảy ra khi xóa bình luận');
      }
    }
  };

  const handleDeletePost = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await axios.delete(`/api/admin/posts/${post.id}`);
        alert('Đã xóa bài viết thành công');
        window.location.href = '/';
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          Không tìm thấy bài viết
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        <div className="col-lg-8">
          {/* Post Content */}
          <div className="card mb-4">
            <div className="card-body">
              {/* Post Header */}
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="d-flex align-items-center">
                  <Link to={`/profile/${post.user_id}`} className="text-decoration-none">
                    {post.avatar ? (
                      <img 
                        src={post.avatar} 
                        alt="Avatar" 
                        className="avatar avatar-lg me-3"
                        style={{ cursor: 'pointer' }}
                      />
                    ) : (
                      <div className="avatar avatar-lg me-3 bg-primary d-flex align-items-center justify-content-center text-white" style={{ cursor: 'pointer' }}>
                        <h4 className="mb-0">{post.full_name.charAt(0).toUpperCase()}</h4>
                      </div>
                    )}
                  </Link>
                  <div>
                    <Link to={`/profile/${post.user_id}`} className="text-decoration-none">
                      <h5 className="mb-1 text-dark" style={{ cursor: 'pointer' }}>
                        {post.full_name}
                      </h5>
                    </Link>
                    <small className="text-muted">@{post.username}</small>
                    <br />
                    <small className="text-muted">
                      <i className="fas fa-clock me-1"></i>
                      {formatDate(post.created_at)}
                    </small>
                  </div>
                </div>
                <span 
                  className="category-badge text-white"
                  style={{ backgroundColor: post.category_color || '#007bff' }}
                >
                  {post.category_name}
                </span>
              </div>

              {/* Post Title */}
              <h1 className="mb-4">{post.title}</h1>

              {/* Post Stats */}
              <div className="d-flex align-items-center text-muted mb-4">
                <small className="me-3">
                  <i className="fas fa-eye me-1"></i>
                  {post.views} lượt xem
                </small>
                <small>
                  <i className="fas fa-comments me-1"></i>
                  {comments.length} bình luận
                </small>
              </div>

              {/* Post Content */}
              <div className="post-content">
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </div>
              </div>

              {/* Post Actions */}
              <div className="post-actions mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                <div>
                  {currentUser && currentUser.id !== post.user_id && (
                    <ReportButton
                      reportType="post"
                      targetId={post.id}
                      targetTitle={post.title}
                      className="small outline"
                    />
                  )}
                </div>
                
                {/* Admin Actions */}
                {currentUser && currentUser.role === 'admin' && (
                  <div className="admin-actions">
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={handleDeletePost}
                      title="Xóa bài viết (Admin)"
                    >
                      <i className="fas fa-trash me-1"></i>
                      Xóa bài viết
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="card">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-comments me-2"></i>
                Bình luận ({comments.length})
              </h5>
            </div>
            <div className="card-body">
              {/* Comment Form */}
              {currentUser ? (
                <form onSubmit={handleCommentSubmit} className="mb-4">
                  <div className="d-flex">
                    {currentUser.avatar ? (
                      <img 
                        src={currentUser.avatar} 
                        alt="Avatar" 
                        className="avatar me-3"
                      />
                    ) : (
                      <div className="avatar me-3 bg-primary d-flex align-items-center justify-content-center text-white">
                        {currentUser.full_name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <textarea
                        className="form-control mb-2"
                        rows="3"
                        placeholder="Viết bình luận của bạn..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        required
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={commentLoading || !newComment.trim()}
                      >
                        {commentLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Gửi bình luận
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="alert alert-info mb-4">
                  <Link to="/login">Đăng nhập</Link> để bình luận
                </div>
              )}

              {/* Comments List */}
              <div className="comments-list">
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <div key={comment.id} className="d-flex mb-4">
                      <Link to={`/profile/${comment.user_id}`} className="text-decoration-none">
                        {comment.avatar ? (
                          <img 
                            src={comment.avatar} 
                            alt="Avatar" 
                            className="avatar me-3"
                            style={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <div className="avatar me-3 bg-secondary d-flex align-items-center justify-content-center text-white" style={{ cursor: 'pointer' }}>
                            {comment.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </Link>
                      <div className="flex-grow-1">
                        <div className="bg-light rounded p-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <Link to={`/profile/${comment.user_id}`} className="text-decoration-none">
                              <h6 className="mb-0 text-dark" style={{ cursor: 'pointer' }}>
                                {comment.full_name}
                              </h6>
                            </Link>
                            <div className="d-flex align-items-center gap-2">
                              <small className="text-muted">
                                {formatDate(comment.created_at)}
                              </small>
                              {/* Admin delete comment button */}
                              {currentUser && currentUser.role === 'admin' && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteComment(comment.id)}
                                  title="Xóa bình luận (Admin)"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
                            {comment.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                    <h6>Chưa có bình luận nào</h6>
                    <p className="text-muted">Hãy là người đầu tiên bình luận!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="sidebar">
            <h5 className="mb-3">
              <i className="fas fa-user me-2"></i>
              Thông tin tác giả
            </h5>
            <div className="text-center">
              {post.avatar ? (
                <img 
                  src={post.avatar} 
                  alt="Avatar" 
                  className="avatar avatar-lg mb-3"
                />
              ) : (
                <div className="avatar avatar-lg mb-3 bg-primary d-flex align-items-center justify-content-center text-white mx-auto">
                  <h4 className="mb-0">{post.full_name.charAt(0).toUpperCase()}</h4>
                </div>
              )}
              <h6>{post.full_name}</h6>
              <p className="text-muted">@{post.username}</p>
              <Link 
                to={`/profile/${post.user_id}`}
                className="btn btn-outline-primary btn-sm"
              >
                Xem hồ sơ
              </Link>
            </div>
          </div>

          <div className="sidebar">
            <h5 className="mb-3">
              <i className="fas fa-share-alt me-2"></i>
              Chia sẻ
            </h5>
            <div className="d-grid gap-2">
              <button className="btn btn-outline-primary btn-sm">
                <i className="fab fa-facebook me-2"></i>
                Facebook
              </button>
              <button className="btn btn-outline-info btn-sm">
                <i className="fab fa-twitter me-2"></i>
                Twitter
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={() => navigator.clipboard.writeText(window.location.href)}
              >
                <i className="fas fa-link me-2"></i>
                Sao chép liên kết
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;