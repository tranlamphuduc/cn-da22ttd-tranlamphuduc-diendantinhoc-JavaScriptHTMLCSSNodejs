import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import './BookmarkButton.css';

const BookmarkButton = ({ postId, className = '' }) => {
  const { currentUser } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      checkBookmarkStatus();
    }
  }, [currentUser, postId]);

  const checkBookmarkStatus = async () => {
    try {
      const response = await axios.get(`/api/bookmarks/check/${postId}`);
      setIsBookmarked(response.data.isBookmarked);
    } catch (error) {
      console.error('Error checking bookmark:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!currentUser) {
      alert('Vui lòng đăng nhập để lưu bài viết');
      return;
    }

    setLoading(true);
    try {
      if (isBookmarked) {
        await axios.delete(`/api/bookmarks/${postId}`);
        setIsBookmarked(false);
      } else {
        await axios.post(`/api/bookmarks/${postId}`);
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      alert(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  return (
    <button
      className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''} ${className}`}
      onClick={toggleBookmark}
      disabled={loading}
      title={isBookmarked ? 'Bỏ lưu bài viết' : 'Lưu bài viết'}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm"></span>
      ) : (
        <>
          <i className={`${isBookmarked ? 'fas' : 'far'} fa-bookmark`}></i>
          <span className="ms-1">{isBookmarked ? 'Đã lưu' : 'Lưu'}</span>
        </>
      )}
    </button>
  );
};

export default BookmarkButton;
