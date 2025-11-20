import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Pagination from '../../components/Pagination/Pagination';
import DeleteConfirmModal from '../../components/Admin/DeleteConfirmModal';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [comments, setComments] = useState([]);
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

  // States for delete modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    type: '',
    item: null,
    loading: false
  });

  // States for report processing modal
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    report: null,
    loading: false
  });

  const [reportForm, setReportForm] = useState({
    status: '',
    admin_note: '',
    is_false_report: false
  });

  // States for search functionality
  const [searchTerms, setSearchTerms] = useState({
    users: '',
    posts: '',
    documents: '',
    comments: '',
    reports: ''
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
    } else if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab, reportFilters, pagination.documents.page, pagination.comments.page]);

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

  const fetchComments = async () => {
    try {
      const response = await axios.get(`/api/admin/comments?page=${pagination.comments.page}&limit=${pagination.comments.limit}`);
      setComments(response.data.comments);
      setPagination(prev => ({
        ...prev,
        comments: {
          ...prev.comments,
          total: response.data.pagination.total,
          pages: response.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
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

  // Mở modal xóa bài viết
  const openDeletePostModal = (post) => {
    setDeleteModal({
      isOpen: true,
      type: 'post',
      item: post,
      loading: false
    });
  };

  // Mở modal xóa tài liệu
  const openDeleteDocumentModal = (document) => {
    setDeleteModal({
      isOpen: true,
      type: 'document',
      item: document,
      loading: false
    });
  };

  // Mở modal xóa bình luận
  const openDeleteCommentModal = (comment) => {
    setDeleteModal({
      isOpen: true,
      type: 'comment',
      item: comment,
      loading: false
    });
  };

  // Mở modal xử lý báo cáo
  const openReportModal = (report) => {
    setReportModal({
      isOpen: true,
      report: report,
      loading: false
    });
    setReportForm({
      status: report.status,
      admin_note: report.admin_note || '',
      is_false_report: report.is_false_report || false
    });
  };

  // Đóng modal xử lý báo cáo
  const closeReportModal = () => {
    setReportModal({
      isOpen: false,
      report: null,
      loading: false
    });
    setReportForm({
      status: '',
      admin_note: '',
      is_false_report: false
    });
  };

  // Xử lý báo cáo
  const handleReportSubmit = async (e) => {
    e.preventDefault();
    setReportModal(prev => ({ ...prev, loading: true }));

    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/reports/${reportModal.report.id}/status`, {
        status: reportForm.status,
        admin_note: reportForm.admin_note,
        is_false_report: reportForm.is_false_report
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Cập nhật danh sách báo cáo
      setReports(reports.map(report => 
        report.id === reportModal.report.id 
          ? { 
              ...report, 
              status: reportForm.status, 
              admin_note: reportForm.admin_note, 
              is_false_report: reportForm.is_false_report,
              reviewed_at: new Date().toISOString()
            }
          : report
      ));

      alert('Đã cập nhật trạng thái báo cáo thành công');
      closeReportModal();
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Có lỗi xảy ra khi cập nhật báo cáo');
    } finally {
      setReportModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Category management functions
  const openCategoryModal = (category = null) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category ? category.name : '',
      description: category ? category.description : '',
      color: category ? category.color : '#007bff'
    });
    setShowCategoryModal(true);
  };

  const closeCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryForm({ name: '', description: '', color: '#007bff' });
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      if (editingCategory) {
        // Update category
        await axios.put(`/api/admin/categories/${editingCategory.id}`, categoryForm, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Đã cập nhật danh mục thành công');
      } else {
        // Create new category
        await axios.post('/api/admin/categories', categoryForm, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Đã tạo danh mục mới thành công');
      }

      fetchCategories();
      closeCategoryModal();
    } catch (error) {
      console.error('Error saving category:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi lưu danh mục');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${categoryName}"?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/admin/categories/${categoryId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        alert('Đã xóa danh mục thành công');
        fetchCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert(error.response?.data?.message || 'Có lỗi xảy ra khi xóa danh mục');
      }
    }
  };

  // Search functionality
  const handleSearchChange = (tabType, value) => {
    setSearchTerms(prev => ({ ...prev, [tabType]: value }));
  };

  // Filter data based on search terms
  const getFilteredData = (data, tabType) => {
    const searchTerm = searchTerms[tabType].toLowerCase();
    if (!searchTerm) return data;

    return data.filter(item => {
      switch (tabType) {
        case 'users':
          return item.full_name.toLowerCase().includes(searchTerm) ||
                 item.username.toLowerCase().includes(searchTerm) ||
                 item.email.toLowerCase().includes(searchTerm);
        case 'posts':
          return item.title.toLowerCase().includes(searchTerm) ||
                 item.full_name.toLowerCase().includes(searchTerm) ||
                 item.category_name.toLowerCase().includes(searchTerm);
        case 'documents':
          return item.title.toLowerCase().includes(searchTerm) ||
                 item.full_name.toLowerCase().includes(searchTerm) ||
                 item.category_name.toLowerCase().includes(searchTerm);
        case 'comments':
          return item.content.toLowerCase().includes(searchTerm) ||
                 item.full_name.toLowerCase().includes(searchTerm) ||
                 item.post_title.toLowerCase().includes(searchTerm);
        case 'reports':
          return item.reporter_name.toLowerCase().includes(searchTerm) ||
                 (item.reported_content_name && item.reported_content_name.toLowerCase().includes(searchTerm));
        default:
          return true;
      }
    });
  };

  // Get report target URL
  const getReportTargetUrl = (report) => {
    if (report.report_type === 'post' && report.reported_post_id) {
      return `/posts/${report.reported_post_id}`;
    } else if (report.report_type === 'user' && report.reported_user_id) {
      return `/profile/${report.reported_user_id}`;
    } else if (report.report_type === 'document' && report.reported_document_id) {
      return `/documents/${report.reported_document_id}`;
    }
    return null;
  };

  // Xử lý xóa với lý do
  const handleDeleteWithReason = async (reason) => {
    setDeleteModal(prev => ({ ...prev, loading: true }));

    try {
      const token = localStorage.getItem('token');
      const { type, item } = deleteModal;

      if (type === 'post') {
        await axios.delete(`/api/admin/posts/${item.id}`, {
          data: { reason },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setPosts(posts.filter(post => post.id !== item.id));
        alert('Đã xóa bài viết thành công và gửi thông báo cho tác giả');
      } else if (type === 'document') {
        await axios.delete(`/api/admin/documents/${item.id}`, {
          data: { reason },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setDocuments(documents.filter(doc => doc.id !== item.id));
        alert('Đã xóa tài liệu thành công và gửi thông báo cho tác giả');
      } else if (type === 'comment') {
        await axios.delete(`/api/admin/comments/${item.id}`, {
          data: { reason },
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setComments(comments.filter(comment => comment.id !== item.id));
        alert('Đã xóa bình luận thành công và gửi thông báo cho tác giả');
      }

      fetchDashboardData(); // Refresh stats
      setDeleteModal({ isOpen: false, type: '', item: null, loading: false });
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Có lỗi xảy ra khi xóa');
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Đóng modal xóa
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, type: '', item: null, loading: false });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
            className={`nav-link ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <i className="fas fa-comments me-2"></i>
            Bình luận
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
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Quản lý người dùng</h5>
            <div className="d-flex gap-2">
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm người dùng..."
                  value={searchTerms.users}
                  onChange={(e) => handleSearchChange('users', e.target.value)}
                />
              </div>
            </div>
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
                  {getFilteredData(users, 'users').map(user => (
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
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Quản lý bài viết</h5>
            <div className="d-flex gap-2">
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm bài viết..."
                  value={searchTerms.posts}
                  onChange={(e) => handleSearchChange('posts', e.target.value)}
                />
              </div>
            </div>
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
                  {getFilteredData(posts, 'posts').map(post => (
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
                            onClick={() => openDeletePostModal(post)}
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
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Quản lý tài liệu</h5>
            <div className="d-flex gap-2">
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm tài liệu..."
                  value={searchTerms.documents}
                  onChange={(e) => handleSearchChange('documents', e.target.value)}
                />
              </div>
            </div>
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
                  {getFilteredData(documents, 'documents').map(document => (
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
                            onClick={() => openDeleteDocumentModal(document)}
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
              onClick={() => openCategoryModal()}
            >
              <i className="fas fa-plus me-2"></i>
              Thêm danh mục
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
                    <th>Số bài viết</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(category => (
                    <tr key={category.id}>
                      <td>
                        <span
                          className="category-badge text-white"
                          style={{ backgroundColor: category.color || '#007bff' }}
                        >
                          {category.name}
                        </span>
                      </td>
                      <td>{category.description}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div
                            className="color-preview me-2"
                            style={{
                              width: '20px',
                              height: '20px',
                              backgroundColor: category.color,
                              borderRadius: '4px',
                              border: '1px solid #ddd'
                            }}
                          ></div>
                          {category.color}
                        </div>
                      </td>
                      <td>{category.post_count || 0}</td>
                      <td>{new Date(category.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openCategoryModal(category)}
                            title="Chỉnh sửa danh mục"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
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
          </div>
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Quản lý bình luận</h5>
            <div className="d-flex gap-2">
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm bình luận..."
                  value={searchTerms.comments}
                  onChange={(e) => handleSearchChange('comments', e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Nội dung</th>
                    <th>Tác giả</th>
                    <th>Bài viết</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(comments, 'comments').map(comment => (
                    <tr key={comment.id}>
                      <td>
                        <div className="comment-content">
                          {comment.content.length > 100 
                            ? comment.content.substring(0, 100) + '...'
                            : comment.content
                          }
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-3 bg-secondary d-flex align-items-center justify-content-center text-white">
                            {comment.full_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold">{comment.full_name}</div>
                            <small className="text-muted">@{comment.username}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <a href={`/posts/${comment.post_id}`} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                          {comment.post_title?.length > 50 
                            ? comment.post_title.substring(0, 50) + '...'
                            : comment.post_title
                          }
                        </a>
                      </td>
                      <td>{new Date(comment.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <a
                            href={`/posts/${comment.post_id}#comment-${comment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-outline-primary"
                            title="Xem bình luận"
                          >
                            <i className="fas fa-eye"></i>
                          </a>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => openDeleteCommentModal(comment)}
                            title="Xóa bình luận"
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

            {/* Pagination for Comments */}
            <Pagination
              currentPage={pagination.comments.page}
              totalPages={pagination.comments.pages}
              onPageChange={(page) => handlePageChange('comments', page)}
              totalItems={pagination.comments.total}
            />
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="mb-0">Quản lý báo cáo</h5>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <div className="input-group" style={{ width: '300px' }}>
                <span className="input-group-text">
                  <i className="fas fa-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm kiếm báo cáo..."
                  value={searchTerms.reports}
                  onChange={(e) => handleSearchChange('reports', e.target.value)}
                />
              </div>
              <select
                className="form-select form-select-sm"
                value={reportFilters.status}
                onChange={(e) => setReportFilters(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="resolved">Đã xử lý</option>
                <option value="rejected">Từ chối</option>
              </select>
              <select
                className="form-select form-select-sm"
                value={reportFilters.report_type}
                onChange={(e) => setReportFilters(prev => ({ ...prev, report_type: e.target.value }))}
              >
                <option value="">Tất cả loại</option>
                <option value="spam">Spam</option>
                <option value="inappropriate">Không phù hợp</option>
                <option value="harassment">Quấy rối</option>
                <option value="copyright">Vi phạm bản quyền</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Loại báo cáo</th>
                    <th>Nội dung được báo cáo</th>
                    <th>Người báo cáo</th>
                    <th>Lý do</th>
                    <th>Trạng thái</th>
                    <th>Ngày báo cáo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {getFilteredData(reports, 'reports').map(report => (
                    <tr key={report.id}>
                      <td>
                        <span className={`badge ${
                          report.report_type === 'spam' ? 'bg-warning' :
                          report.report_type === 'inappropriate' ? 'bg-danger' :
                          report.report_type === 'harassment' ? 'bg-dark' :
                          report.report_type === 'copyright' ? 'bg-info' :
                          'bg-secondary'
                        }`}>
                          {report.report_type === 'spam' ? 'Spam' :
                           report.report_type === 'inappropriate' ? 'Không phù hợp' :
                           report.report_type === 'harassment' ? 'Quấy rối' :
                           report.report_type === 'copyright' ? 'Vi phạm bản quyền' :
                           'Khác'}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong>{report.reported_type === 'post' ? 'Bài viết' : 'Bình luận'}:</strong>
                          <div className="text-truncate" style={{ maxWidth: '200px' }}>
                            {report.reported_content?.substring(0, 100)}...
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="avatar avatar-sm me-3 bg-warning d-flex align-items-center justify-content-center text-white">
                            {report.reporter_name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-bold">{report.reporter_name}</div>
                            <small className="text-muted">@{report.reporter_username}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '150px' }}>
                          {report.reason}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          report.status === 'pending' ? 'bg-warning' :
                          report.status === 'resolved' ? 'bg-success' :
                          'bg-secondary'
                        }`}>
                          {report.status === 'pending' ? 'Chờ xử lý' :
                           report.status === 'resolved' ? 'Đã xử lý' :
                           'Từ chối'}
                        </span>
                      </td>
                      <td>{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                      <td>
                        <div className="d-flex gap-1">
                          {getReportTargetUrl(report) && (
                            <a
                              href={getReportTargetUrl(report)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-outline-info"
                              title="Xem nội dung bị báo cáo"
                            >
                              <i className="fas fa-external-link-alt"></i>
                            </a>
                          )}
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => openReportModal(report)}
                            title="Xử lý báo cáo"
                          >
                            <i className="fas fa-cog"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report Processing Modal */}
      {reportModal.isOpen && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-flag me-2"></i>
                  Xử lý báo cáo #{reportModal.report?.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeReportModal}
                  disabled={reportModal.loading}
                ></button>
              </div>
              <form onSubmit={handleReportSubmit}>
                <div className="modal-body">
                  {/* Thông tin báo cáo */}
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h6>Thông tin báo cáo</h6>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td><strong>Loại:</strong></td>
                            <td>
                              <span className="badge bg-secondary">
                                {reportModal.report?.report_type === 'user' ? 'Người dùng' : 
                                 reportModal.report?.report_type === 'post' ? 'Bài viết' : 'Tài liệu'}
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td><strong>Người báo cáo:</strong></td>
                            <td>{reportModal.report?.reporter_name}</td>
                          </tr>
                          <tr>
                            <td><strong>Ngày báo cáo:</strong></td>
                            <td>{new Date(reportModal.report?.created_at).toLocaleDateString('vi-VN')}</td>
                          </tr>
                          <tr>
                            <td><strong>Lý do:</strong></td>
                            <td>
                              <span className={`badge ${
                                reportModal.report?.reason === 'spam' ? 'bg-warning' :
                                reportModal.report?.reason === 'inappropriate' ? 'bg-danger' :
                                reportModal.report?.reason === 'harassment' ? 'bg-dark' :
                                reportModal.report?.reason === 'copyright' ? 'bg-info' :
                                'bg-secondary'
                              }`}>
                                {reportModal.report?.reason === 'spam' ? 'Spam' :
                                 reportModal.report?.reason === 'inappropriate' ? 'Không phù hợp' :
                                 reportModal.report?.reason === 'harassment' ? 'Quấy rối' :
                                 reportModal.report?.reason === 'fake_info' ? 'Thông tin sai lệch' :
                                 reportModal.report?.reason === 'copyright' ? 'Vi phạm bản quyền' :
                                 'Khác'}
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <h6>Nội dung bị báo cáo</h6>
                      <div className="border p-3 rounded bg-light">
                        <div className="text-truncate" style={{ maxWidth: '100%' }}>
                          <strong>
                            {reportModal.report?.reported_content_name || 'Đã bị xóa'}
                          </strong>
                        </div>
                        {reportModal.report?.description && (
                          <div className="mt-2">
                            <small className="text-muted">Mô tả:</small>
                            <p className="mb-0">{reportModal.report.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form xử lý */}
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">
                          <strong>Trạng thái xử lý</strong>
                        </label>
                        <select
                          className="form-select"
                          value={reportForm.status}
                          onChange={(e) => setReportForm(prev => ({ ...prev, status: e.target.value }))}
                          required
                        >
                          <option value="">Chọn trạng thái</option>
                          <option value="pending">Chờ xử lý</option>
                          <option value="reviewed">Đã xem xét</option>
                          <option value="resolved">Đã giải quyết</option>
                          <option value="dismissed">Đã bỏ qua</option>
                        </select>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="isFalseReport"
                            checked={reportForm.is_false_report}
                            onChange={(e) => setReportForm(prev => ({ ...prev, is_false_report: e.target.checked }))}
                          />
                          <label className="form-check-label" htmlFor="isFalseReport">
                            <strong className="text-danger">Đánh dấu là báo cáo sai</strong>
                          </label>
                          <div className="form-text">
                            Nếu chọn, người báo cáo sẽ nhận cảnh báo và có thể bị cấm báo cáo
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Ghi chú của quản trị viên</strong>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={reportForm.admin_note}
                      onChange={(e) => setReportForm(prev => ({ ...prev, admin_note: e.target.value }))}
                      placeholder="Nhập ghi chú về quyết định xử lý (tùy chọn)"
                      maxLength="500"
                    />
                    <div className="form-text">
                      {reportForm.admin_note.length}/500 ký tự
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeReportModal}
                    disabled={reportModal.loading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={reportModal.loading || !reportForm.status}
                  >
                    {reportModal.loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang xử lý...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Lưu quyết định
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      {showCategoryModal && (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-tags me-2"></i>
                  {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeCategoryModal}
                  disabled={actionLoading}
                ></button>
              </div>
              <form onSubmit={handleCategorySubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Tên danh mục</strong>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nhập tên danh mục"
                      required
                      maxLength="100"
                    />
                    <div className="form-text">
                      {categoryForm.name.length}/100 ký tự
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Mô tả</strong>
                    </label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Nhập mô tả danh mục (tùy chọn)"
                      maxLength="500"
                    />
                    <div className="form-text">
                      {categoryForm.description.length}/500 ký tự
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">
                      <strong>Màu sắc</strong>
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="color"
                        className="form-control form-control-color"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        style={{ width: '60px', height: '40px' }}
                      />
                      <input
                        type="text"
                        className="form-control"
                        value={categoryForm.color}
                        onChange={(e) => setCategoryForm(prev => ({ ...prev, color: e.target.value }))}
                        placeholder="#007bff"
                        pattern="^#[0-9A-Fa-f]{6}$"
                      />
                      <div
                        className="category-preview"
                        style={{
                          backgroundColor: categoryForm.color,
                          color: 'white',
                          padding: '8px 12px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          minWidth: '100px',
                          textAlign: 'center'
                        }}
                      >
                        {categoryForm.name || 'Preview'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCategoryModal}
                    disabled={actionLoading}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading || !categoryForm.name.trim()}
                  >
                    {actionLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {editingCategory ? 'Cập nhật' : 'Tạo mới'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteWithReason}
        title={
          deleteModal.type === 'post' ? 'Xóa bài viết' :
          deleteModal.type === 'document' ? 'Xóa tài liệu' :
          'Xóa bình luận'
        }
        itemName={
          deleteModal.type === 'comment' 
            ? (deleteModal.item?.content?.substring(0, 50) + '...' || '')
            : (deleteModal.item?.title || '')
        }
        itemType={
          deleteModal.type === 'post' ? 'bài viết' :
          deleteModal.type === 'document' ? 'tài liệu' :
          'bình luận'
        }
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default Dashboard;