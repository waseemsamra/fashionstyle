import { useState, useRef, useEffect } from 'react';
import { Search, X, TrendingUp, History, ChevronRight } from 'lucide-react';
import { useSearchSuggestions, useSearchHistory } from '@/hooks/useSearchProducts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  onSearch, 
  initialValue = '', 
  placeholder = 'Search products...',
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  const { data: suggestions, isLoading } = useSearchSuggestions(query);
  const { getHistory, addToHistory, clearHistory } = useSearchHistory();
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      addToHistory(query);
      onSearch(query);
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    addToHistory(suggestion);
    onSearch(suggestion);
    setShowSuggestions(false);
    setShowHistory(false);
  };

  const handleHistoryClick = (historyItem: string) => {
    setQuery(historyItem);
    addToHistory(historyItem);
    onSearch(historyItem);
    setShowHistory(false);
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className={`relative ${className}`} ref={suggestionsRef}>
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(e.target.value.length >= 2);
            setShowHistory(false);
          }}
          onFocus={() => {
            if (query.length >= 2) {
              setShowSuggestions(true);
            } else if (history.length > 0) {
              setShowHistory(true);
            }
          }}
          placeholder={placeholder}
          className="pl-10 pr-10 w-full"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setShowSuggestions(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-2">
            <div className="text-xs text-gray-500 px-3 py-2">Suggestions</div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <Search className="w-4 h-4 text-gray-400" />
                <span dangerouslySetInnerHTML={{ 
                  __html: suggestion.replace(
                    new RegExp(`(${query})`, 'gi'),
                    '<strong class="text-gold">$1</strong>'
                  )
                }} />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* History Dropdown */}
      {showHistory && history.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-2">
            <div className="flex items-center justify-between px-3 py-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <History className="w-3 h-3" />
                Recent Searches
              </div>
              <button
                onClick={handleClearHistory}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
            {history.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-left"
              >
                <History className="w-4 h-4 text-gray-400" />
                <span className="flex-1">{item}</span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 shadow-lg">
          <CardContent className="p-4 text-center text-gray-500">
            Searching...
          </CardContent>
        </Card>
      )}
    </div>
  );
}
