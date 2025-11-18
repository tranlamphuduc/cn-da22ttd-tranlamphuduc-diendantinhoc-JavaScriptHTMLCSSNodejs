import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ReportButton from '../../components/Reports/ReportButton';
import Pagination from '../../components/Pagination/Pagination';
import axios from 'axios';

const Profile = () => {
  const { id } = useParams();
  const { currentUser, updateUser } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    full_name: '',
    avatar: null
  });
  const [editLoading, setEditLoading] = useState(false);
  const [pagination, setPagination] = useState({
    posts: { page: 1, limit: 10, total: 0, pages: 0 },
    documents: { page: 1, limit: 12, total: 0, pages: 0 }
  });

  useEffect(() => {
    fetchUserData();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, pagination.posts.page, pagination.documents.page]);

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
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
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
            <div className="col-md-3">
              <div className="stat-card text-center">
                <div className="stat-icon text-primary mb-2">
                  <i className="fas fa-file-alt"></i>
                </div>
                <div className="stat-number text-primary">{user.post_count}</div>
                <div className="stat-label">Bài viết</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card text-center">
                <div className="stat-icon text-success mb-2">
                  <i className="fas fa-comments"></i>
                </div>
                <div className="stat-number text-success">{user.comment_count}</div>
                <div className="stat-label">Bình luận</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card text-center">
                <div className="stat-icon text-info mb-2">
                  <i className="fas fa-file-download"></i>
                </div>
                <div className="stat-number text-info">{user.document_count}</div>
                <div className="stat-label">Tài liệu</div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="stat-card text-center">
                <div className="stat-icon text-warning mb-2">
                  <i className="fas fa-trophy"></i>
                </div>
                <div className="stat-number text-warning">
                  {user.post_count + user.comment_count + user.document_count}
                </div>
                <div className="stat-label">Điểm hoạt động</div>
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
                Tài liệu ({pagination.documents.total})
              </button>
            </li>
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
        </div>
      </div>
    </div>
  );
};

export default Profile;