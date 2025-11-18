import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <i className="fas fa-laptop-code me-2"></i>
          Diễn Đàn Tin Học
        </Link>

        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                <i className="fas fa-home me-1"></i>
                Trang chủ
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/documents">
                <i className="fas fa-file-alt me-1"></i>
                Tài liệu
              </Link>
            </li>
            {currentUser && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/create-post">
                    <i className="fas fa-plus me-1"></i>
                    Tạo bài viết
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/upload-document">
                    <i className="fas fa-upload me-1"></i>
                    Tải lên tài liệu
                  </Link>
                </li>
              </>
            )}
          </ul>

          <ul className="navbar-nav">
            {currentUser ? (
              <li className="nav-item dropdown">
                <a 
                  className="nav-link dropdown-toggle d-flex align-items-center" 
                  href="#" 
                  role="button" 
                  data-bs-toggle="dropdown"
                >
                  {currentUser.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt="Avatar" 
                      className="avatar avatar-sm me-2"
                    />
                  ) : (
                    <div className="avatar avatar-sm me-2 bg-primary d-flex align-items-center justify-content-center text-white">
                      {currentUser.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {currentUser.full_name}
                </a>
                <ul className="dropdown-menu">
                  <li>
                    <Link className="dropdown-item" to={`/profile/${currentUser.id}`}>
                      <i className="fas fa-user me-2"></i>
                      Hồ sơ cá nhân
                    </Link>
                  </li>
                  {currentUser.role === 'admin' && (
                    <li>
                      <Link className="dropdown-item" to="/admin/dashboard">
                        <i className="fas fa-tachometer-alt me-2"></i>
                        Bảng điều khiển
                      </Link>
                    </li>
                  )}
                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button className="dropdown-item" onClick={handleLogout}>
                      <i className="fas fa-sign-out-alt me-2"></i>
                      Đăng xuất
                    </button>
                  </li>
                </ul>
              </li>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">
                    <i className="fas fa-sign-in-alt me-1"></i>
                    Đăng nhập
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className="btn btn-primary ms-2" to="/register">
                    <i className="fas fa-user-plus me-1"></i>
                    Đăng ký
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;