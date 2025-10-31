'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { useDareProgram } from '@/hooks/useDareProgram';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { DareCard } from '@/components/DareCard';
import { BetCard } from '@/components/BetCard';
import { WelcomeModal } from '@/components/WelcomeModal';

interface UserDare {
  id: string;
  onChainId: string;
  title: string;
  description: string;
  logoUrl?: string;
  bannerUrl?: string;
  deadline: string;
  minBet: number;
  createdAt: string;
  _count?: {
    bets: number;
    proofSubmissions: number;
  };
}

interface UserBet {
  id: string;
  onChainId: string;
  amount: number;
  betType: 'WILL_DO' | 'WONT_DO';
  isClaimed: boolean;
  isEarlyCashOut: boolean;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  dare: {
    title: string;
    onChainId: string;
    deadline: string;
    isCompleted: boolean;
    logoUrl?: string;
  };
  user: {
    username: string | null;
    walletAddress: string;
  };
  likes: {
    userWallet: string;
  }[];
}

export default function ProfilePage() {
  const { user, isAuthenticated, loading: userLoading } = useUser();
  const { connected, publicKey, connecting } = useWallet();
  const { getDares } = useDareProgram();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'dares' | 'bets'>('dares');
  const [betSubTab, setBetSubTab] = useState<'active' | 'finalized'>('active');
  const [userDares, setUserDares] = useState<UserDare[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    console.log('Profile page: useEffect triggered', { 
      userLoading, 
      isAuthenticated, 
      user: !!user, 
      connected,
      publicKey: publicKey?.toString(),
      connecting 
    });
    
    if (!userLoading && !connecting) {
      // Only redirect if definitely not connected and not connecting
      if (!user && !connected) {
        console.log('Profile page: No user and not connected, redirecting to home');
        router.push('/');
        return;
      }
      
      if (user) {
        console.log('Profile page: User found, loading user data');
        loadUserData();
      } else if (connected && publicKey) {
        console.log('Profile page: Connected but no user yet, waiting for auto-registration...');
        // Keep loading state while user is being created/fetched
        setLoading(true);
      } else {
        console.log('Profile page: Setting loading to false');
        setLoading(false);
      }
    }
  }, [userLoading, isAuthenticated, user, connected, publicKey, connecting]);

  const loadUserData = async () => {
    if (!user) return;
    
    console.log('Profile page: Starting to load user data for:', user.walletAddress);
    setLoading(true);
    try {
      console.log('Profile page: About to fetch dares and bets');
      await Promise.all([
        loadUserDares(),
        loadUserBets(),
      ]);
      console.log('Profile page: Successfully loaded user data');
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      console.log('Profile page: Setting loading to false');
      setLoading(false);
    }
  };

  const loadUserDares = async () => {
    if (!user) return;
    
    try {
      console.log('Profile page: Fetching dares for:', user.walletAddress);
      const response = await fetch(`/api/dares?creator=${user.walletAddress}`);
      console.log('Profile page: Dares response status:', response.status);
      const data = await response.json();
      console.log('Profile page: Dares data received:', data);
      
      if (data.success) {
        setUserDares(data.data);
        console.log('Profile page: Set user dares:', data.data.length, 'dares');
      }
    } catch (error) {
      console.error('Error loading user dares:', error);
    }
  };

  const loadUserBets = async () => {
    if (!user) return;
    
    try {
      console.log('Profile page: Fetching bets for:', user.walletAddress);
      const response = await fetch(`/api/bets?bettor=${user.walletAddress}`);
      console.log('Profile page: Bets response status:', response.status);
      const data = await response.json();
      console.log('Profile page: Bets data received:', data);
      
      if (data.success) {
        setUserBets(data.data);
        console.log('Profile page: Set user bets:', data.data.length, 'bets');
      }
    } catch (error) {
      console.error('Error loading user bets:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const activeBets = userBets.filter(bet => {
    const deadline = new Date(bet.dare.deadline);
    return !bet.dare.isCompleted && Date.now() < deadline.getTime() && !bet.isClaimed;
  });

  const finalizedBets = userBets.filter(bet => {
    const deadline = new Date(bet.dare.deadline);
    return bet.dare.isCompleted || Date.now() >= deadline.getTime() || bet.isClaimed || bet.isEarlyCashOut;
  });

  if (userLoading || loading || (connected && !user && !userLoading)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-yellow-400 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-yellow-900 mb-2">Profile Unavailable</h1>
            <p className="text-yellow-700 mb-6">
              Please connect your wallet and complete the setup to view your profile.
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header with Banner */}
        <div className="bg-anarchist-black border-2 border-anarchist-red rounded-lg overflow-hidden mb-6">
          {/* Banner Section */}
          <div className="relative h-48 bg-gradient-to-r from-anarchist-charcoal to-anarchist-black border-b-2 border-anarchist-red">
            {user.avatar ? (
              <div className="w-full h-full bg-gradient-to-br from-anarchist-red/20 to-anarchist-charcoal flex items-center justify-center relative">
                <div className="text-anarchist-red text-6xl font-brutal font-bold opacity-30">
                  DARE BETS
                </div>
                <img 
                  src={user.avatar} 
                  alt="Profile Banner"
                  className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-anarchist-red/20 to-anarchist-charcoal flex items-center justify-center">
                <div className="text-anarchist-red text-6xl font-brutal font-bold opacity-30">
                  DARE BETS
                </div>
              </div>
            )}
            
            {/* Profile Picture Overlapping Banner */}
            <div className="absolute -bottom-16 left-6">
              {user.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile"
                  className="w-32 h-32 object-cover border-4 border-anarchist-red bg-anarchist-black"
                />
              ) : (
                <div className="w-32 h-32 bg-anarchist-red border-4 border-anarchist-red flex items-center justify-center text-anarchist-black text-4xl font-brutal font-bold">
                  {user.username ? user.username[0].toUpperCase() : 'U'}
                </div>
              )}
            </div>

            {/* Edit Profile Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() => setShowWelcome(true)}
                className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-4 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
              >
                EDIT PROFILE
              </button>
            </div>
          </div>

          {/* Profile Info Section */}
          <div className="pt-20 pb-6 px-6">
            <div className="mb-4">
              <h1 className="text-3xl font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">
                {user.username || 'ANONYMOUS USER'}
              </h1>
              <p className="text-anarchist-white font-mono text-sm mb-1">
                WALLET: {formatAddress(user.walletAddress)}
              </p>
              <p className="text-anarchist-offwhite text-sm font-brutal">
                MEMBER SINCE {formatDate(user.createdAt).toUpperCase()}
              </p>
            </div>

            {/* Bio Section */}
            {user.bio && (
              <div className="mb-4 p-4 border-l-4 border-anarchist-red bg-anarchist-charcoal/30">
                <h3 className="font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">BIO</h3>
                <p className="text-anarchist-white font-brutal leading-relaxed">
                  {user.bio}
                </p>
              </div>
            )}

            {/* User Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center p-3 border border-anarchist-red bg-anarchist-charcoal/20">
                <div className="text-2xl font-brutal font-bold text-anarchist-red">
                  {userDares.length}
                </div>
                <div className="text-sm text-anarchist-white font-brutal uppercase tracking-wider">Dares Created</div>
              </div>
              <div className="text-center p-3 border border-anarchist-red bg-anarchist-charcoal/20">
                <div className="text-2xl font-brutal font-bold text-anarchist-red">
                  {activeBets.length}
                </div>
                <div className="text-sm text-anarchist-white font-brutal uppercase tracking-wider">Active Bets</div>
              </div>
              <div className="text-center p-3 border border-anarchist-red bg-anarchist-charcoal/20">
                <div className="text-2xl font-brutal font-bold text-anarchist-red">
                  {userBets.length}
                </div>
                <div className="text-sm text-anarchist-white font-brutal uppercase tracking-wider">Total Bets</div>
              </div>
              <div className="text-center p-3 border border-anarchist-red bg-anarchist-charcoal/20">
                <div className="text-2xl font-brutal font-bold text-anarchist-red">
                  {/* Calculate total SOL earned from winning bets */}
                  {finalizedBets
                    .filter(bet => {
                      // A bet is won if:
                      // - WILL_DO bet and dare is completed
                      // - WONT_DO bet and dare is not completed (past deadline)
                      const isCompleted = bet.dare.isCompleted;
                      const isPastDeadline = new Date(bet.dare.deadline) < new Date();
                      
                      if (bet.betType === 'WILL_DO') {
                        return isCompleted;
                      } else {
                        return !isCompleted && isPastDeadline;
                      }
                    })
                    .reduce((total, bet) => total + (bet.amount || 0), 0)
                    .toFixed(2)} SOL
                </div>
                <div className="text-sm text-anarchist-white font-brutal uppercase tracking-wider">Total Earned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="bg-anarchist-black border-2 border-anarchist-red rounded-lg overflow-hidden">
          <div className="border-b-2 border-anarchist-red">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('dares')}
                className={`px-6 py-4 text-sm font-brutal font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === 'dares'
                    ? 'border-anarchist-red text-anarchist-red bg-anarchist-charcoal/50'
                    : 'border-transparent text-anarchist-white hover:text-anarchist-red hover:bg-anarchist-charcoal/30'
                }`}
              >
                MY DARES ({userDares.length})
              </button>
              <button
                onClick={() => setActiveTab('bets')}
                className={`px-6 py-4 text-sm font-brutal font-bold uppercase tracking-wider border-b-2 transition-colors ${
                  activeTab === 'bets'
                    ? 'border-anarchist-red text-anarchist-red bg-anarchist-charcoal/50'
                    : 'border-transparent text-anarchist-white hover:text-anarchist-red hover:bg-anarchist-charcoal/30'
                }`}
              >
                MY BETS ({userBets.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Dares Tab */}
            {activeTab === 'dares' && (
              <div>
                {userDares.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 text-anarchist-red font-brutal">⚡</div>
                    <h3 className="text-xl font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                      NO DARES CREATED YET
                    </h3>
                    <p className="text-anarchist-white mb-6 font-brutal">
                      CREATE YOUR FIRST DARE AND CHALLENGE OTHERS TO COMPLETE IT!
                    </p>
                    <button
                      onClick={() => router.push('/create')}
                      className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
                    >
                      CREATE YOUR FIRST DARE
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userDares.map((dare) => (
                      <div key={dare.id} className="bg-anarchist-charcoal border-2 border-anarchist-red rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          <img 
                            src={dare.logoUrl || 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy'} 
                            alt="Dare logo"
                            className="w-10 h-10 border border-anarchist-red object-cover"
                          />
                          <div>
                            <h4 className="font-brutal font-bold text-anarchist-red uppercase tracking-wider">{dare.title}</h4>
                            <p className="text-sm text-anarchist-white font-brutal">
                              CREATED {formatDate(dare.createdAt).toUpperCase()}
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-anarchist-white text-sm mb-3 line-clamp-2 font-brutal">
                          {dare.description}
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 text-center mb-3">
                          <div className="border border-anarchist-red bg-anarchist-black/50 p-2">
                            <div className="text-lg font-brutal font-bold text-anarchist-red">
                              {dare._count?.bets || 0}
                            </div>
                            <div className="text-xs text-anarchist-white font-brutal uppercase">Bets</div>
                          </div>
                          <div className="border border-anarchist-red bg-anarchist-black/50 p-2">
                            <div className="text-lg font-brutal font-bold text-anarchist-red">
                              {dare._count?.proofSubmissions || 0}
                            </div>
                            <div className="text-xs text-anarchist-white font-brutal uppercase">Proofs</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/dare/${dare.onChainId}`)}
                          className="w-full bg-anarchist-red hover:bg-red-700 text-anarchist-black py-2 px-4 text-sm font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
                        >
                          VIEW DETAILS
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Bets Tab */}
            {activeTab === 'bets' && (
              <div>
                {/* Bet Sub-tabs */}
                <div className="mb-6">
                  <nav className="flex space-x-1 bg-anarchist-charcoal border-2 border-anarchist-red rounded-lg p-1">
                    <button
                      onClick={() => setBetSubTab('active')}
                      className={`flex-1 px-4 py-2 text-sm font-brutal font-bold uppercase tracking-wider transition-colors ${
                        betSubTab === 'active'
                          ? 'bg-anarchist-red text-anarchist-black'
                          : 'text-anarchist-white hover:text-anarchist-red hover:bg-anarchist-charcoal/50'
                      }`}
                    >
                      ACTIVE BETS ({activeBets.length})
                    </button>
                    <button
                      onClick={() => setBetSubTab('finalized')}
                      className={`flex-1 px-4 py-2 text-sm font-brutal font-bold uppercase tracking-wider transition-colors ${
                        betSubTab === 'finalized'
                          ? 'bg-anarchist-red text-anarchist-black'
                          : 'text-anarchist-white hover:text-anarchist-red hover:bg-anarchist-charcoal/50'
                      }`}
                    >
                      FINALIZED BETS ({finalizedBets.length})
                    </button>
                  </nav>
                </div>

                {/* Active Bets */}
                {betSubTab === 'active' && (
                  <div>
                    {activeBets.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4 text-anarchist-red font-brutal">📊</div>
                        <h3 className="text-xl font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                          NO ACTIVE BETS
                        </h3>
                        <p className="text-anarchist-white mb-6 font-brutal">
                          BROWSE DARES AND PLACE YOUR FIRST BET!
                        </p>
                        <button
                          onClick={() => router.push('/')}
                          className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2 font-brutal font-bold uppercase tracking-wider border-2 border-anarchist-red transition-colors"
                        >
                          BROWSE DARES
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {activeBets.map((bet) => (
                          <BetCard 
                            key={bet.id} 
                            bet={bet} 
                            showSocialActions={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Finalized Bets */}
                {betSubTab === 'finalized' && (
                  <div>
                    {finalizedBets.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-6xl mb-4 text-anarchist-red font-brutal">📈</div>
                        <h3 className="text-xl font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">
                          NO FINALIZED BETS YET
                        </h3>
                        <p className="text-anarchist-white font-brutal">
                          YOUR COMPLETED, EXPIRED, OR CASHED-OUT BETS WILL APPEAR HERE.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {finalizedBets.map((bet) => (
                          <BetCard 
                            key={bet.id} 
                            bet={bet} 
                            showSocialActions={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Welcome Modal for Profile Editing */}
        <WelcomeModal 
          isOpen={showWelcome} 
          onClose={() => setShowWelcome(false)} 
        />
      </div>
    </div>
  );
}
