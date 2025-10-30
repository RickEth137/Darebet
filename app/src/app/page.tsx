'use client';

import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { DareCard } from '@/components/DareCard';
import { CreateDareModal } from '@/components/CreateDareModal';
import { WelcomeModal } from '@/components/WelcomeModal';
import { LoadingSpinner } from '@/components/CircularLoader';
import { useDareProgram } from '@/hooks/useDareProgram';
import { useUser } from '@/hooks/useUser';
import { Dare } from '@/types';

export default function HomePage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { program, getDares } = useDareProgram();
  const { user, isAuthenticated } = useUser();
  
  const [dares, setDares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Mock data for demonstration
  const createMockDares = (): Dare[] => {
    const mockPublicKey = new PublicKey('11111111111111111111111111111111');
    const now = Date.now() / 1000;
    
    return [
      {
        publicKey: mockPublicKey,
        account: {
          creator: mockPublicKey,
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
          title: "SHAVE HEAD AND EYEBROWS COMPLETELY",
          description: "COMPLETELY SHAVE OFF ALL HAIR INCLUDING EYEBROWS. MUST KEEP IT OFF FOR AT LEAST 30 DAYS. NO WIGS OR FAKE HAIR ALLOWED.\n\nRules:\n• Must shave head completely bald\n• Must remove all eyebrow hair\n• No wigs, hats, or fake hair for 30 days\n• Must document before/after with timestamps\n• Weekly progress photos required\n• No professional makeup to simulate hair",
          deadline: now + (3 * 24 * 60 * 60), // 3 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL (fixed minimum bet)
          totalPool: 8.9 * 1e9,
          willDoPool: 4.2 * 1e9,
          wontDoPool: 4.7 * 1e9,
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
          title: "WALK BACKWARDS FOR ENTIRE DAY",
          description: "WALK ONLY BACKWARDS FOR 24 HOURS STRAIGHT. NO FORWARD STEPS ALLOWED. DOCUMENT THE JOURNEY WITH CONTINUOUS VIDEO.\n\nRules:\n• Zero forward steps for full 24 hours\n• Must be recorded continuously or with timestamps\n• No assistance from others for navigation\n• Must complete normal daily activities backwards\n• Can use mirrors but no guides or helpers\n• Must document start and end times clearly",
          deadline: now + (10 * 24 * 60 * 60), // 10 days from now
          minBet: 0.05 * 1e9, // 0.05 SOL
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

  useEffect(() => {
    loadDares();
  }, [program]); // Load dares regardless of program availability

  const loadDares = async () => {
    try {
      if (program) {
        const fetchedDares = await getDares();
        setDares(fetchedDares);
      } else {
        // Use mock data when program is not available
        const mockDares = createMockDares();
        setDares(mockDares);
      }
    } catch (error) {
      console.error('Error loading dares:', error);
      // Fallback to mock data on error
      const mockDares = createMockDares();
      setDares(mockDares);
    } finally {
      setLoading(false);
    }
  };

  const handleDareCreated = () => {
    setShowCreateModal(false);
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
      ) : dares.length === 0 ? (
        <div className="text-center py-12 bg-anarchist-black border border-anarchist-red">
          <div className="text-6xl mb-4 text-anarchist-red font-brutal">[EMPTY]</div>
          <h2 className="text-xl font-semibold text-anarchist-red mb-4 font-brutal">
            NO ACTIVE DARES
          </h2>
          <p className="text-anarchist-offwhite mb-6 font-brutal">
            CREATE THE FIRST DARE AND START THE CHAOS
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dares.map((dare) => (
            <DareCard key={dare.publicKey.toString()} dare={dare} onUpdate={loadDares} />
          ))}
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
