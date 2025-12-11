import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './FollowButton.css';

const FollowButton = ({ userId, userName, onFollowChange, className = '' }) => {
  const { currentUser } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser && userId) {
      checkFollowStatus();
    }
  }, [currentUser, userId]);

  const checkFollowStatus = async () => {
    try {
      const response = await axios.get(`/api/follows/user/check/${userId}`);
      setIsFollowing(response.data.isFollowing);
    } catch (error) {
      console.error('Error checking follow status:', error);
    }
  };

  const toggleFollow = async () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để theo dõi');
      return;
    }

    if (currentUser.id === parseInt(userId)) {
      return;
    }

    setLoading(true);
    try {
      if (isFollowing) {
        await axios.delete(`/api/follows/user/${userId}`);
        setIsFollowing(false);
      } else {
        await axios.post(`/api/follows/user/${userId}`);
        setIsFollowing(true);
      }
      if (onFollowChange) {
        onFollowChange(!isFollowing);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  // Không hiển thị nút nếu là chính mình
  if (!currentUser || currentUser.id === parseInt(userId)) {
    return null;
  }

  return (
    <button
      className={`follow-btn ${isFollowing ? 'following' : ''} ${className}`}
      onClick={toggleFollow}
      disabled={loading}
      title={isFollowing ? `Bỏ theo dõi ${userName}` : `Theo dõi ${userName}`}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm"></span>
      ) : (
        <>
          <i className={`fas ${isFollowing ? 'fa-user-check' : 'fa-user-plus'}`}></i>
          <span className="ms-1">{isFollowing ? 'Đang theo dõi' : 'Theo dõi'}</span>
        </>
      )}
    </button>
  );
};

export default FollowButton;
