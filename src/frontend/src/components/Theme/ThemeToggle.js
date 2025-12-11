import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { setShowSettings, currentUserId, isAuthPage } = useTheme();

  // Ẩn nút nếu chưa đăng nhập hoặc đang ở trang auth
  if (!currentUserId || isAuthPage) {
    return null;
  }

  return (
    <button 
      className="theme-toggle-btn"
      onClick={() => setShowSettings(true)}
      title="Tùy chỉnh giao diện"
    >
      <i className="fas fa-palette"></i>
    </button>
  );
};

export default ThemeToggle;
