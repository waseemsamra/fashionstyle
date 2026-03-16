import { useState, useRef, useEffect } from 'react';
import { useSearchSuggestions, useSearchHistory } from '@/hooks/useSearchProducts';
import { useNavigate } from 'react-router-dom';
import { Search, X, History, TrendingUp, ArrowRight } from 'lucide-react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  autoFocus?: boolean;
  className?: string;
  placeholder?: string;
}

export function SearchBar({ 
  onSearch, 
  autoFocus = false, 
  className = '',
  placeholder = 'Search products...'
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { data: suggestions = [] } = useSearchSuggestions(query);
  const { getHistory, addToHistory, clearHistory } = useSearchHistory();
  
  const history = getHistory();
  const showSuggestions = isOpen && (query.length >= 2 || query.length === 0);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const allItems = [...history, ...suggestions];
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < (allItems.length - 1) ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < allItems.length) {
            handleSelect(allItems[selectedIndex]);
          } else if (query.length >= 2) {
            handleSearch(query);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, suggestions, history, selectedIndex, query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim().length < 2) return;

    addToHistory(searchQuery);
    setIsOpen(false);
    setSelectedIndex(-1);
    
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleSelect = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent"
          autoFocus={autoFocus}
        />
        
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-1"
          >
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border max-h-96 overflow-y-auto z-50">
          {/* Search History */}
          {history.length > 0 && query.length < 2 && (
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <History className="w-3 h-3" />
                  RECENT SEARCHES
                </span>
                <button
                  onClick={() => {
                    clearHistory();
                    setSelectedIndex(-1);
                  }}
                  className="text-xs text-gold hover:underline"
                >
                  Clear all
                </button>
              </div>
              {history.map((item, index) => {
                const isSelected = selectedIndex === index;
                return (
                  <button
                    key={`history-${index}`}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors ${
                      isSelected ? 'bg-gray-50' : ''
                    }`}
                  >
                    <History className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate">{item}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                );
              })}
            </div>
          )}

          {/* Search Suggestions */}
          {suggestions.length > 0 && query.length >= 2 && (
            <div className="p-2 border-t">
              <div className="px-3 py-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Search className="w-3 h-3" />
                  SUGGESTIONS
                </span>
              </div>
              {suggestions.map((suggestion, index) => {
                const historyOffset = history.length;
                const isSelected = selectedIndex === historyOffset + index;
                
                return (
                  <button
                    key={`suggestion-${index}`}
                    onClick={() => handleSelect(suggestion)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors ${
                      isSelected ? 'bg-gray-50' : ''
                    }`}
                  >
                    <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="flex-1 truncate">{suggestion}</span>
                    <span className="text-xs text-gray-400">Search</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Popular Searches (when no query) */}
          {query.length === 0 && (
            <div className="p-2">
              <div className="px-3 py-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  POPULAR SEARCHES
                </span>
              </div>
              {['Summer Collection', 'New Arrivals', 'Sale', 'Dresses', 'Shoes', 'Accessories'].map((item, index) => {
                const historyOffset = history.length;
                const isSelected = selectedIndex === historyOffset + index;
                
                return (
                  <button
                    key={`popular-${index}`}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-gray-50 rounded-lg transition-colors ${
                      isSelected ? 'bg-gray-50' : ''
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {query.length >= 2 && suggestions.length === 0 && history.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No suggestions found</p>
              <p className="text-xs mt-1">Try different keywords</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
