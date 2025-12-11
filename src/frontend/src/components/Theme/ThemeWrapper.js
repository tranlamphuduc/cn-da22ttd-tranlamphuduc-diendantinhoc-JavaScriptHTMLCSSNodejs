import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

// Các path không áp dụng theme tùy chỉnh
const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

const ThemeWrapper = ({ children }) => {
  const { currentUser } = useAuth();
  const { setUserId, setAuthPageStatus } = useTheme();
  const location = useLocation();

  // Kiểm tra có phải trang auth không
  useEffect(() => {
    const isAuth = AUTH_PATHS.includes(location.pathname);
    setAuthPageStatus(isAuth);
  }, [location.pathname, setAuthPageStatus]);

  // Sync user ID với theme
  useEffect(() => {
    setUserId(currentUser?.id || null);
  }, [currentUser, setUserId]);

  return children;
};

export default ThemeWrapper;
