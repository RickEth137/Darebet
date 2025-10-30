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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (!searchQuery.trim()) return [];

    const results: SearchResult[] = [];
    
    // Mock dare data - in production, this would come from your database
    const mockDares = [
      { 
        id: '1', 
        title: 'EAT 10 GHOST PEPPERS IN 5 MINUTES', 
        description: 'I DARE YOU TO CONSUME 10 CAROLINA REAPER GHOST PEPPERS WITHIN 5 MINUTES WITHOUT DRINKING ANYTHING. RECORD THE ENTIRE PROCESS.',
        creator: 'SPICY_CHALLENGER'
      },
      { 
        id: '2', 
        title: 'SLEEP IN A CEMETERY FOR 24 HOURS', 
        description: 'SPEND AN ENTIRE NIGHT AND DAY IN A GRAVEYARD. NO LEAVING THE PREMISES. DOCUMENT WITH TIMESTAMPS EVERY 2 HOURS.',
        creator: 'FEARLESS_EXPLORER'
      },
      { 
        id: '3', 
        title: 'SHAVE HEAD AND EYEBROWS COMPLETELY', 
        description: 'COMPLETELY SHAVE OFF ALL HAIR INCLUDING EYEBROWS. MUST KEEP IT OFF FOR AT LEAST 30 DAYS. NO WIGS OR FAKE HAIR ALLOWED.',
        creator: 'BOLD_WARRIOR'
      },
      { 
        id: '4', 
        title: 'WALK BACKWARDS FOR ENTIRE DAY', 
        description: 'WALK ONLY BACKWARDS FOR 24 HOURS STRAIGHT. NO FORWARD STEPS ALLOWED. DOCUMENT THE JOURNEY WITH CONTINUOUS VIDEO.',
        creator: 'REVERSE_REBEL'
      },
      { 
        id: '5', 
        title: 'EAT NOTHING BUT MAYO FOR 3 DAYS', 
        description: 'CONSUME ONLY MAYONNAISE FOR 72 HOURS. NO OTHER FOOD OR DRINKS EXCEPT WATER. MUST BE DOCUMENTED WITH MEAL TIMESTAMPS.',
        creator: 'CONDIMENT_KING'
      },
      { 
        id: '6', 
        title: 'TALK LIKE PIRATE FOR ONE MONTH', 
        description: 'SPEAK ONLY IN PIRATE LANGUAGE FOR 30 CONSECUTIVE DAYS. MUST BE MAINTAINED IN ALL CONVERSATIONS, WORK, AND PUBLIC INTERACTIONS.',
        creator: 'PIRATE_MASTER'
      }
    ];

    // Mock user data - in production, this would come from your user database
    const mockUsers = [
      { 
        id: 'user1', 
        username: 'DAREDEVIL_SOL', 
        bio: 'Professional dare completer and chaos creator. Completed over 50 dares.',
        publicKey: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU'
      },
      { 
        id: 'user2', 
        username: 'GHOST_PEPPER_KING', 
        bio: 'Spicy food challenge specialist. Current record: 15 Carolina Reapers in 3 minutes.',
        publicKey: '8yYXug3DX98e08UKTEqcE6kCifUeTrB94UAVpKptbBtV'
      },
      { 
        id: 'user3', 
        username: 'CEMETERY_WALKER', 
        bio: 'Fearless night owl and graveyard explorer. Never met a dare I wouldn\'t take.',
        publicKey: '9zZYvh4EY09f19VLUFrdF7lDjgVfUsC05VBWqKqucCuW'
      },
      { 
        id: 'user4', 
        username: 'BACKWARDS_LEGEND', 
        bio: 'Walking backwards since 2024. Professional reverse walker and orientation challenger.',
        publicKey: 'AaAbwi5FZ10g20WMVGseG8mEkhaWgVdD16CBrLrveEdX'
      },
      { 
        id: 'user5', 
        username: 'MAYO_MANIAC', 
        bio: 'Condiment connoisseur and food challenger. Will eat anything for the right bet.',
        publicKey: 'BbBcxj6GA21h31XNWHtfH9nFlibXhWfE27DCsMswfFeY'
      },
      {
        id: 'user6',
        username: 'PIRATE_MASTER',
        bio: 'Arrr! Speaking like a pirate for over 200 days straight. Savvy?',
        publicKey: 'CcCdyk7HB32i42YOXIugI0oGmjcYiXgF38EDtNtxgGfZ'
      }
    ];

    const queryLower = searchQuery.toLowerCase();

    // Search dares
    mockDares.forEach(dare => {
      if (dare.title.toLowerCase().includes(queryLower) || 
          dare.description.toLowerCase().includes(queryLower) ||
          dare.creator.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'dare',
          id: dare.id,
          title: dare.title,
          subtitle: `DARE BY ${dare.creator}`,
          description: dare.description.substring(0, 120) + '...'
        });
      }
    });

    // Search users
    mockUsers.forEach(user => {
      if (user.username.toLowerCase().includes(queryLower) || 
          user.bio.toLowerCase().includes(queryLower)) {
        results.push({
          type: 'user',
          id: user.id,
          title: user.username,
          subtitle: 'USER PROFILE',
          description: user.bio,
          username: user.username,
          bio: user.bio,
          publicKey: user.publicKey
        });
      }
    });

    return results.slice(0, 10); // Limit results
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