import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchBar.css';

const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ posts: [], users: [], tags: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.length >= 2) {
        searchAll();
      } else {
        setResults({ posts: [], users: [], tags: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query]);

  const searchAll = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/posts/search/all?q=${encodeURIComponent(query)}`);
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch && onSearch(query);
      setShowResults(false);
    }
  };

  const handleResultClick = () => {
    setShowResults(false);
    setQuery('');
  };

  const hasResults = results.posts.length > 0 || results.users.length > 0 || results.tags.length > 0;

  return (
    <div className="search-bar-container" ref={searchRef}>
      <form onSubmit={handleSubmit} className="search-form">
        <div className="input-group">
          <span className="input-group-text bg-white border-end-0">
            <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-search'} text-muted`}></i>
          </span>
          <input
            type="text"
            className="form-control border-start-0"
            placeholder="Tìm bài viết, người dùng, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && setShowResults(true)}
          />
        </div>
      </form>

      {showResults && query.length >= 2 && (
        <div className="search-results-dropdown">
          {!hasResults && !loading && (
            <div className="search-no-results">
              <i className="fas fa-search me-2"></i>
              Không tìm thấy kết quả cho "{query}"
            </div>
          )}

          {/* Tags */}
          {results.tags.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">
                <i className="fas fa-hashtag me-2"></i>Tags
              </div>
              {results.tags.map(tag => (
                <Link
                  key={tag.id}
                  to={`/tags/${tag.slug}`}
                  className="search-result-item"
                  onClick={handleResultClick}
                >
                  <div className="search-result-icon tag-icon">
                    <i className="fas fa-hashtag"></i>
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title">#{tag.name}</div>
                    <small className="text-muted">{tag.usage_count} bài viết</small>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Users */}
          {results.users.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">
                <i className="fas fa-users me-2"></i>Người dùng
              </div>
              {results.users.map(user => (
                <Link
                  key={user.id}
                  to={`/profile/${user.id}`}
                  className="search-result-item"
                  onClick={handleResultClick}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="" className="search-result-avatar" />
                  ) : (
                    <div className="search-result-avatar bg-primary text-white d-flex align-items-center justify-content-center">
                      {user.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="search-result-content">
                    <div className="search-result-title">{user.full_name}</div>
                    <small className="text-muted">@{user.username}</small>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Posts */}
          {results.posts.length > 0 && (
            <div className="search-section">
              <div className="search-section-title">
                <i className="fas fa-file-alt me-2"></i>Bài viết
              </div>
              {results.posts.map(post => (
                <Link
                  key={post.id}
                  to={`/posts/${post.id}`}
                  className="search-result-item"
                  onClick={handleResultClick}
                >
                  <div className="search-result-icon post-icon">
                    <i className="fas fa-file-alt"></i>
                  </div>
                  <div className="search-result-content">
                    <div className="search-result-title">{post.title}</div>
                    <small className="text-muted">
                      {post.author} • {post.category_name}
                    </small>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {hasResults && (
            <div className="search-footer">
              <button 
                className="btn btn-link btn-sm w-100"
                onClick={() => {
                  onSearch && onSearch(query);
                  setShowResults(false);
                }}
              >
                Xem tất cả kết quả cho "{query}"
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
