import React, { useState, useRef } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

const fontOptions = [
  { value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', label: 'Mặc định (System)' },
  { value: '"Roboto", sans-serif', label: 'Roboto' },
  { value: '"Open Sans", sans-serif', label: 'Open Sans' },
  { value: '"Montserrat", sans-serif', label: 'Montserrat' },
  { value: '"Poppins", sans-serif', label: 'Poppins' },
  { value: '"Nunito", sans-serif', label: 'Nunito' },
  { value: '"Lato", sans-serif', label: 'Lato' },
  { value: 'Georgia, serif', label: 'Georgia (Serif)' },
  { value: '"Times New Roman", serif', label: 'Times New Roman' },
  { value: '"Courier New", monospace', label: 'Courier New (Mono)' }
];

const presetThemes = [
  {
    name: 'Mặc định',
    theme: {
      backgroundColor: '#f8f9fa',
      backgroundImage: '',
      primaryColor: '#007bff',
      textColor: '#333333',
      cardBackground: '#ffffff',
      navbarBackground: '#ffffff',
      navbarTextColor: '#333333',
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
    }
  },
  {
    name: 'Dark Mode',
    theme: {
      backgroundColor: '#1a1a2e',
      backgroundImage: '',
      primaryColor: '#e94560',
      textColor: '#eaeaea',
      cardBackground: '#16213e',
      navbarBackground: '#0f3460',
      navbarTextColor: '#eaeaea',
      linkColor: '#e94560',
      linkHoverColor: '#ff6b6b',
      buttonColor: '#e94560',
      buttonTextColor: '#ffffff',
      borderColor: '#2d3748',
      inputBackground: '#16213e',
      inputTextColor: '#eaeaea',
      badgeBackground: '#e94560',
      badgeTextColor: '#ffffff',
      footerBackground: '#0f3460',
      footerTextColor: '#eaeaea'
    }
  },
  {
    name: 'Nature',
    theme: {
      backgroundColor: '#e8f5e9',
      backgroundImage: '',
      primaryColor: '#2e7d32',
      textColor: '#1b5e20',
      cardBackground: '#ffffff',
      navbarBackground: '#4caf50',
      navbarTextColor: '#ffffff',
      linkColor: '#2e7d32',
      linkHoverColor: '#1b5e20',
      buttonColor: '#4caf50',
      buttonTextColor: '#ffffff',
      borderColor: '#a5d6a7',
      inputBackground: '#ffffff',
      inputTextColor: '#1b5e20',
      badgeBackground: '#66bb6a',
      badgeTextColor: '#ffffff',
      footerBackground: '#2e7d32',
      footerTextColor: '#ffffff'
    }
  },
  {
    name: 'Ocean',
    theme: {
      backgroundColor: '#e3f2fd',
      backgroundImage: '',
      primaryColor: '#1976d2',
      textColor: '#0d47a1',
      cardBackground: '#ffffff',
      navbarBackground: '#2196f3',
      navbarTextColor: '#ffffff',
      linkColor: '#1976d2',
      linkHoverColor: '#0d47a1',
      buttonColor: '#2196f3',
      buttonTextColor: '#ffffff',
      borderColor: '#90caf9',
      inputBackground: '#ffffff',
      inputTextColor: '#0d47a1',
      badgeBackground: '#42a5f5',
      badgeTextColor: '#ffffff',
      footerBackground: '#1565c0',
      footerTextColor: '#ffffff'
    }
  },
  {
    name: 'Sunset',
    theme: {
      backgroundColor: '#fff3e0',
      backgroundImage: '',
      primaryColor: '#ff5722',
      textColor: '#bf360c',
      cardBackground: '#ffffff',
      navbarBackground: '#ff9800',
      navbarTextColor: '#ffffff',
      linkColor: '#ff5722',
      linkHoverColor: '#e64a19',
      buttonColor: '#ff9800',
      buttonTextColor: '#ffffff',
      borderColor: '#ffcc80',
      inputBackground: '#ffffff',
      inputTextColor: '#bf360c',
      badgeBackground: '#ff7043',
      badgeTextColor: '#ffffff',
      footerBackground: '#e65100',
      footerTextColor: '#ffffff'
    }
  },
  {
    name: 'Purple Dream',
    theme: {
      backgroundColor: '#f3e5f5',
      backgroundImage: '',
      primaryColor: '#9c27b0',
      textColor: '#4a148c',
      cardBackground: '#ffffff',
      navbarBackground: '#7b1fa2',
      navbarTextColor: '#ffffff',
      linkColor: '#9c27b0',
      linkHoverColor: '#6a1b9a',
      buttonColor: '#9c27b0',
      buttonTextColor: '#ffffff',
      borderColor: '#ce93d8',
      inputBackground: '#ffffff',
      inputTextColor: '#4a148c',
      badgeBackground: '#ab47bc',
      badgeTextColor: '#ffffff',
      footerBackground: '#6a1b9a',
      footerTextColor: '#ffffff'
    }
  }
];

const ThemeSettings = () => {
  const { 
    theme, 
    updateTheme, 
    resetTheme, 
    exportTheme, 
    importTheme, 
    showSettings, 
    setShowSettings, 
    currentUserId, 
    isAuthPage,
    isUploading,
    uploadBackgroundImage,
    removeBackgroundImage
  } = useTheme();
  const [activeTab, setActiveTab] = useState('background');
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  // Ẩn nếu chưa đăng nhập, đang ở trang auth, hoặc không mở settings
  if (!showSettings || !currentUserId || isAuthPage) return null;

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Upload lên server thay vì convert sang base64
      await uploadBackgroundImage(file);
    }
    // Reset input để có thể chọn lại cùng file
    e.target.value = '';
  };

  const handleImportTheme = (e) => {
    const file = e.target.files[0];
    if (file) {
      importTheme(file);
    }
  };

  const applyPreset = (preset) => {
    Object.entries(preset.theme).forEach(([key, value]) => {
      updateTheme(key, value);
    });
  };

  return (
    <div className="theme-settings-overlay" onClick={() => setShowSettings(false)}>
      <div className="theme-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="theme-settings-header">
          <h4><i className="fas fa-palette me-2"></i>Tùy chỉnh giao diện</h4>
          <button className="btn-close" onClick={() => setShowSettings(false)}></button>
        </div>

        <div className="theme-tabs">
          <button 
            className={`theme-tab ${activeTab === 'background' ? 'active' : ''}`}
            onClick={() => setActiveTab('background')}
          >
            <i className="fas fa-image me-1"></i> Nền
          </button>
          <button 
            className={`theme-tab ${activeTab === 'colors' ? 'active' : ''}`}
            onClick={() => setActiveTab('colors')}
          >
            <i className="fas fa-fill-drip me-1"></i> Màu sắc
          </button>
          <button 
            className={`theme-tab ${activeTab === 'typography' ? 'active' : ''}`}
            onClick={() => setActiveTab('typography')}
          >
            <i className="fas fa-font me-1"></i> Chữ
          </button>
          <button 
            className={`theme-tab ${activeTab === 'presets' ? 'active' : ''}`}
            onClick={() => setActiveTab('presets')}
          >
            <i className="fas fa-magic me-1"></i> Mẫu
          </button>
        </div>

        <div className="theme-settings-body">
          {activeTab === 'background' && (
            <div className="settings-section">
              <div className="setting-group">
                <label>Màu nền</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.backgroundColor}
                    onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Ảnh nền</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-outline-primary btn-sm flex-grow-1"
                    onClick={() => fileInputRef.current.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1"></span>
                        Đang tải...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload me-1"></i> Tải ảnh lên
                      </>
                    )}
                  </button>
                  {theme.backgroundImage && (
                    <button 
                      className="btn btn-outline-danger btn-sm"
                      onClick={removeBackgroundImage}
                      disabled={isUploading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  )}
                </div>
                {theme.backgroundImage && (
                  <div className="bg-preview mt-2">
                    <img src={theme.backgroundImage} alt="Background preview" />
                  </div>
                )}
                <small className="text-muted">Ảnh sẽ được lưu trên server và đồng bộ trên mọi thiết bị</small>
              </div>

              <div className="setting-group">
                <label>Hoặc nhập URL ảnh nền</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="https://example.com/image.jpg"
                  value={theme.backgroundImage && !theme.backgroundImage.includes('localhost') ? theme.backgroundImage : ''}
                  onChange={(e) => updateTheme('backgroundImage', e.target.value)}
                />
                <small className="text-muted">URL ảnh từ internet (không đồng bộ)</small>
              </div>

              {theme.backgroundImage && (
                <>
                  <div className="setting-group">
                    <label>Kích thước ảnh nền</label>
                    <select
                      className="form-select form-select-sm"
                      value={theme.backgroundSize}
                      onChange={(e) => updateTheme('backgroundSize', e.target.value)}
                    >
                      <option value="cover">Phủ kín (Cover)</option>
                      <option value="contain">Vừa khung (Contain)</option>
                      <option value="auto">Tự động</option>
                      <option value="100% 100%">Kéo giãn</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>Vị trí ảnh nền</label>
                    <select
                      className="form-select form-select-sm"
                      value={theme.backgroundPosition}
                      onChange={(e) => updateTheme('backgroundPosition', e.target.value)}
                    >
                      <option value="center">Giữa</option>
                      <option value="top">Trên</option>
                      <option value="bottom">Dưới</option>
                      <option value="left">Trái</option>
                      <option value="right">Phải</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label>Cố định ảnh nền</label>
                    <select
                      className="form-select form-select-sm"
                      value={theme.backgroundAttachment}
                      onChange={(e) => updateTheme('backgroundAttachment', e.target.value)}
                    >
                      <option value="fixed">Cố định khi cuộn</option>
                      <option value="scroll">Cuộn theo trang</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'colors' && (
            <div className="settings-section">
              <h6 className="color-section-title">Màu cơ bản</h6>
              
              <div className="setting-group">
                <label>Màu chính (Primary)</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => updateTheme('primaryColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu chữ</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.textColor}
                    onChange={(e) => updateTheme('textColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.textColor}
                    onChange={(e) => updateTheme('textColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <h6 className="color-section-title mt-3">Card & Navbar</h6>

              <div className="setting-group">
                <label>Màu nền Card</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.cardBackground}
                    onChange={(e) => updateTheme('cardBackground', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.cardBackground}
                    onChange={(e) => updateTheme('cardBackground', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Độ trong suốt Card: {Math.round(theme.cardOpacity * 100)}%</label>
                <input
                  type="range"
                  className="form-range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={theme.cardOpacity}
                  onChange={(e) => updateTheme('cardOpacity', parseFloat(e.target.value))}
                />
              </div>

              <div className="setting-group">
                <label>Màu nền Navbar</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.navbarBackground}
                    onChange={(e) => updateTheme('navbarBackground', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.navbarBackground}
                    onChange={(e) => updateTheme('navbarBackground', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu chữ Navbar</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.navbarTextColor}
                    onChange={(e) => updateTheme('navbarTextColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.navbarTextColor}
                    onChange={(e) => updateTheme('navbarTextColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <h6 className="color-section-title mt-3">Link & Nút</h6>

              <div className="setting-group">
                <label>Màu link</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.linkColor || theme.primaryColor}
                    onChange={(e) => updateTheme('linkColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.linkColor || theme.primaryColor}
                    onChange={(e) => updateTheme('linkColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu link khi hover</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.linkHoverColor || '#0056b3'}
                    onChange={(e) => updateTheme('linkHoverColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.linkHoverColor || '#0056b3'}
                    onChange={(e) => updateTheme('linkHoverColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu nền nút</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.buttonColor || theme.primaryColor}
                    onChange={(e) => updateTheme('buttonColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.buttonColor || theme.primaryColor}
                    onChange={(e) => updateTheme('buttonColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu chữ nút</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.buttonTextColor || '#ffffff'}
                    onChange={(e) => updateTheme('buttonTextColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.buttonTextColor || '#ffffff'}
                    onChange={(e) => updateTheme('buttonTextColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <h6 className="color-section-title mt-3">Input & Viền</h6>

              <div className="setting-group">
                <label>Màu viền</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.borderColor || '#dee2e6'}
                    onChange={(e) => updateTheme('borderColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.borderColor || '#dee2e6'}
                    onChange={(e) => updateTheme('borderColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu nền ô nhập</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.inputBackground || '#ffffff'}
                    onChange={(e) => updateTheme('inputBackground', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.inputBackground || '#ffffff'}
                    onChange={(e) => updateTheme('inputBackground', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu chữ ô nhập</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.inputTextColor || '#495057'}
                    onChange={(e) => updateTheme('inputTextColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.inputTextColor || '#495057'}
                    onChange={(e) => updateTheme('inputTextColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <h6 className="color-section-title mt-3">Badge & Footer</h6>

              <div className="setting-group">
                <label>Màu nền badge/tag</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.badgeBackground || '#667eea'}
                    onChange={(e) => updateTheme('badgeBackground', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.badgeBackground || '#667eea'}
                    onChange={(e) => updateTheme('badgeBackground', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu chữ badge/tag</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.badgeTextColor || '#ffffff'}
                    onChange={(e) => updateTheme('badgeTextColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.badgeTextColor || '#ffffff'}
                    onChange={(e) => updateTheme('badgeTextColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu nền footer</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.footerBackground || '#343a40'}
                    onChange={(e) => updateTheme('footerBackground', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.footerBackground || '#343a40'}
                    onChange={(e) => updateTheme('footerBackground', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>

              <div className="setting-group">
                <label>Màu chữ footer</label>
                <div className="color-input-wrapper">
                  <input
                    type="color"
                    value={theme.footerTextColor || '#ffffff'}
                    onChange={(e) => updateTheme('footerTextColor', e.target.value)}
                  />
                  <input
                    type="text"
                    value={theme.footerTextColor || '#ffffff'}
                    onChange={(e) => updateTheme('footerTextColor', e.target.value)}
                    className="form-control form-control-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'typography' && (
            <div className="settings-section">
              <div className="setting-group">
                <label>Font chữ</label>
                <select
                  className="form-select form-select-sm"
                  value={theme.fontFamily}
                  onChange={(e) => updateTheme('fontFamily', e.target.value)}
                >
                  {fontOptions.map((font) => (
                    <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                      {font.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="setting-group">
                <label>Cỡ chữ: {theme.fontSize}</label>
                <input
                  type="range"
                  className="form-range"
                  min="12"
                  max="20"
                  step="1"
                  value={parseInt(theme.fontSize)}
                  onChange={(e) => updateTheme('fontSize', `${e.target.value}px`)}
                />
              </div>

              <div className="setting-group">
                <label>Bo góc: {theme.borderRadius}</label>
                <input
                  type="range"
                  className="form-range"
                  min="0"
                  max="20"
                  step="2"
                  value={parseInt(theme.borderRadius)}
                  onChange={(e) => updateTheme('borderRadius', `${e.target.value}px`)}
                />
              </div>

              <div className="typography-preview mt-3">
                <p style={{ fontFamily: theme.fontFamily, fontSize: theme.fontSize, color: theme.textColor }}>
                  Đây là văn bản mẫu để xem trước font chữ và cỡ chữ bạn đã chọn.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="settings-section">
              <div className="preset-grid">
                {presetThemes.map((preset, index) => (
                  <div 
                    key={index}
                    className="preset-card"
                    onClick={() => applyPreset(preset)}
                  >
                    <div 
                      className="preset-preview"
                      style={{
                        backgroundColor: preset.theme.backgroundColor,
                        borderColor: preset.theme.primaryColor
                      }}
                    >
                      <div 
                        className="preset-navbar"
                        style={{ backgroundColor: preset.theme.navbarBackground }}
                      ></div>
                      <div 
                        className="preset-card-preview"
                        style={{ backgroundColor: preset.theme.cardBackground }}
                      ></div>
                    </div>
                    <span className="preset-name">{preset.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="theme-settings-footer">
          <input
            type="file"
            ref={importInputRef}
            accept=".json"
            onChange={handleImportTheme}
            style={{ display: 'none' }}
          />
          <button className="btn btn-outline-secondary btn-sm" onClick={() => importInputRef.current.click()}>
            <i className="fas fa-file-import me-1"></i> Import
          </button>
          <button className="btn btn-outline-secondary btn-sm" onClick={exportTheme}>
            <i className="fas fa-file-export me-1"></i> Export
          </button>
          <button className="btn btn-outline-warning btn-sm" onClick={resetTheme}>
            <i className="fas fa-undo me-1"></i> Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThemeSettings;
