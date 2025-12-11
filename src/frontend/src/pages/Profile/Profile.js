import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../../components/Reports/ReportButton';
import ReportStatus from '../../components/Reports/ReportStatus';
import FollowButton from '../../components/Follows/FollowButton';
import Pagination from '../../components/Pagination/Pagination';
import axios from 'axios';

const Profile = () => {
  const { id } = useParams();
  const { currentUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [commentedPosts, setCommentedPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [followingList, setFollowingList] = useState([]);
  const [followersList, setFollowersList] = useState([]);
  const [followStats, setFollowStats] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    avatar: null
  });
  const [editLoading, setEditLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [pagination, setPagination] = useState({
    posts: { page: 1, limit: 10, total: 0, pages: 0 },
    documents: { page: 1, limit: 12, total: 0, pages: 0 },
    commentedPosts: { page: 1, limit: 10, total: 0, pages: 0 },
    reports: { page: 1, limit: 10, total: 0, pages: 0 },
    notifications: { page: 1, limit: 10, total: 0, pages: 0 },
    bookmarks: { page: 1, limit: 10, total: 0, pages: 0 }
  });

  useEffect(() => {
    fetchUserData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'commentedPosts') {
      fetchCommentedPosts();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'notifications') {
      fetchNotifications();
    } else if (activeTab === 'bookmarks') {
      fetchBookmarks();
    } else if (activeTab === 'following') {
      fetchFollowing();
    } else if (activeTab === 'followers') {
      fetchFollowers();
    }
  }, [activeTab, pagination.posts.page, pagination.documents.page, pagination.commentedPosts.page, pagination.reports.page, pagination.notifications.page]);

  const fetchUserData = async () => {
    try {
      const userRes = await axios.get(`/api/users/profile/${id}`);
      setUser(userRes.data.user);
      
      // Set edit form data
      setEditForm({
        username: userRes.data.user.username,
        full_name: userRes.data.user.full_name,
        avatar: null
      });

      // Fetch follow stats
      try {
        const statsRes = await axios.get(`/api/follows/stats/${id}`);
        setFollowStats(statsRes.data);
      } catch (e) {
        console.error('Error fetching follow stats:', e);
      }

      // Fetch tất cả số lượng cho các tab ngay khi load trang
      await fetchAllCounts();

      // Fetch initial data for active tab
      if (activeTab === 'posts') {
        await fetchPosts();
      } else {
        await fetchDocuments();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch tất cả số lượng cho các tab
  const fetchAllCounts = async () => {
    try {
      // Fetch posts count
      const postsRes = await axios.get(`/api/users/${id}/posts`, { params: { page: 1, limit: 1 } });
      setPagination(prev => ({
        ...prev,
        posts: { ...prev.posts, total: postsRes.data.pagination.total, pages: postsRes.data.pagination.pages }
      }));

      // Fetch documents count
      const docsRes = await axios.get(`/api/users/${id}/documents`, { params: { page: 1, limit: 1 } });
      setPagination(prev => ({
        ...prev,
        documents: { ...prev.documents, total: docsRes.data.pagination.total, pages: docsRes.data.pagination.pages }
      }));

      // Fetch commented posts count
      const commentedRes = await axios.get(`/api/users/${id}/commented-posts`, { params: { page: 1, limit: 1 } });
      setPagination(prev => ({
        ...prev,
        commentedPosts: { ...prev.commentedPosts, total: commentedRes.data.pagination.total, pages: commentedRes.data.pagination.pages }
      }));

      // Fetch counts chỉ cho chủ tài khoản
      if (currentUser && currentUser.id === parseInt(id)) {
        // Fetch bookmarks count
        try {
          const bookmarksRes = await axios.get('/api/bookmarks', { params: { page: 1, limit: 1 } });
          setPagination(prev => ({
            ...prev,
            bookmarks: { ...prev.bookmarks, total: bookmarksRes.data.pagination.total, pages: bookmarksRes.data.pagination.pages }
          }));
        } catch (e) { console.error('Error fetching bookmarks count:', e); }

        // Fetch reports count
        try {
          const reportsRes = await axios.get('/api/reports/my-reports', { params: { page: 1, limit: 1 } });
          setPagination(prev => ({
            ...prev,
            reports: { ...prev.reports, total: reportsRes.data.pagination.total, pages: reportsRes.data.pagination.pages }
          }));
        } catch (e) { console.error('Error fetching reports count:', e); }

        // Fetch notifications để hiển thị số chưa đọc
        try {
          const notificationsRes = await axios.get('/api/notifications');
          setNotifications(notificationsRes.data.notifications || []);
          setPagination(prev => ({
            ...prev,
            notifications: { ...prev.notifications, total: notificationsRes.data.notifications?.length || 0, pages: 1 }
          }));
        } catch (e) { console.error('Error fetching notifications count:', e); }
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await axios.get('/api/bookmarks', {
        params: {
          page: pagination.bookmarks.page,
          limit: pagination.bookmarks.limit
        }
      });
      setBookmarks(response.data.bookmarks);
      setPagination(prev => ({
        ...prev,
        bookmarks: {
          ...prev.bookmarks,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const response = await axios.get('/api/follows/following');
      setFollowingList(response.data.following || []);
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const response = await axios.get('/api/follows/followers');
      setFollowersList(response.data.followers || []);
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`/api/users/${id}/posts`, {
        params: {
          page: pagination.posts.page,
          limit: pagination.posts.limit
        }
      });
      
      setPosts(response.data.posts);
      setPagination(prev => ({
        ...prev,
        posts: {
          ...prev.posts,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/api/users/${id}/documents`, {
        params: {
          page: pagination.documents.page,
          limit: pagination.documents.limit
        }
      });
      
      setDocuments(response.data.documents);
      setPagination(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchCommentedPosts = async () => {
    try {
      const response = await axios.get(`/api/users/${id}/commented-posts`, {
        params: {
          page: pagination.commentedPosts.page,
          limit: pagination.commentedPosts.limit
        }
      });
      
      setCommentedPosts(response.data.posts);
      setPagination(prev => ({
        ...prev,
        commentedPosts: {
          ...prev.commentedPosts,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching commented posts:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/reports/my-reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: pagination.reports.page,
          limit: pagination.reports.limit
        }
      });
      
      setReports(response.data.reports);
      setPagination(prev => ({
        ...prev,
        reports: {
          ...prev.reports,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications || []);
      setPagination(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          total: response.data.notifications?.length || 0,
          pages: 1
        }
      }));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.put(`/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment': return { icon: 'fas fa-comment', color: 'text-primary' };
      case 'post_deleted': return { icon: 'fas fa-trash', color: 'text-danger' };
      case 'comment_deleted': return { icon: 'fas fa-comment-slash', color: 'text-warning' };
      case 'document_deleted': return { icon: 'fas fa-file-excel', color: 'text-danger' };
      case 'report_warning': return { icon: 'fas fa-exclamation-triangle', color: 'text-warning' };
      case 'penalty_reduced': return { icon: 'fas fa-gift', color: 'text-success' };
      case 'user_banned': return { icon: 'fas fa-ban', color: 'text-danger' };
      case 'user_unbanned': return { icon: 'fas fa-unlock', color: 'text-success' };
      case 'admin_message': return { icon: 'fas fa-bullhorn', color: 'text-info' };
      default: return { icon: 'fas fa-bell', color: 'text-info' };
    }
  };

  const handlePageChange = (tabType, newPage) => {
    setPagination(prev => ({
      ...prev,
      [tabType]: { ...prev[tabType], page: newPage }
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset pagination when switching tabs
    setPagination(prev => ({
      ...prev,
      [tab]: { ...prev[tab], page: 1 }
    }));
  };

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      username: user.username,
      full_name: user.full_name,
      avatar: null
    });
  };

  const handleEditFormChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'avatar') {
      setEditForm({ ...editForm, avatar: files[0] });
    } else {
      setEditForm({ ...editForm, [name]: value });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', editForm.username);
      formData.append('full_name', editForm.full_name);
      if (editForm.avatar) {
        formData.append('avatar', editForm.avatar);
      }

      const response = await axios.put(`/api/users/profile/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setUser(response.data.user);
      if (currentUser.id === parseInt(id)) {
        updateUser(response.data.user);
      }
      setIsEditing(false);
      alert('Cập nhật thông tin thành công!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeletePost = async (postId, postTitle) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa bài viết "${postTitle}"?`)) {
      try {
        await axios.delete(`/api/posts/${postId}`);
        setPosts(posts.filter(post => post.id !== postId));
        setUser({ ...user, post_count: user.post_count - 1 });
        alert('Đã xóa bài viết thành công');
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
    }
  };

  const handleDeleteDocument = async (documentId, documentTitle) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài liệu "${documentTitle}"?`)) {
      try {
        await axios.delete(`/api/documents/${documentId}`);
        setDocuments(documents.filter(doc => doc.id !== documentId));
        setUser({ ...user, document_count: user.document_count - 1 });
        alert('Đã xóa tài liệu thành công');
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Có lỗi xảy ra khi xóa tài liệu');
      }
    }
  };

  const handleDownloadDocument = async (documentId) => {
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
      
      console.log('Profile - Content-Disposition header:', contentDisposition);
      
      if (contentDisposition) {
        // Thử parse filename*=UTF-8'' format trước
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
        if (utf8Match) {
          filename = decodeURIComponent(utf8Match[1]);
          console.log('Profile - Parsed UTF-8 filename:', filename);
        } else {
          // Fallback sang filename="..." format
          const normalMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (normalMatch) {
            filename = normalMatch[1];
            console.log('Profile - Parsed normal filename:', filename);
          } else {
            // Thử parse filename= format (không có quotes)
            const simpleMatch = contentDisposition.match(/filename=([^;]+)/);
            if (simpleMatch) {
              filename = simpleMatch[1].trim();
              console.log('Profile - Parsed simple filename:', filename);
            }
          }
        }
      } else {
        console.log('Profile - No Content-Disposition header found');
      }
      
      console.log('Profile - Final download filename:', filename);
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Có lỗi xảy ra khi tải file');
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

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container">
        <div className="alert alert-danger" role="alert">
          Không tìm thấy người dùng
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row">
        {/* Profile Header */}
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-body">
              <div className="row align-items-center">
                <div className="col-auto">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Avatar" 
                      className="avatar"
                      style={{ width: '100px', height: '100px' }}
                    />
                  ) : (
                    <div 
                      className="bg-primary d-flex align-items-center justify-content-center text-white"
                      style={{ 
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%',
                        fontSize: '2rem'
                      }}
                    >
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="col">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      {!isEditing ? (
                        <>
                          <h2 className="mb-1">{user.full_name}</h2>
                          <p className="text-muted mb-2">@{user.username}</p>
                          <p className="text-muted mb-3">{user.email}</p>
                          <small className="text-muted">
                            <i className="fas fa-calendar me-1"></i>
                            Tham gia từ {formatDate(user.created_at)}
                          </small>
                        </>
                      ) : (
                        <form onSubmit={handleSaveProfile} className="edit-profile-form">
                          <div className="mb-3">
                            <label className="form-label">Tên hiển thị</label>
                            <input
                              type="text"
                              className="form-control"
                              name="full_name"
                              value={editForm.full_name}
                              onChange={handleEditFormChange}
                              required
                            />
                            <small className="text-muted">Tên hiển thị phải là duy nhất trong hệ thống</small>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Tên người dùng</label>
                            <input
                              type="text"
                              className="form-control"
                              name="username"
                              value={editForm.username}
                              onChange={handleEditFormChange}
                              required
                            />
                            <small className="text-muted">Tên người dùng phải là duy nhất trong hệ thống</small>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Avatar</label>
                            <input
                              type="file"
                              className="form-control"
                              name="avatar"
                              accept="image/*"
                              onChange={handleEditFormChange}
                            />
                            <small className="text-muted">Chọn ảnh mới để thay đổi avatar</small>
                          </div>
                          <div className="d-flex gap-2">
                            <button 
                              type="submit" 
                              className="btn btn-primary btn-sm"
                              disabled={editLoading}
                            >
                              {editLoading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button 
                              type="button" 
                              className="btn btn-secondary btn-sm"
                              onClick={handleCancelEdit}
                              disabled={editLoading}
                            >
                              Hủy
                            </button>
                          </div>
                        </form>
                      )}
                    </div>
                    
                    <div className="d-flex gap-2">
                      {/* Edit Profile Button (only for own profile) */}
                      {currentUser && currentUser.id === parseInt(id) && !isEditing && (
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={handleEditProfile}
                        >
                          <i className="fas fa-edit me-1"></i>
                          Chỉnh sửa
                        </button>
                      )}
                      
                      {/* Follow Button (only for other users) */}
                      {currentUser && currentUser.id !== parseInt(id) && (
                        <FollowButton
                          userId={id}
                          userName={user.full_name}
                          onFollowChange={(isFollowing) => {
                            setFollowStats(prev => ({
                              ...prev,
                              followers: isFollowing ? prev.followers + 1 : prev.followers - 1
                            }));
                          }}
                        />
                      )}
                      
                      {/* Report Button (only for other users) */}
                      {currentUser && currentUser.id !== parseInt(id) && (
                        <ReportButton
                          reportType="user"
                          targetId={parseInt(id)}
                          targetTitle={user.full_name}
                          className="small outline"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="col-12">
          <div className="row mb-4">
            <div className="col-6 col-md-2">
              <div className="stat-card text-center">
                <div className="stat-icon text-primary mb-2">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-number text-primary">{user.post_count}</div>
                <div className="stat-label">Bài viết</div>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="stat-card text-center">
                <div className="stat-icon text-success mb-2">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="stat-number text-success">{user.comment_count}</div>
                <div className="stat-label">Bình luận</div>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="stat-card text-center">
                <div className="stat-icon text-info mb-2">
                  <i className="fas fa-file-download"></i>
                </div>
                <div className="stat-number text-info">{user.document_count}</div>
                <div className="stat-label">Tài liệu</div>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="stat-card text-center">
                <div className="stat-icon text-danger mb-2">
                  <i className="fas fa-users"></i>
                </div>
                <div className="stat-number text-danger">{followStats.followers}</div>
                <div className="stat-label">Người theo dõi</div>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="stat-card text-center">
                <div className="stat-icon text-secondary mb-2">
                  <i className="fas fa-user-friends"></i>
                </div>
                <div className="stat-number text-secondary">{followStats.following}</div>
                <div className="stat-label">Đang theo dõi</div>
              </div>
            </div>
            <div className="col-6 col-md-2">
              <div className="stat-card text-center">
                <div className="stat-icon text-warning mb-2">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="stat-number text-warning">
                  {user.post_count + user.comment_count + user.document_count}
                </div>
                <div className="stat-label">Điểm</div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="col-12">
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
                onClick={() => handleTabChange('posts')}
              >
                <i className="fas fa-file-alt me-2"></i>
                Bài viết ({pagination.posts.total})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => handleTabChange('documents')}
              >
                <i className="fas fa-file-download me-2"></i>
                Tài liệu ({pagination.documents.total || 0})
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === 'commentedPosts' ? 'active' : ''}`}
                onClick={() => handleTabChange('commentedPosts')}
              >
                <i className="fas fa-comment me-2"></i>
                Đã bình luận ({pagination.commentedPosts.total || 0})
              </button>
            </li>
            {/* Chỉ hiển thị các tab riêng tư cho chính chủ tài khoản */}
            {currentUser && currentUser.id === parseInt(id) && (
              <>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'bookmarks' ? 'active' : ''}`}
                    onClick={() => handleTabChange('bookmarks')}
                  >
                    <i className="fas fa-bookmark me-2 text-warning"></i>
                    Đã lưu ({pagination.bookmarks.total || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'following' ? 'active' : ''}`}
                    onClick={() => handleTabChange('following')}
                  >
                    <i className="fas fa-user-friends me-2"></i>
                    Đang theo dõi ({followStats.following})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'followers' ? 'active' : ''}`}
                    onClick={() => handleTabChange('followers')}
                  >
                    <i className="fas fa-users me-2"></i>
                    Người theo dõi ({followStats.followers})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => handleTabChange('reports')}
                  >
                    <i className="fas fa-flag me-2"></i>
                    Báo cáo của tôi ({pagination.reports.total || 0})
                  </button>
                </li>
                <li className="nav-item">
                  <button 
                    className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => handleTabChange('notifications')}
                  >
                    <i className="fas fa-bell me-2 text-primary"></i>
                    Thông báo ({pagination.notifications.total || 0})
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <span className="badge bg-danger ms-1">
                        {notifications.filter(n => !n.is_read).length}
                      </span>
                    )}
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="row">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div key={post.id} className="col-12 mb-3">
                    <div className="post-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="mb-0">
                          <a href={`/posts/${post.id}`} className="text-decoration-none text-dark">
                            {post.title}
                          </a>
                        </h5>
                        <span 
                          className="category-badge text-white"
                          style={{ backgroundColor: post.category_color || '#007bff' }}
                        >
                          {post.category_name}
                        </span>
                      </div>
                      <p className="text-muted mb-2">
                        {post.content.substring(0, 200)}...
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                          <span className="me-3">
                            <i className="fas fa-eye me-1"></i>
                            {post.views} lượt xem
                          </span>
                          <span className="me-3">
                            <i className="fas fa-comments me-1"></i>
                            {post.comment_count} bình luận
                          </span>
                          <span>
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        <div className="d-flex gap-2">
                          <a href={`/posts/${post.id}`} className="btn btn-outline-primary btn-sm">
                            Đọc thêm
                          </a>
                          {/* Delete button for own posts */}
                          {currentUser && currentUser.id === parseInt(id) && (
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => handleDeletePost(post.id, post.title)}
                              title="Xóa bài viết"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="fas fa-file-alt fa-3x text-muted mb-3"></i>
                    <h5>Chưa có bài viết nào</h5>
                    <p className="text-muted">Người dùng này chưa đăng bài viết nào</p>
                  </div>
                </div>
              )}
              
              {/* Pagination for Posts */}
              {posts.length > 0 && (
                <div className="col-12">
                  <Pagination
                    currentPage={pagination.posts.page}
                    totalPages={pagination.posts.pages}
                    onPageChange={(page) => handlePageChange('posts', page)}
                    totalItems={pagination.posts.total}
                  />
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="row">
              {documents.length > 0 ? (
                documents.map(document => (
                  <div key={document.id} className="col-md-6 col-lg-4 mb-4">
                    <div className="card h-100">
                      <div className="card-body d-flex flex-column">
                        <div className="text-center mb-3">
                          <i className={`${getFileIcon(document.file_name)} fa-3x`}></i>
                        </div>
                        <h6 className="card-title">{document.title}</h6>
                        {document.description && (
                          <p className="card-text text-muted small">
                            {document.description.length > 100 
                              ? document.description.substring(0, 100) + '...'
                              : document.description
                            }
                          </p>
                        )}
                        <div className="mb-2">
                          <span 
                            className="category-badge text-white"
                            style={{ backgroundColor: document.category_color || '#007bff' }}
                          >
                            {document.category_name}
                          </span>
                        </div>
                        <div className="text-muted small mb-3">
                          <div>
                            <i className="fas fa-hdd me-1"></i>
                            {formatFileSize(document.file_size)}
                          </div>
                          <div>
                            <i className="fas fa-download me-1"></i>
                            {document.downloads} lượt tải
                          </div>
                          <div>
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(document.created_at)}
                          </div>
                        </div>
                        <div className="mt-auto">
                          <button 
                            className="btn btn-primary w-100 mb-2"
                            onClick={() => handleDownloadDocument(document.id)}
                          >
                            <i className="fas fa-download me-2"></i>
                            Tải xuống
                          </button>
                          
                          {/* Delete button for own documents */}
                          {currentUser && currentUser.id === parseInt(id) && (
                            <button
                              className="btn btn-outline-danger w-100"
                              onClick={() => handleDeleteDocument(document.id, document.title)}
                              title="Xóa tài liệu"
                            >
                              <i className="fas fa-trash me-2"></i>
                              Xóa tài liệu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="fas fa-file-download fa-3x text-muted mb-3"></i>
                    <h5>Chưa có tài liệu nào</h5>
                    <p className="text-muted">Người dùng này chưa tải lên tài liệu nào</p>
                  </div>
                </div>
              )}
              
              {/* Pagination for Documents */}
              {documents.length > 0 && (
                <div className="col-12">
                  <Pagination
                    currentPage={pagination.documents.page}
                    totalPages={pagination.documents.pages}
                    onPageChange={(page) => handlePageChange('documents', page)}
                    totalItems={pagination.documents.total}
                  />
                </div>
              )}
            </div>
          )}

          {/* Commented Posts Tab */}
          {activeTab === 'commentedPosts' && (
            <div className="row">
              {commentedPosts.length > 0 ? (
                commentedPosts.map(post => (
                  <div key={post.id} className="col-12 mb-3">
                    <div className="post-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h5 className="mb-0">
                          <a href={`/posts/${post.id}`} className="text-decoration-none text-dark">
                            {post.title}
                          </a>
                        </h5>
                        <span 
                          className="category-badge text-white"
                          style={{ backgroundColor: post.category_color || '#007bff' }}
                        >
                          {post.category_name}
                        </span>
                      </div>
                      <p className="text-muted mb-2">
                        {post.content.substring(0, 200)}...
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                          <span className="me-3">
                            <i className="fas fa-user me-1"></i>
                            {post.author_name}
                          </span>
                          <span className="me-3">
                            <i className="fas fa-eye me-1"></i>
                            {post.views} lượt xem
                          </span>
                          <span className="me-3">
                            <i className="fas fa-comments me-1"></i>
                            {post.comment_count} bình luận
                          </span>
                          <span>
                            <i className="fas fa-calendar me-1"></i>
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        <div className="d-flex gap-2">
                          <a href={`/posts/${post.id}`} className="btn btn-outline-primary btn-sm">
                            Xem bài viết
                          </a>
                        </div>
                      </div>
                      {/* Hiển thị bình luận gần đây nhất của user */}
                      {post.latest_comment && (
                        <div className="mt-3 p-3 bg-light rounded">
                          <small className="text-muted">Bình luận gần đây của bạn:</small>
                          <p className="mb-0 mt-1">
                            {post.latest_comment.length > 150 
                              ? post.latest_comment.substring(0, 150) + '...'
                              : post.latest_comment
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="fas fa-comment fa-3x text-muted mb-3"></i>
                    <h5>Chưa bình luận bài viết nào</h5>
                    <p className="text-muted">Người dùng này chưa bình luận bài viết nào</p>
                  </div>
                </div>
              )}
              
              {/* Pagination for Commented Posts */}
              {commentedPosts.length > 0 && (
                <div className="col-12">
                  <Pagination
                    currentPage={pagination.commentedPosts.page}
                    totalPages={pagination.commentedPosts.pages}
                    onPageChange={(page) => handlePageChange('commentedPosts', page)}
                    totalItems={pagination.commentedPosts.total}
                  />
                </div>
              )}
            </div>
          )}

          {/* Reports Tab - Only for own profile */}
          {activeTab === 'reports' && currentUser && currentUser.id === parseInt(id) && (
            <div className="row">
              <div className="col-12">
                {/* Report Status Component */}
                <ReportStatus />
                
                {/* Reports List */}
                <div className="card mt-4">
                  <div className="card-header">
                    <h6 className="mb-0">
                      <i className="fas fa-list me-2"></i>
                      Lịch sử báo cáo
                    </h6>
                  </div>
                  <div className="card-body">
                    {reports.length > 0 ? (
                      <div className="table-responsive">
                        <table className="table table-hover">
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>Loại</th>
                              <th>Đối tượng</th>
                              <th>Lý do</th>
                              <th>Trạng thái</th>
                              <th>Ngày gửi</th>
                              <th>Ghi chú admin</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reports.map(report => (
                              <tr key={report.id} className={report.is_false_report ? 'table-danger' : ''}>
                                <td>#{report.id}</td>
                                <td>
                                  <span className="badge bg-secondary">
                                    {report.report_type === 'user' ? 'Người dùng' : 
                                     report.report_type === 'post' ? 'Bài viết' : 'Tài liệu'}
                                  </span>
                                </td>
                                <td>
                                  <div className="text-truncate" style={{ maxWidth: '200px' }}>
                                    {report.reported_content_name || 'Đã bị xóa'}
                                  </div>
                                </td>
                                <td>
                                  {(() => {
                                    const reasons = {
                                      spam: 'Spam',
                                      inappropriate: 'Nội dung không phù hợp',
                                      harassment: 'Quấy rối',
                                      fake_info: 'Thông tin sai lệch',
                                      copyright: 'Vi phạm bản quyền',
                                      other: 'Khác'
                                    };
                                    return reasons[report.reason] || report.reason;
                                  })()}
                                </td>
                                <td>
                                  <span className={`badge ${
                                    report.is_false_report ? 'bg-danger' :
                                    report.status === 'pending' ? 'bg-warning text-dark' :
                                    report.status === 'reviewed' ? 'bg-info' :
                                    report.status === 'resolved' ? 'bg-success' : 'bg-secondary'
                                  }`}>
                                    {report.is_false_report ? 'Báo cáo sai' :
                                     report.status === 'pending' ? 'Chờ xử lý' :
                                     report.status === 'reviewed' ? 'Đã xem xét' :
                                     report.status === 'resolved' ? 'Đã giải quyết' : 'Đã bỏ qua'}
                                  </span>
                                </td>
                                <td>
                                  <small>{formatDate(report.created_at)}</small>
                                </td>
                                <td>
                                  {report.admin_note ? (
                                    <div className="text-truncate" style={{ maxWidth: '200px' }} title={report.admin_note}>
                                      {report.admin_note}
                                    </div>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-flag fa-3x text-muted mb-3"></i>
                        <h5>Chưa có báo cáo nào</h5>
                        <p className="text-muted">Bạn chưa gửi báo cáo nào.</p>
                      </div>
                    )}
                    
                    {/* Pagination for Reports */}
                    {reports.length > 0 && (
                      <Pagination
                        currentPage={pagination.reports.page}
                        totalPages={pagination.reports.pages}
                        onPageChange={(page) => handlePageChange('reports', page)}
                        totalItems={pagination.reports.total}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab - Only for own profile */}
          {activeTab === 'notifications' && currentUser && currentUser.id === parseInt(id) && (
            <div className="row">
              <div className="col-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h6 className="mb-0">
                      <i className="fas fa-bell me-2"></i>
                      Tất cả thông báo
                    </h6>
                    {notifications.filter(n => !n.is_read).length > 0 && (
                      <button 
                        className="btn btn-sm btn-outline-primary"
                        onClick={markAllNotificationsAsRead}
                      >
                        <i className="fas fa-check-double me-1"></i>
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>
                  <div className="card-body p-0">
                    {notifications.length > 0 ? (
                      <div className="list-group list-group-flush">
                        {notifications.map(notification => {
                          const { icon, color } = getNotificationIcon(notification.type);
                          return (
                            <div 
                              key={notification.id}
                              className={`list-group-item ${!notification.is_read ? 'bg-light' : ''}`}
                            >
                              <div className="d-flex">
                                <div className="me-3">
                                  <div 
                                    className="rounded-circle bg-light d-flex align-items-center justify-content-center"
                                    style={{ width: '45px', height: '45px' }}
                                  >
                                    <i className={`${icon} ${color}`}></i>
                                  </div>
                                </div>
                                <div className="flex-grow-1">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                      <h6 className="mb-1">
                                        {notification.title}
                                        {!notification.is_read && (
                                          <span className="badge bg-primary ms-2">Mới</span>
                                        )}
                                      </h6>
                                      <p className="mb-2" style={{ whiteSpace: 'pre-wrap' }}>
                                        {notification.message}
                                      </p>
                                      <small className="text-muted">
                                        <i className="fas fa-clock me-1"></i>
                                        {formatDate(notification.created_at)}
                                      </small>
                                    </div>
                                    {!notification.is_read && (
                                      <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => markNotificationAsRead(notification.id)}
                                        title="Đánh dấu đã đọc"
                                      >
                                        <i className="fas fa-check"></i>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <i className="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                        <h5>Chưa có thông báo nào</h5>
                        <p className="text-muted">Bạn chưa nhận được thông báo nào.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bookmarks Tab - Only for own profile */}
          {activeTab === 'bookmarks' && currentUser && currentUser.id === parseInt(id) && (
            <div className="row">
              {bookmarks.length > 0 ? (
                bookmarks.map(bookmark => (
                  <div key={bookmark.bookmark_id} className="col-12 mb-3">
                    <div className="post-card">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div className="d-flex align-items-center">
                          <Link to={`/profile/${bookmark.user_id}`}>
                            {bookmark.avatar ? (
                              <img src={bookmark.avatar} alt="Avatar" className="avatar me-3" />
                            ) : (
                              <div className="avatar me-3 bg-primary d-flex align-items-center justify-content-center text-white">
                                {bookmark.full_name?.charAt(0).toUpperCase()}
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
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="text-muted small">
                          <span className="me-3">
                            <i className="fas fa-eye me-1"></i>
                            {bookmark.views} lượt xem
                          </span>
                          <span className="me-3">
                            <i className="fas fa-bookmark me-1 text-warning"></i>
                            Đã lưu {formatDate(bookmark.bookmarked_at)}
                          </span>
                        </div>
                        <Link to={`/posts/${bookmark.id}`} className="btn btn-outline-primary btn-sm">
                          Xem bài viết
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="far fa-bookmark fa-3x text-muted mb-3"></i>
                    <h5>Chưa có bài viết nào được lưu</h5>
                    <p className="text-muted">Nhấn vào nút "Lưu" trên các bài viết để lưu lại đọc sau</p>
                  </div>
                </div>
              )}
              
              {bookmarks.length > 0 && (
                <div className="col-12">
                  <Pagination
                    currentPage={pagination.bookmarks.page}
                    totalPages={pagination.bookmarks.pages}
                    onPageChange={(page) => handlePageChange('bookmarks', page)}
                    totalItems={pagination.bookmarks.total}
                  />
                </div>
              )}
            </div>
          )}

          {/* Following Tab - Only for own profile */}
          {activeTab === 'following' && currentUser && currentUser.id === parseInt(id) && (
            <div className="row">
              {followingList.length > 0 ? (
                followingList.map(followedUser => (
                  <div key={followedUser.follow_id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <Link to={`/profile/${followedUser.id}`}>
                            {followedUser.avatar ? (
                              <img src={followedUser.avatar} alt="Avatar" className="avatar me-3" />
                            ) : (
                              <div className="avatar me-3 bg-primary d-flex align-items-center justify-content-center text-white">
                                {followedUser.full_name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div className="flex-grow-1">
                            <Link to={`/profile/${followedUser.id}`} className="text-decoration-none">
                              <h6 className="mb-0 text-dark">{followedUser.full_name}</h6>
                            </Link>
                            <small className="text-muted">@{followedUser.username}</small>
                            <div className="text-muted small mt-1">
                              <i className="fas fa-file-alt me-1"></i>
                              {followedUser.post_count} bài viết
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link to={`/profile/${followedUser.id}`} className="btn btn-outline-primary btn-sm w-100">
                            Xem hồ sơ
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="fas fa-user-friends fa-3x text-muted mb-3"></i>
                    <h5>Chưa theo dõi ai</h5>
                    <p className="text-muted">Theo dõi người dùng khác để nhận thông báo khi họ đăng bài mới</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Followers Tab - Only for own profile */}
          {activeTab === 'followers' && currentUser && currentUser.id === parseInt(id) && (
            <div className="row">
              {followersList.length > 0 ? (
                followersList.map(follower => (
                  <div key={follower.follow_id} className="col-md-6 col-lg-4 mb-3">
                    <div className="card h-100">
                      <div className="card-body">
                        <div className="d-flex align-items-center">
                          <Link to={`/profile/${follower.id}`}>
                            {follower.avatar ? (
                              <img src={follower.avatar} alt="Avatar" className="avatar me-3" />
                            ) : (
                              <div className="avatar me-3 bg-secondary d-flex align-items-center justify-content-center text-white">
                                {follower.full_name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </Link>
                          <div className="flex-grow-1">
                            <Link to={`/profile/${follower.id}`} className="text-decoration-none">
                              <h6 className="mb-0 text-dark">{follower.full_name}</h6>
                            </Link>
                            <small className="text-muted">@{follower.username}</small>
                            <div className="text-muted small mt-1">
                              <i className="fas fa-file-alt me-1"></i>
                              {follower.post_count} bài viết
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Link to={`/profile/${follower.id}`} className="btn btn-outline-primary btn-sm w-100">
                            Xem hồ sơ
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="fas fa-users fa-3x text-muted mb-3"></i>
                    <h5>Chưa có người theo dõi</h5>
                    <p className="text-muted">Đăng bài viết chất lượng để thu hút người theo dõi</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;