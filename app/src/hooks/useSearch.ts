import { useState, useEffect } from 'react';

export interface SearchResult {
  type: 'dare' | 'user';
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  avatar?: string;
  publicKey?: string;
  username?: string;
  bio?: string;
}

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // This would eventually connect to your actual API
  const searchAPI = async (searchQuery: string): Promise<SearchResult[]> => {
    if (!searchQuery.trim()) return [];

    try {
      // Fetch dares from API
      const response = await fetch('/api/dares');
      const data = await response.json();
      
      if (!data.success || !data.data) {
        return [];
      }

      const dares: any[] = data.data;
      const results: SearchResult[] = [];
      const queryLower = searchQuery.toLowerCase();

      // Search dares
      dares.forEach(dare => {
        if (dare.title.toLowerCase().includes(queryLower) || 
            dare.description.toLowerCase().includes(queryLower) ||
            (dare.creator && dare.creator.toLowerCase().includes(queryLower))) {
          results.push({
            type: 'dare',
            id: dare.onChainId || dare.id,
            title: dare.title,
            subtitle: `DARE BY ${dare.creator ? dare.creator.slice(0, 8) + '...' : 'Unknown'}`,
            description: dare.description.substring(0, 120) + '...'
          });
        }
      });

      // TODO: Implement user search API
      // For now, we only search dares

      return results.slice(0, 10); // Limit results
    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  };

  const search = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchAPI(searchQuery);
      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return {
    query,
    results,
    isLoading,
    search,
    clearSearch,
    setQuery
  };
}