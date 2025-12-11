import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const ThemeContext = createContext();

const defaultTheme = {
  backgroundColor: '#f8f9fa',
  backgroundImage: '',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundAttachment: 'fixed',
  primaryColor: '#007bff',
  textColor: '#333333',
  cardBackground: '#ffffff',
  cardOpacity: 1,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontSize: '16px',
  borderRadius: '8px',
  navbarBackground: '#ffffff',
  navbarTextColor: '#333333',
  // Màu mở rộng
  linkColor: '#007bff',
  linkHoverColor: '#0056b3',
  buttonColor: '#007bff',
  buttonTextColor: '#ffffff',
  borderColor: '#dee2e6',
  inputBackground: '#ffffff',
  inputTextColor: '#495057',
  badgeBackground: '#667eea',
  badgeTextColor: '#ffffff',
  footerBackground: '#343a40',
  footerTextColor: '#ffffff'
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(defaultTheme);
  const [showSettings, setShowSettings] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isAuthPage, setIsAuthPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const saveTimeoutRef = useRef(null);

  // Load theme từ server
  const loadThemeFromServer = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/auth/theme');
      if (response.data.theme_settings) {
        const serverTheme = { ...defaultTheme, ...response.data.theme_settings };
        setTheme(serverTheme);
        return serverTheme;
      }
      return defaultTheme;
    } catch (error) {
      console.error('Error loading theme from server:', error);
      return defaultTheme;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Lưu theme lên server (không bao gồm backgroundImage nếu là base64)
  const saveThemeToServer = useCallback(async (themeToSave) => {
    try {
      // Không lưu base64 image vào database
      const themeForServer = { ...themeToSave };
      if (themeForServer.backgroundImage && themeForServer.backgroundImage.startsWith('data:')) {
        // Giữ nguyên URL cũ nếu có, hoặc để trống
        delete themeForServer.backgroundImage;
      }
      await axios.put('/api/auth/theme', { theme_settings: themeForServer });
    } catch (error) {
      console.error('Error saving theme to server:', error);
    }
  }, []);

  // Upload background image lên server
  const uploadBackgroundImage = useCallback(async (file) => {
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('background', file);
      
      const response = await axios.post('/api/users/background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (response.data.backgroundImage) {
        // Thêm base URL cho ảnh
        const imageUrl = `http://localhost:5000${response.data.backgroundImage}`;
        setTheme(prev => ({ ...prev, backgroundImage: imageUrl }));
        return imageUrl;
      }
    } catch (error) {
      console.error('Error uploading background:', error);
      alert('Lỗi khi upload ảnh nền!');
    } finally {
      setIsUploading(false);
    }
    return null;
  }, []);

  // Xóa background image
  const removeBackgroundImage = useCallback(async () => {
    try {
      await axios.delete('/api/users/background');
      setTheme(prev => ({ ...prev, backgroundImage: '' }));
    } catch (error) {
      console.error('Error removing background:', error);
    }
  }, []);

  // Debounced save - chờ 1 giây sau khi user ngừng thay đổi mới lưu
  const debouncedSave = useCallback((themeToSave) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveThemeToServer(themeToSave);
    }, 1000);
  }, [saveThemeToServer]);

  // Cập nhật user ID từ bên ngoài
  const setUserId = useCallback(async (userId) => {
    setCurrentUserId(userId);
    
    if (userId && !isAuthPage) {
      const serverTheme = await loadThemeFromServer();
      // Thêm base URL cho backgroundImage nếu là path local
      if (serverTheme.backgroundImage && serverTheme.backgroundImage.startsWith('/uploads/')) {
        serverTheme.backgroundImage = `http://localhost:5000${serverTheme.backgroundImage}`;
      }
      applyTheme(serverTheme);
    } else {
      setTheme(defaultTheme);
      resetToDefault();
    }
  }, [isAuthPage, loadThemeFromServer]);

  // Đánh dấu trang auth
  const setAuthPageStatus = useCallback((status) => {
    setIsAuthPage(status);
    if (status) {
      resetToDefault();
    } else if (currentUserId) {
      applyTheme(theme);
    }
  }, [currentUserId, theme]);

  // Lưu theme khi thay đổi (trừ backgroundImage)
  useEffect(() => {
    if (currentUserId && !isAuthPage && !isLoading) {
      applyTheme(theme);
      debouncedSave(theme);
    }
  }, [theme, currentUserId, isAuthPage, isLoading, debouncedSave]);

  // Cleanup timeout khi unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const applyTheme = (themeConfig) => {
    const root = document.documentElement;
    
    // Background
    document.body.style.backgroundColor = themeConfig.backgroundColor;
    if (themeConfig.backgroundImage) {
      document.body.style.backgroundImage = `url(${themeConfig.backgroundImage})`;
      document.body.style.backgroundSize = themeConfig.backgroundSize;
      document.body.style.backgroundPosition = themeConfig.backgroundPosition;
      document.body.style.backgroundAttachment = themeConfig.backgroundAttachment;
      document.body.style.backgroundRepeat = 'no-repeat';
    } else {
      document.body.style.backgroundImage = 'none';
    }

    // CSS Variables
    root.style.setProperty('--primary-color', themeConfig.primaryColor);
    root.style.setProperty('--text-color', themeConfig.textColor);
    root.style.setProperty('--card-background', themeConfig.cardBackground);
    root.style.setProperty('--card-opacity', themeConfig.cardOpacity);
    root.style.setProperty('--font-family', themeConfig.fontFamily);
    root.style.setProperty('--font-size', themeConfig.fontSize);
    root.style.setProperty('--border-radius', themeConfig.borderRadius);
    root.style.setProperty('--navbar-background', themeConfig.navbarBackground);
    root.style.setProperty('--navbar-text-color', themeConfig.navbarTextColor);
    // Màu mở rộng
    root.style.setProperty('--link-color', themeConfig.linkColor || themeConfig.primaryColor);
    root.style.setProperty('--link-hover-color', themeConfig.linkHoverColor || '#0056b3');
    root.style.setProperty('--button-color', themeConfig.buttonColor || themeConfig.primaryColor);
    root.style.setProperty('--button-text-color', themeConfig.buttonTextColor || '#ffffff');
    root.style.setProperty('--border-color', themeConfig.borderColor || '#dee2e6');
    root.style.setProperty('--input-background', themeConfig.inputBackground || '#ffffff');
    root.style.setProperty('--input-text-color', themeConfig.inputTextColor || '#495057');
    root.style.setProperty('--badge-background', themeConfig.badgeBackground || '#667eea');
    root.style.setProperty('--badge-text-color', themeConfig.badgeTextColor || '#ffffff');
    root.style.setProperty('--footer-background', themeConfig.footerBackground || '#343a40');
    root.style.setProperty('--footer-text-color', themeConfig.footerTextColor || '#ffffff');
  };

  const resetToDefault = () => {
    applyTheme(defaultTheme);
  };

  const updateTheme = (key, value) => {
    if (!currentUserId || isAuthPage) return;
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  const resetTheme = async () => {
    if (!currentUserId || isAuthPage) return;
    // Xóa background file trước
    if (theme.backgroundImage) {
      await removeBackgroundImage();
    }
    setTheme(defaultTheme);
    try {
      await axios.delete('/api/auth/theme');
    } catch (error) {
      console.error('Error resetting theme:', error);
    }
  };

  const exportTheme = () => {
    // Merge với defaultTheme để đảm bảo export đầy đủ các thuộc tính
    const exportData = { ...defaultTheme, ...theme };
    
    // Không export backgroundImage nếu là URL localhost (không portable)
    if (exportData.backgroundImage && exportData.backgroundImage.includes('localhost')) {
      exportData.backgroundImage = '';
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'my-theme.json');
    link.click();
  };

  const importTheme = (file) => {
    if (!currentUserId || isAuthPage) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        // Merge với defaultTheme để đảm bảo có đầy đủ các thuộc tính mới
        const mergedTheme = { ...defaultTheme, ...imported };
        
        // Xử lý backgroundImage
        if (mergedTheme.backgroundImage) {
          // Không import base64, chỉ giữ URL
          if (mergedTheme.backgroundImage.startsWith('data:')) {
            mergedTheme.backgroundImage = '';
          }
        }
        
        // Cập nhật state
        setTheme(mergedTheme);
        
        // Apply theme ngay lập tức
        applyTheme(mergedTheme);
        
        // Lưu theme mới lên server
        await saveThemeToServer(mergedTheme);
        
        alert('Import theme thành công!');
      } catch (err) {
        alert('File theme không hợp lệ!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      updateTheme,
      resetTheme,
      exportTheme,
      importTheme,
      showSettings,
      setShowSettings,
      defaultTheme,
      setUserId,
      setAuthPageStatus,
      currentUserId,
      isAuthPage,
      isLoading,
      isUploading,
      uploadBackgroundImage,
      removeBackgroundImage
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
