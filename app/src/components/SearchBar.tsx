'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearch, SearchResult } from '@/hooks/useSearch';

interface SearchBarProps {
  onClose?: () => void;
}

export function SearchBar({ onClose }: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { results, isLoading, search } = useSearch();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (localQuery.trim()) {
        search(localQuery);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [localQuery, search]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'dare') {
      router.push(`/dare/${result.id}`);
    } else if (result.type === 'user') {
      router.push(`/profile/${result.id}`);
    }
    setIsOpen(false);
    setLocalQuery('');
    onClose?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => localQuery.trim() && setIsOpen(true)}
          placeholder="SEARCH DARES OR USERS..."
          className="w-full bg-anarchist-charcoal border-2 border-anarchist-red text-anarchist-white placeholder-anarchist-offwhite px-4 py-2 pr-12 font-brutal text-sm uppercase tracking-wider focus:outline-none focus:border-anarchist-white transition-colors"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin border-2 border-anarchist-red border-t-transparent h-4 w-4"></div>
          ) : (
            <svg className="w-4 h-4 text-anarchist-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-anarchist-black border-2 border-anarchist-red max-h-96 overflow-y-auto z-50">
          <div className="py-1">
            {results.map((result, index) => (
              <button
                key={`${result.type}-${result.id}-${index}`}
                onClick={() => handleResultClick(result)}
                className="w-full text-left px-4 py-3 hover:bg-anarchist-charcoal transition-colors border-b border-anarchist-charcoal last:border-b-0"
              >
                <div className="flex items-start space-x-3">
                  {result.type === 'user' ? (
                    <div className="flex-shrink-0">
                      {result.avatar ? (
                        <img 
                          src={result.avatar} 
                          alt="Profile"
                          className="w-8 h-8 object-cover border border-anarchist-red"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-anarchist-red border border-anarchist-red flex items-center justify-center text-anarchist-black text-xs font-brutal font-bold">
                          {result.title[0]}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-8 h-8 bg-anarchist-charcoal border border-anarchist-red flex items-center justify-center">
                      <svg className="w-4 h-4 text-anarchist-red" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-brutal font-bold text-anarchist-white text-sm truncate">
                        {result.title}
                      </h3>
                      <span className={`text-xs font-brutal uppercase tracking-wider px-2 py-0.5 border ${
                        result.type === 'dare' 
                          ? 'text-anarchist-red border-anarchist-red' 
                          : 'text-anarchist-offwhite border-anarchist-offwhite'
                      }`}>
                        {result.subtitle}
                      </span>
                    </div>
                    {result.description && (
                      <p className="text-anarchist-offwhite text-xs font-brutal mt-1 line-clamp-2">
                        {result.description}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          {localQuery.trim() && (
            <div className="px-4 py-2 border-t border-anarchist-red bg-anarchist-charcoal">
              <p className="text-xs text-anarchist-offwhite font-brutal">
                SHOWING {results.length} RESULT{results.length !== 1 ? 'S' : ''} FOR "{localQuery.toUpperCase()}"
              </p>
            </div>
          )}
        </div>
      )}

      {isOpen && localQuery.trim() && results.length === 0 && !isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-anarchist-black border-2 border-anarchist-red z-50">
          <div className="px-4 py-8 text-center">
            <div className="text-anarchist-red text-2xl font-brutal mb-2">[NO RESULTS]</div>
            <p className="text-anarchist-offwhite text-sm font-brutal">
              NO DARES OR USERS FOUND FOR "{localQuery.toUpperCase()}"
            </p>
            <p className="text-anarchist-offwhite text-xs font-brutal mt-1">
              TRY DIFFERENT KEYWORDS OR CREATE A NEW DARE
            </p>
          </div>
        </div>
      )}
    </div>
  );
}