import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../../components/Pagination/Pagination';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportFilters, setReportFilters] = useState({ status: '', report_type: '' });
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: '#007bff' });
  const [pagination, setPagination] = useState({
    users: { page: 1, limit: 10, total: 0, pages: 0 },
    posts: { page: 1, limit: 10, total: 0, pages: 0 },
    documents: { page: 1, limit: 10, total: 0, pages: 0 },
    comments: { page: 1, limit: 10, total: 0, pages: 0 }
  });

  useEffect(() => {
    fetchDashboardData();
  }, [pagination.users.page, pagination.posts.page]);

  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'categories') {
      fetchCategories();
    }
  }, [activeTab, reportFilters, pagination.documents.page]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes, postsRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get(`/api/admin/users?page=${pagination.users.page}&limit=${pagination.users.limit}`),
        axios.get(`/api/admin/posts?page=${pagination.posts.page}&limit=${pagination.posts.limit}`)
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setPosts(postsRes.data.posts);

      // Update pagination info
      setPagination(prev => ({
        ...prev,
        users: {
          ...prev.users,
          total: usersRes.data.pagination.total,
          pages: usersRes.data.pagination.pages
        },
        posts: {
          ...prev.posts,
          total: postsRes.data.pagination.total,
          pages: postsRes.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();

      if (reportFilters.status) queryParams.append('status', reportFilters.status);
      if (reportFilters.report_type) queryParams.append('report_type', reportFilters.report_type);
      queryParams.append('limit', '20');

      const response = await axios.get(`/api/reports?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setReports(response.data.reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/api/admin/documents?page=${pagination.documents.page}&limit=${pagination.documents.limit}`);
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

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingCategory) {
        // Cập nhật danh mục
        await axios.put(`/api/admin/categories/${editingCategory.id}`, categoryForm);
        alert('Cập nhật danh mục thành công!');
      } else {
        // Tạo danh mục mới
        await axios.post('/api/admin/categories', categoryForm);
        alert('Tạo danh mục thành công!');
      }

      fetchCategories();
      setShowCategoryModal(false);
      setCategoryForm({ name: '', description: '', color: '#007bff' });
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Có lỗi xảy ra khi lưu danh mục');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#007bff'
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"? Tất cả bài viết và tài liệu trong danh mục này sẽ bị ảnh hưởng.`)) {
      try {
        await axios.delete(`/api/admin/categories/${categoryId}`);
        setCategories(categories.filter(cat => cat.id !== categoryId));
        alert('Đã xóa danh mục thành công');
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Có lỗi xảy ra khi xóa danh mục');
      }
    }
  };

  const openCreateCategoryModal = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', color: '#007bff' });
    setShowCategoryModal(true);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.patch(`/api/admin/users/${userId}/toggle-status`);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_active: !currentStatus } : user
      ));
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const deletePost = async (postId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await axios.delete(`/api/admin/posts/${postId}`);
        setPosts(posts.filter(post => post.id !== postId));
        fetchDashboardData(); // Refresh stats
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
    }
  };

  const deleteDocument = async (documentId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tài liệu này?')) {
      try {
        await axios.delete(`/api/admin/documents/${documentId}`);
        setDocuments(documents.filter(doc => doc.id !== documentId));
        fetchDashboardData(); // Refresh stats
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Có lỗi xảy ra khi xóa tài liệu');
      }
    }
  };

  const handleReportStatusChange = async (reportId, newStatus, adminNote = '') => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/reports/${reportId}/status`, {
        status: newStatus,
        admin_note: adminNote
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      fetchReports();
      fetchDashboardData(); // Refresh stats
      setSelectedReport(null);
      alert('Cập nhật trạng thái báo cáo thành công!');
    } catch (error) {
      console.error('Error updating report status:', error);
      alert('Có lỗi xảy ra khi cập nhật báo cáo');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusLabels = {
    pending: 'Chờ xử lý',
    reviewed: 'Đã xem xét',
    resolved: 'Đã giải quyết',
    dismissed: 'Đã bỏ qua'
  };

  const reasonLabels = {
    spam: 'Spam',
    inappropriate: 'Nội dung không phù hợp',
    harassment: 'Quấy rối',
    fake_info: 'Thông tin sai lệch',
    copyright: 'Vi phạm bản quyền',
    other: 'Khác'
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning';
      case 'reviewed': return 'bg-info';
      case 'resolved': return 'bg-success';
      case 'dismissed': return 'bg-secondary';
      default: return 'bg-secondary';
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

  return (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <h4 className="mb-0">
                <i className="fas fa-tachometer-alt me-2"></i>
                Bảng Điều Khiển Quản Trị
              </h4>
              <p className="mb-0 text-light">Quản lý diễn đàn và người dùng</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-bar me-2"></i>
            Thống kê
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <i className="fas fa-users me-2"></i>
            Người dùng
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            <i className="fas fa-file-alt me-2"></i>
            Bài viết
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'documents' ? 'active' : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <i className="fas fa-file-download me-2"></i>
            Tài liệu
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            <i className="fas fa-tags me-2"></i>
            Danh mục
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="fas fa-flag me-2"></i>
            Báo cáo
            {stats?.pendingReports > 0 && (
              <span className="badge bg-danger ms-1">{stats.pendingReports}</span>
            )}
          </button>
        </li>
      </ul>
      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="row">
          <div className="col-md-3 mb-4">
            <div className="stat-card text-center">
              <div className="stat-icon text-primary mb-3">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-number text-primary">{stats?.totalUsers || 0}</div>
              <div className="stat-label">Tổng người dùng</div>
              <div className="stat-growth">+{stats?.userGrowth || 0} trong 7 ngày qua</div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="stat-card text-center">
              <div className="stat-icon text-warning mb-3">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="stat-number text-warning">{stats?.totalPosts || 0}</div>
              <div className="stat-label">Tổng bài viết</div>
              <div className="stat-growth">+{stats?.postGrowth || 0} trong 7 ngày qua</div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="stat-card text-center">
              <div className="stat-icon text-success mb-3">
                <i className="fas fa-comments"></i>
              </div>
              <div className="stat-number text-success">{stats?.totalComments || 0}</div>
              <div className="stat-label">Tổng bình luận</div>
              <div className="stat-growth">+{stats?.commentGrowth || 0} trong 7 ngày qua</div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="stat-card text-center">
              <div className="stat-icon text-info mb-3">
                <i className="fas fa-file-download"></i>
              </div>
              <div className="stat-number text-info">{stats?.totalDocuments || 0}</div>
              <div className="stat-label">Tổng tài liệu</div>
              <div className="stat-growth">+{stats?.documentGrowth || 0} trong 7 ngày qua</div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="stat-card text-center">
              <div className="stat-icon text-danger mb-3">
                <i className="fas fa-flag"></i>
              </div>
              <div className="stat-number text-danger">{stats?.totalReports || 0}</div>
              <div className="stat-label">Tổng báo cáo</div>
              <div className="stat-growth text-warning">
                {stats?.pendingReports || 0} chờ xử lý
              </div>
            </div>
          </div>

          <div className="col-md-3 mb-4">
            <div className="stat-card text-center">
              <div className="stat-icon text-secondary mb-3">
                <i className="fas fa-eye"></i>
              </div>
              <div className="stat-number text-secondary">{stats?.totalViews || 0}</div>
              <div className="stat-label">Tổng lượt xem</div>
              <div className="stat-growth">+{stats?.viewGrowth || 0} trong 7 ngày qua</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Quản lý người dùng</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Bài viết</th>
                    <th>Bình luận</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-3 bg-primary d-flex align-items-center justify-content-center text-white">
                            {user.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold">{user.full_name}</div>
                            <small className="text-muted">@{user.username}</small>
                          </div>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${user.role === 'admin' ? 'bg-danger' : 'bg-primary'}`}>
                          {user.role === 'admin' ? 'Quản trị viên' : 'Người dùng'}
                        </span>
                      </td>
                      <td>{user.post_count}</td>
                      <td>{user.comment_count}</td>
                      <td>
                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {user.is_active ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${user.is_active ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                        >
                          {user.is_active ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for Users */}
            <Pagination
              currentPage={pagination.users.page}
              totalPages={pagination.users.pages}
              onPageChange={(page) => handlePageChange('users', page)}
              totalItems={pagination.users.total}
            />
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Quản lý bài viết</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Tiêu đề</th>
                    <th>Tác giả</th>
                    <th>Danh mục</th>
                    <th>Lượt xem</th>
                    <th>Bình luận</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map(post => (
                    <tr key={post.id}>
                      <td>
                        <div className="fw-bold">
                          <a href={`/posts/${post.id}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                            {post.title}
                          </a>
                        </div>
                        <small className="text-muted">
                          {post.content.substring(0, 100)}...
                        </small>
                      </td>
                      <td>{post.full_name}</td>
                      <td>
                        <span
                          className="category-badge text-white"
                          style={{ backgroundColor: post.category_color || '#007bff' }}
                        >
                          {post.category_name}
                        </span>
                      </td>
                      <td>{post.views}</td>
                      <td>{post.comment_count}</td>
                      <td>{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <a
                            href={`/posts/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                            title="Xem bài viết"
                          >
                            <i className="fas fa-eye"></i>
                          </a>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deletePost(post.id)}
                            title="Xóa bài viết"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for Posts */}
            <Pagination
              currentPage={pagination.posts.page}
              totalPages={pagination.posts.pages}
              onPageChange={(page) => handlePageChange('posts', page)}
              totalItems={pagination.posts.total}
            />
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Quản lý tài liệu</h5>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Tài liệu</th>
                    <th>Tác giả</th>
                    <th>Danh mục</th>
                    <th>Kích thước</th>
                    <th>Lượt tải</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(document => (
                    <tr key={document.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-file-alt text-primary me-2"></i>
                          <div>
                            <div className="fw-bold">{document.title}</div>
                            <small className="text-muted">{document.file_name}</small>
                          </div>
                        </div>
                      </td>
                      <td>{document.full_name}</td>
                      <td>
                        <span
                          className="category-badge text-white"
                          style={{ backgroundColor: document.category_color || '#007bff' }}
                        >
                          {document.category_name}
                        </span>
                      </td>
                      <td>{formatFileSize(document.file_size)}</td>
                      <td>{document.downloads}</td>
                      <td>{new Date(document.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <a
                            href={`/uploads/${document.file_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-success"
                            title="Tải xuống"
                          >
                            <i className="fas fa-download"></i>
                          </a>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deleteDocument(document.id)}
                            title="Xóa tài liệu"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination for Documents */}
            <Pagination
              currentPage={pagination.documents.page}
              totalPages={pagination.documents.pages}
              onPageChange={(page) => handlePageChange('documents', page)}
              totalItems={pagination.documents.total}
            />
          </div>
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Quản lý danh mục</h5>
            <button
              className="btn btn-primary"
              onClick={openCreateCategoryModal}
            >
              <i className="fas fa-plus me-2"></i>
              Tạo danh mục mới
            </button>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Tên danh mục</th>
                    <th>Mô tả</th>
                    <th>Màu sắc</th>
                    <th>Bài viết</th>
                    <th>Tài liệu</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className="category-color-preview me-2"
                            style={{
                              backgroundColor: category.color || '#007bff',
                              width: '20px',
                              height: '20px',
                              borderRadius: '4px'
                            }}
                          ></div>
                          <div className="fw-bold">{category.name}</div>
                        </div>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {category.description || 'Không có mô tả'}
                        </div>
                      </td>
                      <td>
                        <span
                          className="category-badge text-white px-2 py-1 rounded"
                          style={{ backgroundColor: category.color || '#007bff' }}
                        >
                          {category.color || '#007bff'}
                        </span>
                      </td>
                      <td>{category.post_count || 0}</td>
                      <td>{category.document_count || 0}</td>
                      <td>{new Date(category.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleEditCategory(category)}
                            title="Chỉnh sửa danh mục"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            title="Xóa danh mục"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {categories.length === 0 && (
              <div className="text-center py-4">
                <i className="fas fa-tags fa-3x text-muted mb-3"></i>
                <h6>Chưa có danh mục nào</h6>
                <button
                  className="btn btn-primary mt-2"
                  onClick={openCreateCategoryModal}
                >
                  <i className="fas fa-plus me-2"></i>
                  Tạo danh mục đầu tiên
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Quản lý báo cáo</h5>
            <div className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={reportFilters.status}
                onChange={(e) => setReportFilters({ ...reportFilters, status: e.target.value })}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="reviewed">Đã xem xét</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="dismissed">Đã bỏ qua</option>
              </select>
              <select
                className="form-select form-select-sm"
                value={reportFilters.report_type}
                onChange={(e) => setReportFilters({ ...reportFilters, report_type: e.target.value })}
              >
                <option value="">Tất cả loại</option>
                <option value="user">Người dùng</option>
                <option value="post">Bài viết</option>
                <option value="document">Tài liệu</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Loại</th>
                    <th>Người báo cáo</th>
                    <th>Đối tượng</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>#{report.id}</td>
                      <td>
                        <span className={`badge ${report.report_type === 'user' ? 'bg-info' :
                          report.report_type === 'post' ? 'bg-warning' : 'bg-success'
                          }`}>
                          {report.report_type === 'user' ? 'Người dùng' :
                            report.report_type === 'post' ? 'Bài viết' : 'Tài liệu'}
                        </span>
                      </td>
                      <td>{report.reporter_name}</td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {report.report_type === 'user'
                            ? report.reported_user_name
                            : report.report_type === 'post'
                              ? report.post_title
                              : report.document_title
                          }
                        </div>
                      </td>
                      <td>{reasonLabels[report.reason]}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                          {statusLabels[report.status]}
                        </span>
                      </td>
                      <td>{formatDate(report.created_at)}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => setSelectedReport(report)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && (
              <div className="text-center py-4">
                <i className="fas fa-flag fa-3x text-muted mb-3"></i>
                <h6>Không có báo cáo nào</h6>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          onSubmit={handleCategorySubmit}
          onClose={() => setShowCategoryModal(false)}
          loading={actionLoading}
        />
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onStatusChange={handleReportStatusChange}
          loading={actionLoading}
          statusLabels={statusLabels}
          reasonLabels={reasonLabels}
        />
      )}
    </div>
  );
};

// Component Modal tạo/chỉnh sửa danh mục
const CategoryModal = ({ category, categoryForm, setCategoryForm, onSubmit, onClose, loading }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{category ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <form onSubmit={onSubmit}>
            <div className="form-group mb-3">
              <label className="form-label">Tên danh mục <span className="text-danger">*</span></label>
              <input
                type="text"
                name="name"
                value={categoryForm.name}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Nhập tên danh mục..."
                required
                maxLength="100"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Mô tả</label>
              <textarea
                name="description"
                value={categoryForm.description}
                onChange={handleInputChange}
                className="form-control"
                placeholder="Mô tả về danh mục..."
                rows="3"
                maxLength="500"
              />
            </div>

            <div className="form-group mb-3">
              <label className="form-label">Màu sắc</label>
              <div className="d-flex align-items-center gap-3">
                <input
                  type="color"
                  name="color"
                  value={categoryForm.color}
                  onChange={handleInputChange}
                  className="form-control form-control-color"
                  style={{ width: '60px', height: '40px' }}
                />
                <input
                  type="text"
                  name="color"
                  value={categoryForm.color}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="#007bff"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
                <div
                  className="color-preview"
                  style={{
                    backgroundColor: categoryForm.color,
                    width: '40px',
                    height: '40px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                ></div>
              </div>
              <small className="text-muted">Chọn màu sắc đại diện cho danh mục</small>
            </div>

            <div className="form-actions d-flex justify-content-end gap-2">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Hủy
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {category ? 'Đang cập nhật...' : 'Đang tạo...'}
                  </>
                ) : (
                  category ? 'Cập nhật' : 'Tạo danh mục'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Component Modal chi tiết báo cáo
const ReportDetailModal = ({ report, onClose, onStatusChange, loading, statusLabels, reasonLabels }) => {
  const [adminNote, setAdminNote] = useState(report.admin_note || '');
  const [selectedStatus, setSelectedStatus] = useState(report.status);

  const handleSubmit = (e) => {
    e.preventDefault();
    onStatusChange(report.id, selectedStatus, adminNote);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chi tiết báo cáo #{report.id}</h3>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div className="report-info">
            <div className="info-row">
              <strong>Loại báo cáo:</strong>
              {report.report_type === 'user' ? 'Người dùng' :
                report.report_type === 'post' ? 'Bài viết' : 'Tài liệu'}
            </div>
            <div className="info-row">
              <strong>Người báo cáo:</strong> {report.reporter_name}
            </div>
            <div className="info-row">
              <strong>Đối tượng:</strong>
              {report.report_type === 'user'
                ? report.reported_user_name
                : report.report_type === 'post'
                  ? report.post_title
                  : report.document_title
              }
            </div>
            <div className="info-row">
              <strong>Lý do:</strong> {reasonLabels[report.reason]}
            </div>
            <div className="info-row">
              <strong>Mô tả:</strong>
              <div className="description">
                {report.description || 'Không có mô tả'}
              </div>
            </div>
            <div className="info-row">
              <strong>Ngày tạo:</strong> {new Date(report.created_at).toLocaleString('vi-VN')}
            </div>
            {report.reviewed_at && (
              <div className="info-row">
                <strong>Đã xem xét:</strong> {new Date(report.reviewed_at).toLocaleString('vi-VN')}
                {report.reviewer_username && ` bởi ${report.reviewer_username}`}
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Trạng thái:</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="form-control"
              >
                <option value="pending">Chờ xử lý</option>
                <option value="reviewed">Đã xem xét</option>
                <option value="resolved">Đã giải quyết</option>
                <option value="dismissed">Đã bỏ qua</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ghi chú của admin:</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ghi chú về việc xử lý báo cáo..."
                rows="4"
                maxLength="500"
                className="form-control"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="btn btn-secondary">Hủy</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Đang cập nhật...' : 'Cập nhật'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;