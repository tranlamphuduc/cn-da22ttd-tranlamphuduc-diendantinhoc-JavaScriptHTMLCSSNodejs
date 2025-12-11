import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Notifications = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [currentUser, navigate]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/notifications');
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('/api/notifications/mark-all-read');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return { icon: 'fas fa-comment', color: 'text-primary', bg: 'bg-primary' };
      case 'new_post':
        return { icon: 'fas fa-file-alt', color: 'text-success', bg: 'bg-success' };
      case 'new_post_category':
        return { icon: 'fas fa-folder-open', color: 'text-info', bg: 'bg-info' };
      case 'new_follower':
        return { icon: 'fas fa-user-plus', color: 'text-primary', bg: 'bg-primary' };
      case 'post_deleted':
        return { icon: 'fas fa-trash', color: 'text-danger', bg: 'bg-danger' };
      case 'comment_deleted':
        return { icon: 'fas fa-comment-slash', color: 'text-warning', bg: 'bg-warning' };
      case 'document_deleted':
        return { icon: 'fas fa-file-excel', color: 'text-danger', bg: 'bg-danger' };
      case 'report_warning':
        return { icon: 'fas fa-exclamation-triangle', color: 'text-warning', bg: 'bg-warning' };
      case 'penalty_reduced':
        return { icon: 'fas fa-gift', color: 'text-success', bg: 'bg-success' };
      case 'user_banned':
        return { icon: 'fas fa-ban', color: 'text-danger', bg: 'bg-danger' };
      case 'user_unbanned':
        return { icon: 'fas fa-unlock', color: 'text-success', bg: 'bg-success' };
      default:
        return { icon: 'fas fa-bell', color: 'text-info', bg: 'bg-info' };
    }
  };

  const getNotificationLink = (notification) => {
    // Ưu tiên sử dụng related_url nếu có
    if (notification.related_url) {
      return notification.related_url;
    }
    
    // Fallback dựa trên type
    switch (notification.type) {
      case 'comment':
      case 'new_post':
      case 'new_post_category':
        if (notification.related_id) {
          return `/posts/${notification.related_id}`;
        }
        break;
      case 'new_follower':
        if (notification.related_id) {
          return `/profile/${notification.related_id}`;
        }
        break;
      default:
        break;
    }
    return null;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>
            <i className="fas fa-bell me-2"></i>
            Thông báo
          </h2>
          <p className="text-muted mb-0">
            {unreadCount > 0 ? `Bạn có ${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button 
            className="btn btn-outline-primary"
            onClick={markAllAsRead}
          >
            <i className="fas fa-check-double me-2"></i>
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tất cả ({notifications.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            Chưa đọc ({unreadCount})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            Đã đọc ({notifications.length - unreadCount})
          </button>
        </li>
      </ul>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="card">
          <div className="list-group list-group-flush">
            {filteredNotifications.map(notification => {
              const { icon, bg } = getNotificationIcon(notification.type);
              const link = getNotificationLink(notification);
              
              return (
                <div
                  key={notification.id}
                  className={`list-group-item ${!notification.is_read ? 'bg-light' : ''}`}
                >
                  <div className="d-flex">
                    {/* Icon */}
                    <div className="me-3">
                      <div 
                        className={`rounded-circle ${bg} bg-opacity-10 d-flex align-items-center justify-content-center`}
                        style={{ width: '50px', height: '50px' }}
                      >
                        <i className={`${icon} ${bg.replace('bg-', 'text-')}`}></i>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-1">
                            {notification.title}
                            {!notification.is_read && (
                              <span className="badge bg-primary ms-2">Mới</span>
                            )}
                          </h6>
                          <p className="mb-2 text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                            {notification.message}
                          </p>
                          <small className="text-muted">
                            <i className="fas fa-clock me-1"></i>
                            {formatDate(notification.created_at)}
                          </small>
                        </div>
                        
                        {/* Actions */}
                        <div className="d-flex gap-2">
                          {link && (
                            <Link 
                              to={link} 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                              <i className="fas fa-eye me-1"></i>
                              Xem
                            </Link>
                          )}
                          {!notification.is_read && (
                            <button
                              className="btn btn-sm btn-outline-secondary"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-5">
            <i className="fas fa-bell-slash fa-4x text-muted mb-3"></i>
            <h5>Không có thông báo nào</h5>
            <p className="text-muted">
              {filter === 'unread' 
                ? 'Bạn đã đọc tất cả thông báo' 
                : filter === 'read'
                ? 'Chưa có thông báo nào được đọc'
                : 'Bạn chưa có thông báo nào'}
            </p>
            <Link to="/" className="btn btn-primary">
              <i className="fas fa-home me-2"></i>
              Về trang chủ
            </Link>
          </div>
        </div>
      )}

      {/* Back to Profile */}
      <div className="mt-4">
        <Link to={`/profile/${currentUser?.id}`} className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>
          Quay lại hồ sơ
        </Link>
      </div>
    </div>
  );
};

export default Notifications;
