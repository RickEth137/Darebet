'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicKey } from '@solana/web3.js';
import { useDareApi } from '@/hooks/useDareApi';
import { useSocket } from '@/contexts/SocketContext';
import { DareCard } from '@/components/DareCard';
import { ProofSubmissionsList } from '@/components/ProofSubmissionsList';
import { DareProgressChart } from '@/components/DareProgressChart';
import { BetFeed } from '@/components/BetFeed';
import { ChatRoom } from '@/components/ChatRoom';
import ContestantsSection from '@/components/dare/ContestantsSection';
import { Dare } from '@/types';

export default function DareDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const { getDares } = useDareApi();
  const { socket, joinDare, leaveDare } = useSocket();
  
  const [dare, setDare] = useState<Dare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dareId = params?.id as string;

  useEffect(() => {
    if (dareId) {
      loadDare();
    }
  }, [dareId]);

  // Listen for dare updates via WebSocket
  useEffect(() => {
    if (!socket || !dareId) return;

    const handleDareUpdate = ({ dareId: updatedDareId, updateType }: { dareId: string; updateType: string }) => {
      console.log(`[DareDetail] Dare updated via WebSocket: ${updatedDareId} - ${updateType}`);
      // Reload dare if it's the one we're viewing
      if (updatedDareId === dareId) {
        loadDare();
      }
    };

    socket.on('dare-data-changed', handleDareUpdate);

    return () => {
      socket.off('dare-data-changed', handleDareUpdate);
    };
  }, [socket, dareId]);

  const loadDare = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch from API
      try {
        const allDares = await getDares();
        const foundDare = allDares.find(d => d.publicKey.toString() === dareId);
        
        if (foundDare) {
          setDare(foundDare);
        } else {
          setError('Dare not found');
        }
      } catch (err) {
        setError('Invalid dare ID or dare not found');
      }
    } catch (err) {
      console.error('Error loading dare:', err);
      setError('Failed to load dare details');
    } finally {
      setLoading(false);
    }
  };

  const handleDareUpdate = () => {
    loadDare();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Loading skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-anarchist-black border-2 border-anarchist-red p-8 text-center">
            <div className="text-anarchist-red text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">Error Loading Dare</h1>
            <p className="text-anarchist-offwhite font-brutal mb-6">{error}</p>
            <div className="space-x-4">
              <button
                onClick={loadDare}
                className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="inline-block bg-anarchist-charcoal hover:bg-gray-700 text-anarchist-offwhite px-6 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-charcoal"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dare) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-anarchist-black border-2 border-anarchist-red p-8 text-center">
            <div className="text-anarchist-red text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">Dare Not Found</h1>
            <p className="text-anarchist-offwhite font-brutal mb-6">
              The dare you&apos;re looking for doesn&apos;t exist or may have been removed.
            </p>
            <Link
              href="/"
              className="inline-block bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anarchist-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <Link
              href="/"
              className="flex items-center text-anarchist-offwhite hover:text-anarchist-red transition-colors font-brutal uppercase tracking-wider cursor-pointer"
            >
              <span className="mr-2">←</span>
              Back to All Dares
            </Link>
          </div>

          {/* Main Content - Three Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column - Progress Chart and Bet Feed (3 columns) - STICKY */}
            <div className="xl:col-span-3 space-y-6 xl:sticky xl:top-4 xl:self-start">
              {/* Progress Chart */}
              <DareProgressChart dare={dare} />
              
              {/* Bet Feed */}
              <BetFeed dareId={dare.publicKey.toString()} />
            </div>

            {/* Middle Column - Dare Card and Details (6 columns) */}
            <div className="xl:col-span-6 space-y-6">
              {/* Dare Card */}
              <div>
                <DareCard dare={dare} onUpdate={handleDareUpdate} />
              </div>

              {/* Description and Rules */}
              <div className="bg-anarchist-charcoal border-2 border-anarchist-red p-6">
                <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-4">FULL DESCRIPTION</h3>
                <div className="space-y-4">
                  {/* Parse description to separate main description from rules */}
                  {(() => {
                    const descriptionParts = dare.account.description.split('\n\nRules:\n');
                    const mainDescription = descriptionParts[0];
                    const rules = descriptionParts[1] || '';
                    
                    return (
                      <>
                        <div>
                          <h4 className="text-sm font-brutal font-bold text-anarchist-offwhite uppercase tracking-wider mb-2">DESCRIPTION</h4>
                          <p className="text-anarchist-offwhite font-brutal text-sm leading-relaxed whitespace-pre-wrap">
                            {mainDescription}
                          </p>
                        </div>
                        
                        {rules && (
                          <div>
                            <h4 className="text-sm font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">RULES & REQUIREMENTS</h4>
                            <div className="text-anarchist-offwhite font-brutal text-sm leading-relaxed whitespace-pre-line">
                              {rules}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-anarchist-charcoal border-2 border-anarchist-red p-6">
                  <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-4">BETTING STATISTICS</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-anarchist-offwhite font-brutal uppercase text-sm">Total Pool:</span>
                      <span className="font-brutal font-bold text-anarchist-white">{(dare.account.totalPool / 1e9).toFixed(4)} SOL</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-anarchist-offwhite font-brutal uppercase text-sm">Will Do Pool:</span>
                      <span className="font-brutal font-bold text-green-600">
                        {(dare.account.willDoPool / 1e9).toFixed(4)} SOL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-anarchist-offwhite font-brutal uppercase text-sm">Won&apos;t Do Pool:</span>
                      <span className="font-brutal font-bold text-anarchist-red">
                        {(dare.account.wontDoPool / 1e9).toFixed(4)} SOL
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-anarchist-offwhite font-brutal uppercase text-sm">Minimum Bet:</span>
                      <span className="font-brutal font-bold text-anarchist-white">{(dare.account.minBet / 1e9).toFixed(4)} SOL</span>
                    </div>
                  </div>
                </div>

                <div className="bg-anarchist-charcoal border-2 border-anarchist-red p-6">
                  <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-4">DARE INFORMATION</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-anarchist-offwhite font-brutal uppercase text-sm block">Creator:</span>
                      <span className="font-mono text-sm text-anarchist-white">
                        {dare.account.creator.toString().slice(0, 8)}...{dare.account.creator.toString().slice(-8)}
                      </span>
                    </div>
                    <div>
                      <span className="text-anarchist-offwhite font-brutal uppercase text-sm block">Status:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-brutal font-bold uppercase tracking-wider border ${
                        dare.account.isCompleted 
                          ? 'bg-green-600 border-green-600 text-anarchist-black' 
                          : Date.now() > dare.account.deadline * 1000
                          ? 'bg-anarchist-red border-anarchist-red text-anarchist-black'
                          : 'bg-anarchist-charcoal border-anarchist-red text-anarchist-red'
                      }`}>
                        {dare.account.isCompleted 
                          ? 'Completed' 
                          : Date.now() > dare.account.deadline * 1000 
                          ? 'Expired' 
                          : 'Active'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-anarchist-offwhite font-brutal uppercase text-sm block">Deadline:</span>
                      <span className="font-brutal font-bold text-anarchist-white">
                        {new Date(dare.account.deadline * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contestants Section */}
              <ContestantsSection 
                dareId={dare.publicKey.toString()}
                currentUserId={undefined} // TODO: Get from user context/auth
              />
            </div>

            {/* Right Column - Live Chat (3 columns) */}
            <div className="xl:col-span-3 xl:sticky xl:top-6 xl:self-start">
              <ChatRoom 
                dareId={dare.publicKey.toString()} 
                dareTitle={dare.account.title}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
