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

  // States for user search (tìm kiếm theo người dùng)
  const [userSearchTerms, setUserSearchTerms] = useState({
    posts: '',
    documents: '',
    comments: ''
  });

  // States for penalty management modal
  const [penaltyModal, setPenaltyModal] = useState({
    isOpen: false,
    user: null,
    loading: false,
    details: null
  });

  // States for ban management modal
  const [banModal, setBanModal] = useState({
    isOpen: false,
    user: null,
    loading: false,
    bans: []
  });

  const [banForm, setBanForm] = useState({
    ban_type: 'comment',
    duration: '1_day',
    reason: ''
  });

  // States for notification sending
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    target_type: 'all',
    target_user_id: ''
  });
  const [allUsers, setAllUsers] = useState([]);
  const [sendingNotification, setSendingNotification] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [pagination.users.page]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    } else if (activeTab === 'reports') {
      fetchReports();
    } else if (activeTab === 'documents') {
      fetchDocuments();
    } else if (activeTab === 'notifications') {
      fetchAllUsers();
    } else if (activeTab === 'categories') {
      fetchCategories();
    } else if (activeTab === 'comments') {
      fetchComments();
    }
  }, [activeTab, reportFilters, pagination.posts.page, pagination.documents.page, pagination.comments.page]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get(`/api/admin/users?page=${pagination.users.page}&limit=${pagination.users.limit}`)
      ]);

      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);

      // Update pagination info
      setPagination(prev => ({
        ...prev,
        users: {
          ...prev.users,
          total: usersRes.data.pagination.total,
          pages: usersRes.data.pagination.pages
        }
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch posts với tìm kiếm
  const fetchPosts = async () => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.posts.page);
      queryParams.append('limit', pagination.posts.limit);
      if (searchTerms.posts) queryParams.append('search', searchTerms.posts);
      if (userSearchTerms.posts) queryParams.append('searchUser', userSearchTerms.posts);

      const response = await axios.get(`/api/admin/posts?${queryParams}`);
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
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.documents.page);
      queryParams.append('limit', pagination.documents.limit);
      if (searchTerms.documents) queryParams.append('search', searchTerms.documents);
      if (userSearchTerms.documents) queryParams.append('searchUser', userSearchTerms.documents);

      const response = await axios.get(`/api/admin/documents?${queryParams}`);
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
      const queryParams = new URLSearchParams();
      queryParams.append('page', pagination.comments.page);
      queryParams.append('limit', pagination.comments.limit);
      if (searchTerms.comments) queryParams.append('search', searchTerms.comments);
      if (userSearchTerms.comments) queryParams.append('searchUser', userSearchTerms.comments);

      const response = await axios.get(`/api/admin/comments?${queryParams}`);
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

      // Nếu đánh dấu báo cáo sai, reload danh sách users để cập nhật false_report_count
      if (reportForm.is_false_report) {
        await fetchDashboardData();
      }

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

  // User search functionality (tìm kiếm theo người dùng)
  const handleUserSearchChange = (tabType, value) => {
    setUserSearchTerms(prev => ({ ...prev, [tabType]: value }));
  };

  // Thực hiện tìm kiếm (gọi API)
  const handleSearch = (tabType) => {
    // Reset về trang 1 khi tìm kiếm
    setPagination(prev => ({
      ...prev,
      [tabType]: { ...prev[tabType], page: 1 }
    }));
    
    if (tabType === 'posts') {
      fetchPosts();
    } else if (tabType === 'documents') {
      fetchDocuments();
    } else if (tabType === 'comments') {
      fetchComments();
    }
  };

  // Xử lý Enter để tìm kiếm
  const handleSearchKeyPress = (e, tabType) => {
    if (e.key === 'Enter') {
      handleSearch(tabType);
    }
  };

  // Filter data based on search terms (chỉ dùng cho users và reports - client-side)
  const getFilteredData = (data, tabType) => {
    const searchTerm = searchTerms[tabType]?.toLowerCase() || '';
    if (!searchTerm) return data;

    return data.filter(item => {
      switch (tabType) {
        case 'users':
          return item.full_name.toLowerCase().includes(searchTerm) ||
                 item.username.toLowerCase().includes(searchTerm) ||
                 item.email.toLowerCase().includes(searchTerm);
        case 'reports':
          return item.reporter_name?.toLowerCase().includes(searchTerm) ||
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

  // Mở modal quản lý hình phạt
  const openPenaltyModal = async (user) => {
    setPenaltyModal({
      isOpen: true,
      user: user,
      loading: true,
      details: null
    });

    try {
      const response = await axios.get(`/api/admin/users/${user.id}/report-warnings`);
      setPenaltyModal(prev => ({
        ...prev,
        loading: false,
        details: response.data
      }));
    } catch (error) {
      console.error('Error fetching penalty details:', error);
      setPenaltyModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  // Đóng modal quản lý hình phạt
  const closePenaltyModal = () => {
    setPenaltyModal({
      isOpen: false,
      user: null,
      loading: false,
      details: null
    });
  };

  // Xử lý giảm hình phạt
  const handleReducePenalty = async (action) => {
    if (!penaltyModal.user) return;

    setPenaltyModal(prev => ({ ...prev, loading: true }));

    try {
      await axios.post(`/api/admin/users/${penaltyModal.user.id}/reduce-penalty`, { action });
      
      // Refresh user list
      fetchDashboardData();
      
      // Refresh penalty details
      const response = await axios.get(`/api/admin/users/${penaltyModal.user.id}/report-warnings`);
      setPenaltyModal(prev => ({
        ...prev,
        loading: false,
        details: response.data
      }));

      // Update user in local state
      setUsers(users.map(u => {
        if (u.id === penaltyModal.user.id) {
          if (action === 'reduce_warning') {
            return { ...u, false_report_count: Math.max(0, (u.false_report_count || 0) - 1) };
          } else if (action === 'unban') {
            return { ...u, is_banned_from_reporting: false, ban_until: null };
          } else if (action === 'reset_all') {
            return { ...u, false_report_count: 0, is_banned_from_reporting: false, ban_until: null };
          }
        }
        return u;
      }));

      alert('Đã cập nhật hình phạt thành công');
    } catch (error) {
      console.error('Error reducing penalty:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
      setPenaltyModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Mở modal quản lý cấm
  const openBanModal = async (user) => {
    setBanModal({
      isOpen: true,
      user: user,
      loading: true,
      bans: []
    });
    setBanForm({
      ban_type: 'comment',
      duration: '1_day',
      reason: ''
    });

    try {
      const response = await axios.get(`/api/admin/users/${user.id}/bans`);
      setBanModal(prev => ({
        ...prev,
        loading: false,
        bans: response.data.bans || []
      }));
    } catch (error) {
      console.error('Error fetching bans:', error);
      setBanModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Đóng modal quản lý cấm
  const closeBanModal = () => {
    setBanModal({
      isOpen: false,
      user: null,
      loading: false,
      bans: []
    });
  };

  // Xử lý cấm người dùng
  const handleBanUser = async (e) => {
    e.preventDefault();
    if (!banModal.user) return;

    setBanModal(prev => ({ ...prev, loading: true }));

    try {
      await axios.post(`/api/admin/users/${banModal.user.id}/ban`, banForm);
      
      // Refresh bans list
      const response = await axios.get(`/api/admin/users/${banModal.user.id}/bans`);
      setBanModal(prev => ({
        ...prev,
        loading: false,
        bans: response.data.bans || []
      }));

      // Refresh user list if account ban
      if (banForm.ban_type === 'account') {
        fetchDashboardData();
      }

      alert('Đã cấm người dùng thành công');
      setBanForm({ ban_type: 'comment', duration: '1_day', reason: '' });
    } catch (error) {
      console.error('Error banning user:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
      setBanModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Xử lý gỡ cấm người dùng
  const handleUnbanUser = async (banType) => {
    if (!banModal.user) return;

    setBanModal(prev => ({ ...prev, loading: true }));

    try {
      await axios.post(`/api/admin/users/${banModal.user.id}/unban`, { ban_type: banType });
      
      // Refresh bans list
      const response = await axios.get(`/api/admin/users/${banModal.user.id}/bans`);
      setBanModal(prev => ({
        ...prev,
        loading: false,
        bans: response.data.bans || []
      }));

      // Refresh user list if account unban
      if (banType === 'account') {
        fetchDashboardData();
      }

      alert('Đã gỡ cấm thành công');
    } catch (error) {
      console.error('Error unbanning user:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
      setBanModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Helper functions cho ban modal
  const getBanTypeName = (banType) => {
    const names = {
      'account': 'Tài khoản',
      'comment': 'Bình luận',
      'post': 'Đăng bài viết',
      'document': 'Đăng tài liệu',
      'report': 'Báo cáo'
    };
    return names[banType] || banType;
  };

  const getDurationName = (duration) => {
    const names = {
      '1_day': '1 ngày',
      '3_days': '3 ngày',
      '1_week': '1 tuần',
      '1_month': '1 tháng',
      'permanent': 'Vĩnh viễn'
    };
    return names[duration] || duration;
  };

  // Fetch all users for notification sending
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get('/api/notifications/admin/users');
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Send notification
  const handleSendNotification = async (e) => {
    e.preventDefault();
    
    if (!notificationForm.title.trim() || !notificationForm.message.trim()) {
      alert('Vui lòng nhập tiêu đề và nội dung thông báo');
      return;
    }

    if (notificationForm.target_type === 'individual' && !notificationForm.target_user_id) {
      alert('Vui lòng chọn người dùng để gửi thông báo');
      return;
    }

    setSendingNotification(true);

    try {
      const response = await axios.post('/api/notifications/admin/send', notificationForm);
      alert(response.data.message);
      setNotificationForm({
        title: '',
        message: '',
        target_type: 'all',
        target_user_id: ''
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra khi gửi thông báo');
    } finally {
      setSendingNotification(false);
    }
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
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <i className="fas fa-bullhorn me-2"></i>
            Gửi thông báo
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
                    <th>Báo cáo sai</th>
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
                        <div className="d-flex align-items-center gap-1">
                          <span className={`badge ${Number(user.false_report_count) > 0 ? (Number(user.false_report_count) >= 3 ? 'bg-danger' : 'bg-warning') : 'bg-success'}`}>
                            {Number(user.false_report_count) || 0} lần
                          </span>
                          {user.is_banned_from_reporting ? (
                            <span className="badge bg-dark" title={user.ban_until ? `Đến ${new Date(user.ban_until).toLocaleDateString('vi-VN')}` : 'Vĩnh viễn'}>
                              <i className="fas fa-ban"></i>
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${user.is_active ? 'bg-success' : 'bg-secondary'}`}>
                          {user.is_active ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => openBanModal(user)}
                            title="Quản lý cấm"
                            disabled={user.role === 'admin'}
                          >
                            <i className="fas fa-ban"></i>
                          </button>
                          {(Number(user.false_report_count) > 0 || user.is_banned_from_reporting) ? (
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => openPenaltyModal(user)}
                              title="Quản lý hình phạt báo cáo sai"
                            >
                              <i className="fas fa-gavel"></i>
                            </button>
                          ) : null}
                        </div>
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
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Quản lý bài viết</h5>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <div className="input-group" style={{ width: '250px' }}>
                <span className="input-group-text">
                  <i className="fas fa-file-alt"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo tiêu đề..."
                  value={searchTerms.posts}
                  onChange={(e) => handleSearchChange('posts', e.target.value)}
                  onKeyPress={(e) => handleSearchKeyPress(e, 'posts')}
                />
              </div>
              <div className="input-group" style={{ width: '250px' }}>
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo người dùng..."
                  value={userSearchTerms.posts}
                  onChange={(e) => handleUserSearchChange('posts', e.target.value)}
                  onKeyPress={(e) => handleSearchKeyPress(e, 'posts')}
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleSearch('posts')}
              >
                <i className="fas fa-search me-1"></i>
                Tìm kiếm
              </button>
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
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Quản lý tài liệu</h5>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <div className="input-group" style={{ width: '250px' }}>
                <span className="input-group-text">
                  <i className="fas fa-file-alt"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo tiêu đề..."
                  value={searchTerms.documents}
                  onChange={(e) => handleSearchChange('documents', e.target.value)}
                  onKeyPress={(e) => handleSearchKeyPress(e, 'documents')}
                />
              </div>
              <div className="input-group" style={{ width: '250px' }}>
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo người dùng..."
                  value={userSearchTerms.documents}
                  onChange={(e) => handleUserSearchChange('documents', e.target.value)}
                  onKeyPress={(e) => handleSearchKeyPress(e, 'documents')}
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleSearch('documents')}
              >
                <i className="fas fa-search me-1"></i>
                Tìm kiếm
              </button>
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
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h5 className="mb-0">Quản lý bình luận</h5>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <div className="input-group" style={{ width: '250px' }}>
                <span className="input-group-text">
                  <i className="fas fa-comment"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo nội dung/bài viết..."
                  value={searchTerms.comments}
                  onChange={(e) => handleSearchChange('comments', e.target.value)}
                  onKeyPress={(e) => handleSearchKeyPress(e, 'comments')}
                />
              </div>
              <div className="input-group" style={{ width: '250px' }}>
                <span className="input-group-text">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Tìm theo người dùng..."
                  value={userSearchTerms.comments}
                  onChange={(e) => handleUserSearchChange('comments', e.target.value)}
                  onKeyPress={(e) => handleSearchKeyPress(e, 'comments')}
                />
              </div>
              <button 
                className="btn btn-primary"
                onClick={() => handleSearch('comments')}
              >
                <i className="fas fa-search me-1"></i>
                Tìm kiếm
              </button>
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
                  {comments.map(comment => (
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
                <option value="reviewed">Đang xem xét</option>
                <option value="resolved">Đã xử lý</option>
                <option value="dismissed">Từ chối</option>
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
                          report.status === 'reviewed' ? 'bg-info' :
                          report.status === 'resolved' ? 'bg-success' :
                          report.status === 'dismissed' ? 'bg-secondary' :
                          'bg-secondary'
                        }`}>
                          {report.status === 'pending' ? 'Chờ xử lý' :
                           report.status === 'reviewed' ? 'Đang xem xét' :
                           report.status === 'resolved' ? 'Đã xử lý' :
                           report.status === 'dismissed' ? 'Từ chối' :
                           'Không xác định'}
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
                          <option value="reviewed">Đang xem xét</option>
                          <option value="resolved">Đã xử lý</option>
                          <option value="dismissed">Từ chối</option>
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

      {/* Notifications Tab - Send notifications */}
      {activeTab === 'notifications' && (
        <div className="row">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">
                  <i className="fas fa-bullhorn me-2"></i>
                  Gửi thông báo
                </h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleSendNotification}>
                  <div className="mb-3">
                    <label className="form-label">Đối tượng nhận</label>
                    <div className="d-flex gap-3">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="target_type"
                          id="target_all"
                          value="all"
                          checked={notificationForm.target_type === 'all'}
                          onChange={(e) => setNotificationForm(prev => ({ ...prev, target_type: e.target.value, target_user_id: '' }))}
                        />
                        <label className="form-check-label" htmlFor="target_all">
                          <i className="fas fa-users me-1"></i>
                          Tất cả người dùng
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="target_type"
                          id="target_individual"
                          value="individual"
                          checked={notificationForm.target_type === 'individual'}
                          onChange={(e) => setNotificationForm(prev => ({ ...prev, target_type: e.target.value }))}
                        />
                        <label className="form-check-label" htmlFor="target_individual">
                          <i className="fas fa-user me-1"></i>
                          Cá nhân
                        </label>
                      </div>
                    </div>
                  </div>

                  {notificationForm.target_type === 'individual' && (
                    <div className="mb-3">
                      <label className="form-label">Chọn người dùng</label>
                      <select
                        className="form-select"
                        value={notificationForm.target_user_id}
                        onChange={(e) => setNotificationForm(prev => ({ ...prev, target_user_id: e.target.value }))}
                        required
                      >
                        <option value="">-- Chọn người dùng --</option>
                        {allUsers.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.full_name} (@{user.username}) - {user.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Tiêu đề thông báo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Nhập tiêu đề thông báo..."
                      required
                      maxLength="255"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nội dung thông báo</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Nhập nội dung thông báo..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={sendingNotification}
                  >
                    {sendingNotification ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane me-2"></i>
                        Gửi thông báo
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-info-circle me-2"></i>
                  Hướng dẫn
                </h6>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <i className="fas fa-check text-success me-2"></i>
                    <strong>Tất cả người dùng:</strong> Gửi thông báo đến tất cả tài khoản đang hoạt động
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-check text-success me-2"></i>
                    <strong>Cá nhân:</strong> Gửi thông báo đến một người dùng cụ thể
                  </li>
                  <li className="mb-2">
                    <i className="fas fa-lightbulb text-warning me-2"></i>
                    Thông báo sẽ hiển thị trong chuông thông báo và trang hồ sơ của người dùng
                  </li>
                </ul>
              </div>
            </div>

            <div className="card mt-3">
              <div className="card-header">
                <h6 className="mb-0">
                  <i className="fas fa-chart-pie me-2"></i>
                  Thống kê
                </h6>
              </div>
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Tổng người dùng:</span>
                  <strong>{allUsers.length}</strong>
                </div>
              </div>
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

      {/* Penalty Management Modal */}
      {penaltyModal.isOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-gavel me-2"></i>
                  Quản lý hình phạt - {penaltyModal.user?.full_name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closePenaltyModal}
                  disabled={penaltyModal.loading}
                ></button>
              </div>
              <div className="modal-body">
                {penaltyModal.loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Thông tin tổng quan */}
                    <div className="row mb-4">
                      <div className="col-md-4">
                        <div className="card bg-warning text-dark">
                          <div className="card-body text-center">
                            <h3>{penaltyModal.details?.warning?.warning_count || 0}</h3>
                            <small>Số lần cảnh báo</small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className={`card ${penaltyModal.details?.warning?.is_banned_from_reporting ? 'bg-danger text-white' : 'bg-success text-white'}`}>
                          <div className="card-body text-center">
                            <h3>
                              {penaltyModal.details?.warning?.is_banned_from_reporting ? (
                                <i className="fas fa-ban"></i>
                              ) : (
                                <i className="fas fa-check"></i>
                              )}
                            </h3>
                            <small>
                              {penaltyModal.details?.warning?.is_banned_from_reporting 
                                ? 'Đang bị cấm báo cáo' 
                                : 'Được phép báo cáo'}
                            </small>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="card bg-info text-white">
                          <div className="card-body text-center">
                            <h3>{penaltyModal.details?.false_reports?.length || 0}</h3>
                            <small>Báo cáo sai</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Thời hạn cấm */}
                    {penaltyModal.details?.warning?.is_banned_from_reporting && (
                      <div className="alert alert-danger">
                        <i className="fas fa-clock me-2"></i>
                        <strong>Thời hạn cấm: </strong>
                        {penaltyModal.details?.warning?.ban_until 
                          ? `Đến ${new Date(penaltyModal.details.warning.ban_until).toLocaleString('vi-VN')}`
                          : 'Vĩnh viễn'}
                      </div>
                    )}

                    {/* Danh sách báo cáo sai */}
                    {penaltyModal.details?.false_reports?.length > 0 && (
                      <div className="mb-4">
                        <h6>
                          <i className="fas fa-list me-2"></i>
                          Lịch sử báo cáo sai
                        </h6>
                        <div className="table-responsive" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          <table className="table table-sm table-striped">
                            <thead>
                              <tr>
                                <th>Loại</th>
                                <th>Nội dung bị báo cáo</th>
                                <th>Lý do</th>
                                <th>Ngày</th>
                              </tr>
                            </thead>
                            <tbody>
                              {penaltyModal.details.false_reports.map(report => (
                                <tr key={report.id}>
                                  <td>
                                    <span className={`badge ${
                                      report.report_type === 'user' ? 'bg-primary' :
                                      report.report_type === 'post' ? 'bg-warning' : 'bg-info'
                                    }`}>
                                      {report.report_type === 'user' ? 'Người dùng' :
                                       report.report_type === 'post' ? 'Bài viết' : 'Tài liệu'}
                                    </span>
                                  </td>
                                  <td>{report.reported_content_name || 'N/A'}</td>
                                  <td>{report.reason}</td>
                                  <td>{new Date(report.created_at).toLocaleDateString('vi-VN')}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Các hành động */}
                    <div className="border-top pt-3">
                      <h6>
                        <i className="fas fa-tools me-2"></i>
                        Hành động giảm hình phạt
                      </h6>
                      <div className="d-flex gap-2 flex-wrap">
                        <button
                          className="btn btn-outline-warning"
                          onClick={() => handleReducePenalty('reduce_warning')}
                          disabled={penaltyModal.loading || !penaltyModal.details?.warning?.warning_count}
                        >
                          <i className="fas fa-minus me-2"></i>
                          Giảm 1 cảnh báo
                        </button>
                        
                        {penaltyModal.details?.warning?.is_banned_from_reporting && (
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleReducePenalty('unban')}
                            disabled={penaltyModal.loading}
                          >
                            <i className="fas fa-unlock me-2"></i>
                            Gỡ cấm báo cáo
                          </button>
                        )}
                        
                        <button
                          className="btn btn-outline-danger"
                          onClick={() => {
                            if (window.confirm('Bạn có chắc muốn xóa toàn bộ cảnh báo và hình phạt của người dùng này?')) {
                              handleReducePenalty('reset_all');
                            }
                          }}
                          disabled={penaltyModal.loading || (!penaltyModal.details?.warning?.warning_count && !penaltyModal.details?.warning?.is_banned_from_reporting)}
                        >
                          <i className="fas fa-redo me-2"></i>
                          Reset toàn bộ
                        </button>
                      </div>
                      <small className="text-muted mt-2 d-block">
                        <i className="fas fa-info-circle me-1"></i>
                        Người dùng sẽ nhận được thông báo khi bạn giảm hình phạt.
                      </small>
                    </div>
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closePenaltyModal}
                  disabled={penaltyModal.loading}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ban Management Modal */}
      {banModal.isOpen && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-ban me-2"></i>
                  Quản lý cấm - {banModal.user?.full_name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeBanModal}
                  disabled={banModal.loading}
                ></button>
              </div>
              <div className="modal-body">
                {banModal.loading && !banModal.bans.length ? (
                  <div className="text-center py-4">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Đang tải...</span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Form cấm mới */}
                    <div className="card mb-4">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="fas fa-plus me-2"></i>
                          Thêm lệnh cấm mới
                        </h6>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleBanUser}>
                          <div className="row">
                            <div className="col-md-4 mb-3">
                              <label className="form-label">Loại cấm</label>
                              <select
                                className="form-select"
                                value={banForm.ban_type}
                                onChange={(e) => setBanForm(prev => ({ ...prev, ban_type: e.target.value }))}
                              >
                                <option value="account">Khóa tài khoản</option>
                                <option value="comment">Cấm bình luận</option>
                                <option value="post">Cấm đăng bài viết</option>
                                <option value="document">Cấm đăng tài liệu</option>
                                <option value="report">Cấm báo cáo</option>
                              </select>
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label">Thời gian</label>
                              <select
                                className="form-select"
                                value={banForm.duration}
                                onChange={(e) => setBanForm(prev => ({ ...prev, duration: e.target.value }))}
                              >
                                <option value="1_day">1 ngày</option>
                                <option value="3_days">3 ngày</option>
                                <option value="1_week">1 tuần</option>
                                <option value="1_month">1 tháng</option>
                                <option value="permanent">Vĩnh viễn</option>
                              </select>
                            </div>
                            <div className="col-md-4 mb-3">
                              <label className="form-label">Lý do (tùy chọn)</label>
                              <input
                                type="text"
                                className="form-control"
                                value={banForm.reason}
                                onChange={(e) => setBanForm(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Nhập lý do..."
                              />
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="btn btn-danger"
                            disabled={banModal.loading}
                          >
                            {banModal.loading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2"></span>
                                Đang xử lý...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-ban me-2"></i>
                                Áp dụng lệnh cấm
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Danh sách lệnh cấm hiện tại */}
                    <div className="card">
                      <div className="card-header">
                        <h6 className="mb-0">
                          <i className="fas fa-list me-2"></i>
                          Các lệnh cấm hiện tại
                        </h6>
                      </div>
                      <div className="card-body">
                        {banModal.bans.filter(b => b.is_active).length > 0 ? (
                          <div className="table-responsive">
                            <table className="table table-sm">
                              <thead>
                                <tr>
                                  <th>Loại cấm</th>
                                  <th>Thời hạn</th>
                                  <th>Lý do</th>
                                  <th>Ngày cấm</th>
                                  <th>Thao tác</th>
                                </tr>
                              </thead>
                              <tbody>
                                {banModal.bans.filter(b => b.is_active).map(ban => (
                                  <tr key={ban.id}>
                                    <td>
                                      <span className={`badge ${
                                        ban.ban_type === 'account' ? 'bg-danger' :
                                        ban.ban_type === 'comment' ? 'bg-warning' :
                                        ban.ban_type === 'post' ? 'bg-info' :
                                        ban.ban_type === 'document' ? 'bg-primary' : 'bg-secondary'
                                      }`}>
                                        {getBanTypeName(ban.ban_type)}
                                      </span>
                                    </td>
                                    <td>
                                      {ban.ban_until 
                                        ? new Date(ban.ban_until).toLocaleString('vi-VN')
                                        : <span className="text-danger">Vĩnh viễn</span>
                                      }
                                    </td>
                                    <td>{ban.reason || '-'}</td>
                                    <td>{new Date(ban.created_at).toLocaleDateString('vi-VN')}</td>
                                    <td>
                                      <button
                                        className="btn btn-sm btn-success"
                                        onClick={() => handleUnbanUser(ban.ban_type)}
                                        disabled={banModal.loading}
                                      >
                                        <i className="fas fa-unlock"></i> Gỡ cấm
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center text-muted py-3">
                            <i className="fas fa-check-circle fa-2x mb-2"></i>
                            <p className="mb-0">Người dùng này không có lệnh cấm nào đang hoạt động</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Lịch sử cấm */}
                    {banModal.bans.filter(b => !b.is_active).length > 0 && (
                      <div className="card mt-3">
                        <div className="card-header">
                          <h6 className="mb-0">
                            <i className="fas fa-history me-2"></i>
                            Lịch sử cấm đã gỡ
                          </h6>
                        </div>
                        <div className="card-body">
                          <div className="table-responsive" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                            <table className="table table-sm table-striped">
                              <thead>
                                <tr>
                                  <th>Loại</th>
                                  <th>Lý do</th>
                                  <th>Ngày cấm</th>
                                </tr>
                              </thead>
                              <tbody>
                                {banModal.bans.filter(b => !b.is_active).map(ban => (
                                  <tr key={ban.id}>
                                    <td>{getBanTypeName(ban.ban_type)}</td>
                                    <td>{ban.reason || '-'}</td>
                                    <td>{new Date(ban.created_at).toLocaleDateString('vi-VN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeBanModal}
                  disabled={banModal.loading}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;