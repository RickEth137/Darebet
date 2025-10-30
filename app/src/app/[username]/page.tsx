'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { BetCard } from '@/components/BetCard';

interface PublicUserData {
  id: string;
  walletAddress: string;
  username: string;
  bio: string | null;
  avatar: string | null;
  daresCreated: number;
  daresCompleted: number;
  totalBets: number;
  totalWinnings: number;
  createdAt: string;
  _count: {
    bets: number;
    proofSubmissions: number;
  };
}

interface UserDare {
  id: string;
  onChainId: string;
  title: string;
  description: string;
  logoUrl: string;
  deadline: string;
  minBet: number;
  isCompleted: boolean;
  createdAt: string;
  _count: {
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

export default function PublicUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useUser();
  
  const [profileUser, setProfileUser] = useState<PublicUserData | null>(null);
  const [userDares, setUserDares] = useState<UserDare[]>([]);
  const [userBets, setUserBets] = useState<UserBet[]>([]);
  const [activeTab, setActiveTab] = useState<'dares' | 'bets'>('dares');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const username = params?.username as string;

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const loadUserProfile = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Load user profile
      const userResponse = await fetch(`/api/users/${username}`);
      if (!userResponse.ok) {
        if (userResponse.status === 404) {
          setError('User not found');
        } else {
          throw new Error('Failed to load user profile');
        }
        return;
      }
      
      const userData = await userResponse.json();
      setProfileUser(userData.user);

      // Load user's dares and bets in parallel
      await Promise.all([
        loadUserDares(userData.user.walletAddress),
        loadUserBets(userData.user.walletAddress),
      ]);

    } catch (err) {
      console.error('Error loading user profile:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const loadUserDares = async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/dares?creator=${walletAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setUserDares(data.data);
      }
    } catch (error) {
      console.error('Error loading user dares:', error);
    }
  };

  const loadUserBets = async (walletAddress: string) => {
    try {
      const response = await fetch(`/api/bets?bettor=${walletAddress}`);
      const data = await response.json();
      
      if (data.success) {
        setUserBets(data.data);
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

  const isOwnProfile = currentUser && profileUser && currentUser.walletAddress === profileUser.walletAddress;

  const activeBets = userBets.filter(bet => {
    const deadline = new Date(bet.dare.deadline);
    return !bet.dare.isCompleted && Date.now() < deadline.getTime() && !bet.isClaimed;
  });

  const completedBets = userBets.filter(bet => {
    const deadline = new Date(bet.dare.deadline);
    return bet.dare.isCompleted || Date.now() >= deadline.getTime() || bet.isClaimed || bet.isEarlyCashOut;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-8 bg-gray-200 rounded w-40 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-anarchist-red text-6xl mb-4 font-brutal">[USER NOT FOUND]</div>
            <h1 className="text-2xl font-bold text-yellow-900 mb-2">User Not Found</h1>
            <p className="text-yellow-700 mb-6">
              {error || `The user @${username} does not exist or hasn't set up their profile yet.`}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Browse Dares
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              {/* Avatar */}
              {profileUser.avatar ? (
                <img 
                  src={profileUser.avatar} 
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <img 
                  src="/default-avatar.jpg" 
                  alt="Profile" 
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              )}
              
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    @{profileUser.username}
                  </h1>
                  {isOwnProfile && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full font-medium">
                      Your Profile
                    </span>
                  )}
                </div>
                <p className="text-gray-500 font-mono text-sm mb-2">
                  {formatAddress(profileUser.walletAddress)}
                </p>
                <p className="text-gray-500 text-sm">
                  Member since {formatDate(profileUser.createdAt)}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => router.push('/profile')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Bio */}
          {profileUser.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-gray-700 text-lg">{profileUser.bio}</p>
            </div>
          )}

          {/* Stats Grid */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600">{userDares.length}</div>
                <div className="text-sm text-anarchist-white font-medium">Dares Created</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{userBets.length}</div>
                <div className="text-sm text-anarchist-white font-medium">Total Bets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{activeBets.length}</div>
                <div className="text-sm text-anarchist-white font-medium">Active Bets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{profileUser.totalWinnings.toFixed(2)}</div>
                <div className="text-sm text-anarchist-white font-medium">Total Winnings (SOL)</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('dares')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'dares'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Created Dares ({userDares.length})
              </button>
              <button
                onClick={() => setActiveTab('bets')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'bets'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Public Bets ({userBets.length})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Dares Tab */}
            {activeTab === 'dares' && (
              <div>
                {userDares.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4 text-anarchist-red font-brutal">[NO BETS]</div>
                    <h3 className="text-xl font-semibold text-anarchist-red mb-2">
                      No dares created yet
                    </h3>
                    <p className="text-anarchist-white">
                      {isOwnProfile 
                        ? "Create your first dare to get started!" 
                        : `@${profileUser.username} hasn't created any dares yet.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userDares.map((dare) => (
                      <div key={dare.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-primary-200 transition-colors">
                        <div className="flex items-center space-x-3 mb-3">
                          <img 
                            src={dare.logoUrl} 
                            alt="Dare logo"
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 line-clamp-1">{dare.title}</h4>
                            <p className="text-sm text-gray-500">
                              {formatDate(dare.createdAt)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            dare.isCompleted 
                              ? 'bg-green-100 text-green-700' 
                              : Date.now() > new Date(dare.deadline).getTime()
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {dare.isCompleted 
                              ? 'Completed' 
                              : Date.now() > new Date(dare.deadline).getTime()
                              ? 'Expired'
                              : 'Active'
                            }
                          </span>
                        </div>
                        
                        <p className="text-anarchist-white text-sm mb-3 line-clamp-2">
                          {dare.description}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-2 text-center mb-3">
                          <div>
                            <div className="text-sm font-semibold text-blue-600">
                              {dare._count.bets}
                            </div>
                            <div className="text-xs text-gray-500">Bets</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-green-600">
                              {dare._count.proofSubmissions}
                            </div>
                            <div className="text-xs text-gray-500">Proofs</div>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-purple-600">
                              {dare.minBet}
                            </div>
                            <div className="text-xs text-gray-500">Min SOL</div>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => router.push(`/dare/${dare.onChainId}`)}
                          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        >
                          View Details
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
                {userBets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <h3 className="text-xl font-semibold text-anarchist-red mb-2">
                      No bets placed yet
                    </h3>
                    <p className="text-anarchist-white">
                      {isOwnProfile 
                        ? "Place your first bet to get started!" 
                        : `@${profileUser.username} hasn't placed any bets yet.`
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userBets.map((bet) => (
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
        </div>
      </div>
    </div>
  );
}