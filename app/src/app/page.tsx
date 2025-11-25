'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { DareCard } from '@/components/DareCard';
import { CreateDareModal } from '@/components/CreateDareModal';
import { WelcomeModal } from '@/components/WelcomeModal';
import { LoadingSpinner } from '@/components/CircularLoader';
import { useDareApi } from '@/hooks/useDareApi';
import { useUser } from '@/hooks/useUser';
import { useSocket } from '@/contexts/SocketContext';
import { Dare } from '@/types';
import { getMockDares } from '@/lib/mockDares';

export default function HomePage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { getDares } = useDareApi();
  const { user, isAuthenticated } = useUser();
  const { socket, joinDaresList, leaveDaresList } = useSocket();
  
  const [dares, setDares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // DEBUG: Track dares state changes
  useEffect(() => {
    console.log('[HomePage] Dares state changed:', {
      daresCount: dares.length,
      loading,
      mounted,
      isAuthenticated
    });
  }, [dares, loading, mounted, isAuthenticated]);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
    console.log('[HomePage] Component mounted');
  }, []);

  // Join dares list room for real-time updates
  useEffect(() => {
    if (socket) {
      joinDaresList();
      
      return () => {
        leaveDaresList();
      };
    }
  }, [socket, joinDaresList, leaveDaresList]);

  // Mock data for demonstration
  const createMockDares = (): Dare[] => {
    return getMockDares();
  };

  const loadDares = useCallback(async () => {
    console.log('[HomePage] loadDares called');
    
    setLoading(true);
    
    try {
      // Always try to show mock data first for demo purposes
      // In production, you'd only fetch from program
      console.log('[HomePage] Using mock dares for demo');
      const mockDares = createMockDares();
      setDares(mockDares);
      
      // Optionally try to fetch real dares in background
      console.log('[HomePage] Fetching real dares from API...');
      getDares().then(fetchedDares => {
        if (fetchedDares.length > 0) {
          console.log('[HomePage] Fetched real dares:', fetchedDares.length);
          setDares(fetchedDares);
        }
      }).catch(err => {
        console.error('[HomePage] Failed to fetch real dares:', err);
      });
    } catch (error) {
      console.error('[HomePage] Error loading dares:', error);
      // Fallback to mock data on error
      const mockDares = createMockDares();
      setDares(mockDares);
    } finally {
      setLoading(false);
    }
  }, [getDares]); // Keep dependency

  // Load dares on mount
  useEffect(() => {
    console.log('[HomePage] Mount effect - loading dares, mounted:', mounted);
    if (mounted) {
      loadDares();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]); // Only depend on mounted - loadDares intentionally omitted to prevent loops

  // Reload when wallet connects/disconnects
  useEffect(() => {
    console.log('[HomePage] Wallet changed, reloading dares');
    if (mounted) {
      loadDares();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey]); // Only depend on publicKey

  // Listen for dare updates via WebSocket
  useEffect(() => {
    if (!socket) return;

    const handleDareUpdate = ({ dareId, updateType }: { dareId: string; updateType: string }) => {
      console.log(`[HomePage] Dare updated via WebSocket: ${dareId} - ${updateType}`);
      // Reload dares to get fresh data
      loadDares();
    };

    socket.on('dare-data-changed', handleDareUpdate);

    return () => {
      socket.off('dare-data-changed', handleDareUpdate);
    };
  }, [socket, loadDares]);

  const handleDareCreated = () => {
    setShowCreateModal(false);
    // Force refresh by clearing dares first
    setDares([]);
    loadDares();
  };

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-brutal font-bold text-anarchist-red mb-4 uppercase tracking-wider">
              ACTIVE DARES
            </h1>
            <p className="text-lg text-anarchist-white font-brutal">
              BET ON WHETHER SOMEONE WILL COMPLETE THESE DARES OR NOT
            </p>
          </div>

          <div className="text-center py-16">
            <LoadingSpinner 
              text="LOADING SYSTEM..." 
              size="xl" 
              className="justify-center mb-2"
            />
            <p className="text-sm text-anarchist-offwhite font-brutal mt-2">
              PREPARING YOUR DARE BETS EXPERIENCE
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-brutal font-bold text-anarchist-red mb-4 uppercase tracking-wider">
              ACTIVE DARES
            </h1>
            <p className="text-lg text-anarchist-white font-brutal">
              BET ON WHETHER SOMEONE WILL COMPLETE THESE DARES OR NOT
            </p>
          </div>

          <div className="text-center py-16 border-2 border-anarchist-red bg-anarchist-black/50 rounded-lg">
            <LoadingSpinner 
              text="LOADING SYSTEM..." 
              size="xl" 
              className="justify-center mb-2"
            />
            <p className="text-sm text-anarchist-offwhite font-brutal mt-2">
              PREPARING YOUR DARE BETS EXPERIENCE
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state check
  if (dares.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-brutal font-bold text-anarchist-red mb-4 uppercase tracking-wider">
              ACTIVE DARES
            </h1>
            <p className="text-lg text-anarchist-white font-brutal">
              BET ON WHETHER SOMEONE WILL COMPLETE THESE DARES OR NOT
            </p>
          </div>

          <div className="text-center py-16 bg-anarchist-black border border-anarchist-red">
            <div className="text-6xl mb-4 text-anarchist-red font-brutal">[EMPTY]</div>
            <h2 className="text-xl font-semibold text-anarchist-red mb-4 font-brutal">
              NO ACTIVE BETS
            </h2>
            <p className="text-anarchist-offwhite mb-6 font-brutal">
              THERE ARE NO ACTIVE DARES TO BET ON. CREATE ONE TO START THE CHAOS.
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-anarchist-red hover:bg-anarchist-darkred text-anarchist-black font-brutal font-bold py-3 px-6 border-2 border-anarchist-red transition-colors duration-200 uppercase tracking-wider"
              >
                CREATE DARE
              </button>
            )}
          </div>
          
          {showCreateModal && (
            <CreateDareModal
              onClose={() => setShowCreateModal(false)}
              onDareCreated={handleDareCreated}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-brutal font-bold text-anarchist-red uppercase tracking-wider">ACTIVE DARES</h1>
          <p className="text-anarchist-white mt-2 font-brutal">
            BET ON WHETHER SOMEONE WILL COMPLETE THESE DARES OR NOT
          </p>
        </div>
        
        {isAuthenticated && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Create Dare
          </button>
        )}
      </div>

      {!publicKey ? (
        <div className="text-center py-12 bg-anarchist-black border border-anarchist-red">
          <div className="text-6xl mb-4 text-anarchist-red font-brutal">[DISCONNECTED]</div>
          <h2 className="text-2xl font-semibold text-anarchist-red mb-4 font-brutal uppercase tracking-wider">
            CONNECT WALLET TO ACCESS SYSTEM
          </h2>
          <p className="text-anarchist-offwhite mb-8 max-w-md mx-auto font-brutal">
            CONNECT YOUR SOLANA WALLET TO CREATE DARES, PLACE BETS, AND JOIN THE CHAOS. 
            PHANTOM, SOLFLARE, WALLETCONNECT SUPPORTED.
          </p>
          <div className="bg-anarchist-charcoal border border-anarchist-red p-6 max-w-md mx-auto">
            <h3 className="font-semibold text-anarchist-red mb-2 font-brutal uppercase">NEW TO SOLANA?</h3>
            <p className="text-anarchist-offwhite text-sm font-brutal">
              DOWNLOAD PHANTOM OR SOLFLARE WALLET TO GET STARTED WITH SOL.
            </p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <div className="text-center py-12 bg-anarchist-black border border-anarchist-red">
          <LoadingSpinner 
            text="LOADING SYSTEM..." 
            size="xl" 
            className="justify-center mb-4"
          />
          <p className="text-anarchist-offwhite font-brutal">
            PREPARING YOUR DARE BETS EXPERIENCE
          </p>
        </div>
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          ref={(el) => {
            if (el) {
              console.log('[HomePage] Grid rendered:', {
                width: el.offsetWidth,
                height: el.offsetHeight,
                gridTemplateColumns: window.getComputedStyle(el).gridTemplateColumns,
                childrenCount: el.children.length
              });
            }
          }}
        >
          {dares.map((dare, index) => {
            if (!dare || !dare.publicKey) {
              console.error('[HomePage] Invalid dare object:', dare);
              return null;
            }
            const keyString = dare.publicKey.toString();
            console.log(`[HomePage] Rendering DareCard ${index + 1}/${dares.length}:`, {
              id: keyString.slice(0, 8),
              fullKey: keyString,
              title: dare.account.title.slice(0, 30) + '...'
            });
            return (
              <DareCard key={keyString} dare={dare} onUpdate={loadDares} />
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateDareModal
          onClose={() => setShowCreateModal(false)}
          onDareCreated={handleDareCreated}
        />
      )}
    </div>
  );
}
