import React, { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onSearch(searchTerm.trim());
      setSearchTerm('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          type="text"
          id="search-input"
          ref={searchInputRef}
          className="form-control border-0 bg-gray-subtle py-2 px-4"
          placeholder="Click Here or CTRL + K to Search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="input-group-append kbd">
          <div className="bg-gray-subtle px-2 py-2 d-flex align-items-center">
            <span><kbd>CTRL</kbd> + <kbd>K</kbd></span>
          </div>
        </div>
        <div className="input-group-append">
          <button
            className="btn customButton--secondary py-2 px-3 searchButton"
            type="submit"
            style={{ borderRadius: '1px 10px 10px 1px' }}
          >
            <span className="bi bi-search"></span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;