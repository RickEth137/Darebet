'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PublicKey } from '@solana/web3.js';
import { useDareProgram } from '@/hooks/useDareProgram';
import { DareCard } from '@/components/DareCard';
import { ProofSubmissionsList } from '@/components/ProofSubmissionsList';
import { DareProgressChart } from '@/components/DareProgressChart';
import { BetFeed } from '@/components/BetFeed';
import { ChatRoom } from '@/components/ChatRoom';
import ContestantsSection from '@/components/dare/ContestantsSection';
import { Dare } from '@/types';

export default function DareDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { fetchDare } = useDareProgram();
  
  const [dare, setDare] = useState<Dare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dareId = params?.id as string;

  useEffect(() => {
    if (dareId) {
      loadDare();
    }
  }, [dareId]);

  const loadDare = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First check if this is a demo dare (try to get it from the mock data)
      const demoDares = getMockDares();
      const demoDare = demoDares.find(d => d.publicKey.toString() === dareId);
      
      if (demoDare) {
        setDare(demoDare);
        return;
      }
      
      // If not a demo dare, try to fetch from blockchain
      try {
        const darePublicKey = new PublicKey(dareId);
        const dareData = await fetchDare(darePublicKey);
        
        if (dareData) {
          setDare(dareData);
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

  // Mock data function (same as homepage)
  const getMockDares = () => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    const now = Math.floor(Date.now() / 1000);
    
    return [
      {
        publicKey: mockPublicKey,
        account: {
          creator: mockPublicKey,
          platformAuthority: mockPublicKey,
          title: "EAT 10 GHOST PEPPERS IN 5 MINUTES",
          description: "I DARE YOU TO CONSUME 10 CAROLINA REAPER GHOST PEPPERS WITHIN 5 MINUTES WITHOUT DRINKING ANYTHING. RECORD THE ENTIRE PROCESS.\n\nRules:\n• Must consume 10 full Carolina Reaper peppers\n• Time limit is strictly 5 minutes\n• No liquids allowed during or 10 minutes after\n• Must be recorded in one continuous take\n• Face must be visible throughout recording\n• Must show peppers before consumption\n• Timer must be visible in video",
          deadline: now + (7 * 24 * 60 * 60), // 7 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL (fixed minimum bet)
          totalPool: 2.5 * 1e9,
          willDoPool: 1.2 * 1e9,
          wontDoPool: 1.3 * 1e9,
          isCompleted: false,
          isExpired: false,
          creatorFeeClaimed: false,
          logoUrl: "https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq",
          bump: 1,
        }
      },
      {
        publicKey: mockPublicKey,
        account: {
          creator: mockPublicKey,
          platformAuthority: mockPublicKey,
          title: "SLEEP IN A CEMETERY FOR 24 HOURS",
          description: "SPEND AN ENTIRE NIGHT AND DAY IN A GRAVEYARD. NO LEAVING THE PREMISES. DOCUMENT WITH TIMESTAMPS EVERY 2 HOURS.\n\nRules:\n• Must stay within cemetery boundaries for full 24 hours\n• No leaving for any reason including bathroom breaks\n• Must document with timestamp every 2 hours\n• Must record entry and exit times\n• No assistance from others during the challenge\n• Must show cemetery sign/name in initial recording",
          deadline: now + (14 * 24 * 60 * 60), // 14 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL (fixed minimum bet)
          totalPool: 5.7 * 1e9,
          willDoPool: 2.1 * 1e9,
          wontDoPool: 3.6 * 1e9,
          isCompleted: false,
          isExpired: false,
          creatorFeeClaimed: false,
          logoUrl: "https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq",
          bump: 1,
        }
      },
      {
        publicKey: mockPublicKey,
        account: {
          creator: mockPublicKey,
          platformAuthority: mockPublicKey,
          title: "SHAVE HEAD AND EYEBROWS COMPLETELY",
          description: "COMPLETELY SHAVE OFF ALL HAIR INCLUDING EYEBROWS. MUST KEEP IT OFF FOR AT LEAST 30 DAYS. NO WIGS OR FAKE HAIR ALLOWED.\n\nRules:\n• Must shave head completely bald\n• Must remove all eyebrow hair\n• No wigs, hats, or fake hair for 30 days\n• Must document before/after with timestamps\n• Weekly progress photos required\n• No professional makeup to simulate hair",
          deadline: now + (3 * 24 * 60 * 60), // 3 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL (fixed minimum bet)
          totalPool: 8.9 * 1e9,
          willDoPool: 5.1 * 1e9,
          wontDoPool: 3.8 * 1e9,
          isCompleted: false,
          isExpired: false,
          creatorFeeClaimed: false,
          logoUrl: "https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq",
          bump: 1,
        }
      },
      {
        publicKey: mockPublicKey,
        account: {
          creator: mockPublicKey,
          platformAuthority: mockPublicKey,
          title: "WALK BACKWARDS FOR 24 HOURS",
          description: "WALK ONLY BACKWARDS FOR 24 HOURS STRAIGHT. NO FORWARD STEPS ALLOWED. DOCUMENT THE JOURNEY WITH CONTINUOUS VIDEO.\n\nRules:\n• Zero forward steps for full 24 hours\n• Must be recorded continuously or with timestamps\n• No assistance from others for navigation\n• Must complete normal daily activities backwards\n• Can use mirrors but no guides or helpers\n• Must document start and end times clearly",
          deadline: now + (10 * 24 * 60 * 60), // 10 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL (fixed minimum bet)
          totalPool: 1.8 * 1e9,
          willDoPool: 0.9 * 1e9,
          wontDoPool: 0.9 * 1e9,
          isCompleted: false,
          isExpired: false,
          creatorFeeClaimed: false,
          logoUrl: "https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq",
          bump: 1,
        }
      },
      {
        publicKey: mockPublicKey,
        account: {
          creator: mockPublicKey,
          platformAuthority: mockPublicKey,
          title: "EAT NOTHING BUT MAYO FOR 3 DAYS",
          description: "CONSUME ONLY MAYONNAISE FOR 72 HOURS. NO OTHER FOOD OR DRINKS EXCEPT WATER. MUST BE DOCUMENTED WITH MEAL TIMESTAMPS.",
          deadline: now + (5 * 24 * 60 * 60), // 5 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL (fixed minimum bet)
          totalPool: 3.4 * 1e9,
          willDoPool: 1.8 * 1e9,
          wontDoPool: 1.6 * 1e9,
          isCompleted: false,
          isExpired: false,
          creatorFeeClaimed: false,
          logoUrl: "https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq",
          bump: 1,
        }
      },
      {
        publicKey: mockPublicKey,
        account: {
          creator: mockPublicKey,
          platformAuthority: mockPublicKey,
          title: "TALK LIKE PIRATE FOR ONE MONTH",
          description: "SPEAK ONLY IN PIRATE LANGUAGE FOR 30 CONSECUTIVE DAYS. MUST BE MAINTAINED IN ALL CONVERSATIONS, WORK, AND PUBLIC INTERACTIONS.",
          deadline: now + (2 * 24 * 60 * 60), // 2 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL (fixed minimum bet)
          totalPool: 6.2 * 1e9,
          willDoPool: 3.7 * 1e9,
          wontDoPool: 2.5 * 1e9,
          isCompleted: false,
          isExpired: false,
          creatorFeeClaimed: false,
          logoUrl: "https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq",
          bump: 1,
        }
      }
    ];
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
              <button
                onClick={() => router.push('/')}
                className="bg-anarchist-charcoal hover:bg-gray-700 text-anarchist-offwhite px-6 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-charcoal"
              >
                Back to Home
              </button>
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
            <button
              onClick={() => router.push('/')}
              className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red"
            >
              Back to Home
            </button>
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
            <button
              onClick={() => router.push('/')}
              className="flex items-center text-anarchist-offwhite hover:text-anarchist-red transition-colors font-brutal uppercase tracking-wider"
            >
              <span className="mr-2">←</span>
              Back to All Dares
            </button>
          </div>

          {/* Main Content - Three Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left Column - Progress Chart and Bet Feed (3 columns) */}
            <div className="xl:col-span-3 space-y-6">
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