/**
 * Enhanced Search Component
 * Advanced search with suggestions and filters
 */
import { useState, useEffect, useRef } from "react";
import { Search, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SearchSuggestion {
  id: string;
  text: string;
  type: string;
  icon?: React.ReactNode;
}

interface EnhancedSearchProps {
  placeholder?: string;
  onSearch: (query: string, filters?: any) => void;
  suggestions?: SearchSuggestion[];
  filters?: React.ReactNode;
  value?: string;
}

export function EnhancedSearch({
  placeholder = "Search... (Ctrl+F)",
  onSearch,
  suggestions = [],
  filters,
  value = "",
}: EnhancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Save to recent searches
      const updated = [
        query,
        ...recentSearches.filter((s) => s !== query),
      ].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("recentSearches", JSON.stringify(updated));

      onSearch(query);
      setShowSuggestions(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="search"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch(searchQuery);
              }
              if (e.key === "Escape") {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {filters && (
          <Button
            variant={showFilters ? "default" : "outline"}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Suggestions */}
      {showSuggestions &&
        (recentSearches.length > 0 || suggestions.length > 0) && (
          <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
            {recentSearches.length > 0 && (
              <div className="p-2">
                <div className="text-xs text-gray-500 px-2 py-1">
                  Recent Searches
                </div>
                {recentSearches.map((search, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSearchQuery(search);
                      handleSearch(search);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                  >
                    <Search className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{search}</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="p-2 border-t">
                <div className="text-xs text-gray-500 px-2 py-1">
                  Suggestions
                </div>
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      setSearchQuery(suggestion.text);
                      handleSearch(suggestion.text);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded flex items-center gap-2"
                  >
                    {suggestion.icon}
                    <span className="text-sm">{suggestion.text}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {suggestion.type}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

      {/* Filters Panel */}
      {showFilters && filters && (
        <div className="absolute top-full mt-2 w-full bg-white border rounded-lg shadow-lg z-50 p-4">
          {filters}
        </div>
      )}
    </div>
  );
}

