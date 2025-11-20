import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../../components/Reports/ReportButton';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import axios from 'axios';

const PostDetail = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
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

  const handleReplySubmit = async (e, parentCommentId) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setReplyLoading(true);
    try {
      await axios.post('/api/comments', {
        content: replyContent,
        post_id: id,
        parent_id: parentCommentId
      });
      setReplyContent('');
      setReplyingTo(null);
      fetchComments();
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setReplyLoading(false);
    }
  };

  const handleReplyClick = (commentId, username) => {
    setReplyingTo(commentId);
    setReplyContent(`@${username} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setReplyContent('');
  };

  const toggleRepliesExpansion = (commentId) => {
    const newExpandedReplies = new Set(expandedReplies);
    if (newExpandedReplies.has(commentId)) {
      newExpandedReplies.delete(commentId);
    } else {
      newExpandedReplies.add(commentId);
    }
    setExpandedReplies(newExpandedReplies);
  };

  const getVisibleReplies = (replies, commentId) => {
    const isExpanded = expandedReplies.has(commentId);
    return isExpanded ? replies : replies.slice(0, 2);
  };

  // Hàm chia sẻ lên Facebook
  const shareToFacebook = () => {
    const url = encodeURIComponent(window.location.href);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes');
  };

  // Hàm chia sẻ lên Twitter
  const shareToTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    const author = encodeURIComponent(`@${post.username}`);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${title}&url=${url}&via=${author}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  // Hàm sao chép liên kết với thông báo
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      // Hiển thị thông báo thành công
      const button = document.querySelector('.copy-link-btn');
      const originalText = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check me-2"></i>Đã sao chép!';
      button.classList.remove('btn-outline-secondary');
      button.classList.add('btn-success');
      
      setTimeout(() => {
        button.innerHTML = originalText;
        button.classList.remove('btn-success');
        button.classList.add('btn-outline-secondary');
      }, 2000);
    } catch (error) {
      console.error('Không thể sao chép:', error);
      // Fallback cho trình duyệt cũ
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Đã sao chép liên kết!');
    }
  };

  // Hàm để extract YouTube video ID từ URL
  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Component để render YouTube video
  const YouTubeEmbed = ({ videoId }) => {
    return (
      <div className="youtube-embed-container">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  // Hàm để process content và thay thế YouTube links
  const processContentWithYouTube = (content) => {
    // Regex để tìm YouTube URLs trên dòng riêng biệt
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(\S*)?$/gm;
    
    const processedContent = content.replace(youtubeRegex, (match) => {
      console.log('Found YouTube URL:', match);
      const videoId = getYouTubeVideoId(match);
      console.log('Extracted video ID:', videoId);
      if (videoId) {
        const replacement = `![YouTube Video](YOUTUBE_EMBED_${videoId})`;
        console.log('Replacement:', replacement);
        return replacement;
      }
      return match;
    });
    
    console.log('Original content:', content);
    console.log('Processed content:', processedContent);
    return processedContent;
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
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={tomorrow}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    img({ node, ...props }) {
                      // Kiểm tra nếu src bắt đầu với YOUTUBE_EMBED_
                      if (props.src && props.src.startsWith('YOUTUBE_EMBED_')) {
                        const videoId = props.src.replace('YOUTUBE_EMBED_', '');
                        return <YouTubeEmbed videoId={videoId} />;
                      }
                      
                      return (
                        <img
                          {...props}
                          className="img-fluid rounded"
                          style={{ maxWidth: '100%', height: 'auto' }}
                          loading="lazy"
                        />
                      );
                    },
                    a({ node, ...props }) {
                      return (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary"
                        />
                      );
                    },
                    blockquote({ node, ...props }) {
                      return (
                        <blockquote
                          className="blockquote border-start border-primary border-3 ps-3 ms-3"
                          {...props}
                        />
                      );
                    },
                    table({ node, ...props }) {
                      return (
                        <div className="table-responsive">
                          <table className="table table-striped" {...props} />
                        </div>
                      );
                    }
                  }}
                >
                  {processContentWithYouTube(post.content)}
                </ReactMarkdown>
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
                          <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                            {comment.content}
                          </p>
                          
                          {/* Comment Actions */}
                          <div className="d-flex align-items-center gap-2 mt-2">
                            {currentUser && (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleReplyClick(comment.id, comment.username)}
                                title="Trả lời bình luận"
                              >
                                <i className="fas fa-reply me-1"></i>
                                Trả lời
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && currentUser && (
                          <div className="reply-form">
                            <form onSubmit={(e) => handleReplySubmit(e, comment.id)}>
                              <div className="d-flex">
                                {currentUser.avatar ? (
                                  <img 
                                    src={currentUser.avatar} 
                                    alt="Avatar" 
                                    className="avatar avatar-sm me-2"
                                  />
                                ) : (
                                  <div className="avatar avatar-sm me-2 bg-primary d-flex align-items-center justify-content-center text-white">
                                    {currentUser.full_name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div className="flex-grow-1">
                                  <textarea
                                    className="form-control mb-2"
                                    rows="2"
                                    placeholder={`Trả lời @${comment.username}...`}
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    required
                                  />
                                  <div className="d-flex gap-2">
                                    <button
                                      type="submit"
                                      className="btn btn-primary btn-sm"
                                      disabled={replyLoading || !replyContent.trim()}
                                    >
                                      {replyLoading ? (
                                        <>
                                          <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                                          Đang gửi...
                                        </>
                                      ) : (
                                        <>
                                          <i className="fas fa-paper-plane me-1"></i>
                                          Gửi
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      className="btn btn-secondary btn-sm"
                                      onClick={handleCancelReply}
                                    >
                                      Hủy
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </form>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="replies mt-3 ms-4">
                            {/* Hiển thị replies (chỉ 2 đầu tiên hoặc tất cả nếu đã expand) */}
                            {getVisibleReplies(comment.replies, comment.id).map(reply => (
                              <div key={reply.id} className="d-flex mb-3">
                                <Link to={`/profile/${reply.user_id}`} className="text-decoration-none">
                                  {reply.avatar ? (
                                    <img 
                                      src={reply.avatar} 
                                      alt="Avatar" 
                                      className="avatar avatar-sm me-2"
                                      style={{ cursor: 'pointer' }}
                                    />
                                  ) : (
                                    <div className="avatar avatar-sm me-2 bg-info d-flex align-items-center justify-content-center text-white" style={{ cursor: 'pointer' }}>
                                      {reply.full_name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                </Link>
                                <div className="flex-grow-1">
                                  <div className="bg-white border rounded p-2">
                                    <div className="d-flex justify-content-between align-items-center mb-1">
                                      <Link to={`/profile/${reply.user_id}`} className="text-decoration-none">
                                        <small className="fw-bold text-dark" style={{ cursor: 'pointer' }}>
                                          {reply.full_name}
                                        </small>
                                      </Link>
                                      <div className="d-flex align-items-center gap-2">
                                        <small className="text-muted">
                                          {formatDate(reply.created_at)}
                                        </small>
                                        {/* Admin delete reply button */}
                                        {currentUser && currentUser.role === 'admin' && (
                                          <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDeleteComment(reply.id)}
                                            title="Xóa trả lời (Admin)"
                                          >
                                            <i className="fas fa-trash"></i>
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    <p className="mb-0" style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* Nút "Xem thêm" / "Ẩn bớt" nếu có nhiều hơn 2 replies */}
                            {comment.replies.length > 2 && (
                              <div className="d-flex justify-content-start mb-2">
                                <button
                                  className="btn btn-link btn-sm text-primary p-0"
                                  onClick={() => toggleRepliesExpansion(comment.id)}
                                  style={{ textDecoration: 'none', fontSize: '0.9rem' }}
                                >
                                  {expandedReplies.has(comment.id) ? (
                                    <>
                                      <i className="fas fa-chevron-up me-1"></i>
                                      Ẩn bớt trả lời
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-chevron-down me-1"></i>
                                      Xem thêm {comment.replies.length - 2} trả lời
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
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
              <button 
                className="btn btn-outline-primary btn-sm"
                onClick={shareToFacebook}
                title="Chia sẻ lên Facebook"
              >
                <i className="fab fa-facebook me-2"></i>
                Facebook
              </button>
              <button 
                className="btn btn-outline-info btn-sm"
                onClick={shareToTwitter}
                title="Chia sẻ lên Twitter"
              >
                <i className="fab fa-twitter me-2"></i>
                Twitter
              </button>
              <button 
                className="btn btn-outline-secondary btn-sm copy-link-btn"
                onClick={copyToClipboard}
                title="Sao chép liên kết"
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