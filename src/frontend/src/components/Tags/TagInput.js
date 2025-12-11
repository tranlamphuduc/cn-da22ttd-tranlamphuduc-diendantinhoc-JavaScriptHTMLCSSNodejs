import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './TagInput.css';

const TagInput = ({ selectedTags = [], onChange, maxTags = 10 }) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchTags = async (query) => {
    if (query.length < 1) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await axios.get(`/api/tags/search?q=${query}`);
      const filteredSuggestions = response.data.tags.filter(
        tag => !selectedTags.includes(tag.name)
      );
      setSuggestions(filteredSuggestions);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching tags:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, '');
    setInputValue(value);
    searchTags(value);
  };

  const addTag = (tagName) => {
    const normalizedTag = tagName.toLowerCase().trim();
    if (normalizedTag && !selectedTags.includes(normalizedTag) && selectedTags.length < maxTags) {
      onChange([...selectedTags, normalizedTag]);
    }
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tagToRemove) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && selectedTags.length > 0) {
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div className="tag-input-container">
      <div className="tag-input-wrapper">
        {selectedTags.map((tag, index) => (
          <span key={index} className="tag-badge">
            #{tag}
            <button
              type="button"
              className="tag-remove"
              onClick={() => removeTag(tag)}
            >
              ×
            </button>
          </span>
        ))}
        {selectedTags.length < maxTags && (
          <input
            ref={inputRef}
            type="text"
            className="tag-input"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            placeholder={selectedTags.length === 0 ? "Nhập tag và nhấn Enter..." : ""}
          />
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="tag-suggestions" ref={suggestionsRef}>
          {suggestions.map((tag) => (
            <div
              key={tag.id}
              className="tag-suggestion-item"
              onClick={() => addTag(tag.name)}
            >
              <span className="tag-name">#{tag.name}</span>
              <span className="tag-count">{tag.usage_count} bài viết</span>
            </div>
          ))}
        </div>
      )}
      
      <small className="text-muted">
        Tối đa {maxTags} tags. Nhấn Enter hoặc dấu phẩy để thêm tag.
      </small>
    </div>
  );
};

export default TagInput;
