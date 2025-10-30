'use client';

import { useState, useEffect } from 'react';
import { LoadingSpinner } from './CircularLoader';

interface Bet {
  id: string;
  amount: number;
  betType: 'willDo' | 'wontDo';
  timestamp: number;
  username?: string;
  wallet: string;
  txHash?: string;
  avatar: string;
  multiplier: number;
}

interface BetFeedProps {
  dareId: string;
}

export function BetFeed({ dareId }: BetFeedProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock bet data for demonstration
    const generateMockBets = (): Bet[] => {
      const mockUsers = [
        { name: 'DAREDEVIL_SOL', avatar: '💀' },
        { name: 'GHOST_PEPPER_KING', avatar: '🌶️' }, 
        { name: 'CEMETERY_WALKER', avatar: '⚰️' },
        { name: 'BACKWARDS_LEGEND', avatar: '🔄' },
        { name: 'MAYO_MANIAC', avatar: '🥄' },
        { name: 'PIRATE_MASTER', avatar: '🏴‍☠️' },
        { name: 'FEARLESS_EXPLORER', avatar: '🗺️' },
        { name: 'BOLD_WARRIOR', avatar: '⚔️' },
        { name: 'REVERSE_REBEL', avatar: '↩️' },
        { name: 'CONDIMENT_KING', avatar: '👑' },
        { name: 'CRYPTO_ANARCHIST', avatar: '⚡' },
        { name: 'VOID_WALKER', avatar: '🌙' },
        { name: 'STORM_BREAKER', avatar: '⛈️' },
        { name: 'CHAOS_TRADER', avatar: '🃏' },
        { name: 'NIGHT_RIDER', avatar: '🏍️' }
      ];

      const mockBets: Bet[] = [];
      const now = Date.now();

      // Generate 20-30 recent bets
      for (let i = 0; i < 25; i++) {
        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const randomAmount = parseFloat((Math.random() * 1.5 + 0.05).toFixed(3)); // 0.05 to 1.55 SOL
        const randomType = Math.random() > 0.55 ? 'willDo' : 'wontDo'; // Slight bias toward won't do
        const timeAgo = Math.floor(Math.random() * 14400) + 60; // 1 minute to 4 hours ago
        const multiplier = parseFloat((Math.random() * 1.5 + 1.2).toFixed(2)); // 1.2x to 2.7x

        mockBets.push({
          id: `bet-${i}`,
          amount: randomAmount,
          betType: randomType,
          timestamp: now - (timeAgo * 1000),
          username: randomUser.name,
          wallet: `${randomUser.name.slice(0, 4)}...${randomUser.name.slice(-4)}`,
          txHash: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          avatar: randomUser.avatar,
          multiplier
        });
      }

      // Sort by timestamp (newest first)
      return mockBets.sort((a, b) => b.timestamp - a.timestamp);
    };

    // Simulate loading delay
    setTimeout(() => {
      setBets(generateMockBets());
      setLoading(false);
    }, 800);

    // Add new bets periodically to simulate live activity
    const interval = setInterval(() => {
      if (Math.random() > 0.75) { // 25% chance every 4 seconds
        const mockUsers = [
          { name: 'CRYPTO_PUNK', avatar: '🤘' },
          { name: 'SOL_LEGEND', avatar: '☀️' },
          { name: 'DARE_MASTER', avatar: '💎' },
          { name: 'WILD_CARD', avatar: '🎰' }
        ];
        
        const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const newBet: Bet = {
          id: `bet-${Date.now()}`,
          amount: parseFloat((Math.random() * 0.8 + 0.05).toFixed(3)),
          betType: Math.random() > 0.5 ? 'wontDo' : 'willDo',
          timestamp: Date.now(),
          username: user.name,
          wallet: `${user.name.slice(0, 4)}...${user.name.slice(-4)}`,
          txHash: `${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          avatar: user.avatar,
          multiplier: parseFloat((Math.random() * 1.0 + 1.5).toFixed(2))
        };

        setBets(prevBets => [newBet, ...prevBets.slice(0, 29)]); // Keep last 30 bets
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [dareId]);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  if (loading) {
    return (
      <div className="bg-anarchist-charcoal border-2 border-anarchist-red">
        <div className="flex items-center justify-between p-4 border-b border-anarchist-red">
          <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider">LIVE BETS</h3>
          <LoadingSpinner size="sm" className="items-center" />
        </div>
        <div className="p-6 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-anarchist-gray rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-anarchist-gray rounded w-32 mb-2"></div>
                  <div className="h-3 bg-anarchist-gray rounded w-20"></div>
                </div>
                <div className="h-6 bg-anarchist-gray rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-anarchist-charcoal border-2 border-anarchist-red">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-anarchist-red">
        <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider">LIVE BETS</h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-brutal text-anarchist-offwhite">LIVE</span>
        </div>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-anarchist-gray bg-anarchist-black/30">
        <div className="text-center">
          <div className="text-lg font-brutal font-bold text-green-600">
            {bets.filter(bet => bet.betType === 'willDo').length}
          </div>
          <div className="text-xs font-brutal text-anarchist-offwhite uppercase">WILL DO</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-brutal font-bold text-red-600">
            {bets.filter(bet => bet.betType === 'wontDo').length}
          </div>
          <div className="text-xs font-brutal text-anarchist-offwhite uppercase">WON'T DO</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-brutal font-bold text-anarchist-white">
            {bets.reduce((sum, bet) => sum + bet.amount, 0).toFixed(2)}
          </div>
          <div className="text-xs font-brutal text-anarchist-offwhite uppercase">TOTAL SOL</div>
        </div>
      </div>

      {/* Bet Feed */}
      <div className="h-80 overflow-y-auto scrollbar-thin scrollbar-track-anarchist-black scrollbar-thumb-anarchist-red">
        {bets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="text-6xl mb-4">💰</div>
            <p className="text-anarchist-offwhite font-brutal text-sm text-center">
              NO BETS YET<br />BE THE FIRST TO BET!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {bets.map((bet, index) => (
              <div
                key={bet.id}
                className={`
                  relative p-4 border-l-4 transition-all duration-300 hover:bg-anarchist-black/50
                  ${bet.betType === 'willDo' 
                    ? 'border-l-green-600 bg-green-900/10' 
                    : 'border-l-red-600 bg-red-900/10'
                  }
                  ${index === 0 ? 'animate-pulse bg-opacity-20' : ''}
                `}
              >
                {/* New bet indicator */}
                {index === 0 && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-brutal bg-anarchist-red text-anarchist-white rounded-sm animate-bounce">
                      NEW
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between mb-3">
                  {/* User Info */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-anarchist-black border border-anarchist-gray rounded text-lg">
                      {bet.avatar}
                    </div>
                    <div>
                      <div className="font-brutal font-bold text-anarchist-white text-sm">
                        {bet.username}
                      </div>
                      <div className="text-xs font-brutal text-anarchist-offwhite">
                        {formatTimeAgo(bet.timestamp)}
                      </div>
                    </div>
                  </div>

                  {/* Bet Amount */}
                  <div className="text-right">
                    <div className="font-brutal font-bold text-anarchist-white text-lg">
                      {bet.amount.toFixed(3)} <span className="text-sm text-anarchist-offwhite">SOL</span>
                    </div>
                  </div>
                </div>

                {/* Bet Details */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`
                      px-3 py-1 text-xs font-brutal font-bold rounded-sm border uppercase
                      ${bet.betType === 'willDo' 
                        ? 'bg-green-900/30 text-green-400 border-green-600' 
                        : 'bg-red-900/30 text-red-400 border-red-600'
                      }
                    `}>
                      {bet.betType === 'willDo' ? 'WILL DO' : "WON'T DO"}
                    </span>
                    <span className="text-xs font-brutal text-anarchist-offwhite bg-anarchist-black px-2 py-1 border border-anarchist-gray rounded-sm">
                      {bet.multiplier}x
                    </span>
                  </div>
                  
                  <div className="text-xs font-brutal text-anarchist-offwhite">
                    TX: <span className="font-mono">{bet.txHash}</span>
                  </div>
                </div>

                {/* Potential Payout */}
                <div className="pt-3 border-t border-anarchist-gray/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-brutal text-anarchist-offwhite uppercase">POTENTIAL PAYOUT:</span>
                    <span className="text-sm font-brutal font-bold text-anarchist-white">
                      {(bet.amount * bet.multiplier).toFixed(3)} SOL
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-anarchist-gray bg-anarchist-black/30">
        <div className="flex items-center justify-between text-xs font-brutal text-anarchist-offwhite">
          <span>TOTAL BETS: {bets.length}</span>
          <span>LAST: {bets.length > 0 ? formatTimeAgo(bets[0].timestamp) : 'N/A'}</span>
        </div>
      </div>
    </div>
  );
}