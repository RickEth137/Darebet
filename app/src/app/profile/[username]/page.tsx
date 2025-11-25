'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { WelcomeModal } from '@/components/WelcomeModal';
import UserProofSubmissions from '@/components/profile/UserProofSubmissions';

interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  bio?: string;
  avatar?: string;
  banner?: string;
  daresCreated: number;
  daresCompleted: number;
  totalBets: number;
  totalWinnings: number;
  createdAt: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useUser();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const username = params?.username as string;

  // Redirect to new URL if current user's username changes
  useEffect(() => {
    if (currentUser && profile && currentUser.walletAddress === profile.walletAddress) {
      // This is the current user's profile
      if (currentUser.username && currentUser.username !== username) {
        // Username has changed, redirect to new URL
        router.push(`/profile/${currentUser.username}`);
      }
    }
  }, [currentUser, profile, username, router]);

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/users/profile/${username}`);
      const data = await response.json();
      
      if (data.success) {
        setProfile(data.user);
      } else {
        setError(data.error || 'User not found');
      }
    } catch (err) {
      console.error('Error loading user profile:', err);
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-anarchist-charcoal rounded w-1/4 mb-6"></div>
            <div className="bg-anarchist-black border-2 border-anarchist-red rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-anarchist-charcoal rounded-full border-2 border-anarchist-red"></div>
                <div>
                  <div className="h-6 bg-anarchist-charcoal rounded w-32 mb-2"></div>
                  <div className="h-4 bg-anarchist-charcoal rounded w-24"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-anarchist-charcoal rounded border border-anarchist-red"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-anarchist-black border-2 border-anarchist-red rounded-lg p-8 text-center">
            <div className="text-anarchist-red text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-brutal font-bold text-anarchist-red mb-2">USER NOT FOUND</h1>
            <p className="text-anarchist-offwhite mb-6 font-brutal">
              {error || 'THE USER PROFILE YOU\'RE LOOKING FOR DOESN\'T EXIST.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-6 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red"
            >
              BACK TO HOME
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.walletAddress === profile.walletAddress;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/')}
            className="flex items-center text-anarchist-offwhite hover:text-anarchist-red transition-colors font-brutal uppercase tracking-wider"
          >
            <span className="mr-2">←</span>
            Back to Dares
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-anarchist-black border-2 border-anarchist-red shadow-lg overflow-hidden mb-6">
          {/* Banner */}
          <div className="h-48 w-full bg-anarchist-charcoal relative">
            {profile.banner ? (
              <img 
                src={profile.banner} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-anarchist-charcoal flex items-center justify-center">
                <span className="text-anarchist-gray font-brutal text-sm">NO BANNER</span>
              </div>
            )}
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between -mt-16 mb-6">
              <div className="flex items-end space-x-4">
                {/* Avatar */}
                {profile.avatar ? (
                  <img 
                    src={profile.avatar} 
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-anarchist-black shadow-lg bg-anarchist-black"
                  />
                ) : (
                  <div className="w-32 h-32 bg-anarchist-red rounded-full flex items-center justify-center text-anarchist-black text-4xl font-bold border-4 border-anarchist-black shadow-lg font-brutal">
                    {profile.username ? profile.username[0].toUpperCase() : '👤'}
                  </div>
                )}
                
                <div className="mb-2 pt-16">
                  <h1 className="text-2xl font-brutal font-bold text-anarchist-offwhite uppercase tracking-wider">
                    {profile.username || 'ANONYMOUS USER'}
                  </h1>
                  <p className="text-anarchist-red font-brutal text-sm">
                    {formatAddress(profile.walletAddress)}
                  </p>
                  <p className="text-anarchist-gray text-xs font-brutal uppercase mt-1">
                    JOINED {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-16">
                {isOwnProfile && (
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="bg-anarchist-red hover:bg-red-700 text-anarchist-black px-4 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red"
                  >
                    EDIT PROFILE
                  </button>
                )}
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div className="mt-4 pt-4 border-t border-anarchist-charcoal">
                <h3 className="font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">BIO</h3>
                <p className="text-anarchist-offwhite font-brutal text-sm">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-anarchist-black border border-anarchist-red p-6 text-center">
            <div className="text-3xl font-brutal font-bold text-anarchist-red mb-2">
              {profile.daresCreated}
            </div>
            <div className="text-xs text-anarchist-offwhite font-brutal uppercase tracking-wider">DARES CREATED</div>
          </div>

          <div className="bg-anarchist-black border border-anarchist-red p-6 text-center">
            <div className="text-3xl font-brutal font-bold text-green-600 mb-2">
              {profile.daresCompleted}
            </div>
            <div className="text-xs text-anarchist-offwhite font-brutal uppercase tracking-wider">DARES COMPLETED</div>
          </div>

          <div className="bg-anarchist-black border border-anarchist-red p-6 text-center">
            <div className="text-3xl font-brutal font-bold text-blue-500 mb-2">
              {profile.totalBets}
            </div>
            <div className="text-xs text-anarchist-offwhite font-brutal uppercase tracking-wider">TOTAL BETS</div>
          </div>

          <div className="bg-anarchist-black border border-anarchist-red p-6 text-center">
            <div className="text-3xl font-brutal font-bold text-yellow-500 mb-2">
              {profile.totalWinnings.toFixed(2)}
            </div>
            <div className="text-xs text-anarchist-offwhite font-brutal uppercase tracking-wider">SOL WON</div>
          </div>
        </div>

        {/* User Proof Submissions */}
        <div className="mb-6">
          <UserProofSubmissions 
            username={username}
            currentUserId={currentUser?.id}
            showTitle={true}
          />
        </div>

        {/* Recent Activity */}
        <div className="bg-anarchist-black border-2 border-anarchist-red p-6">
          <h2 className="text-xl font-brutal font-bold text-anarchist-red mb-4 uppercase tracking-wider">RECENT ACTIVITY</h2>
          <div className="text-center py-8 text-anarchist-gray">
            <div className="text-4xl mb-2">📊</div>
            <p className="font-brutal uppercase tracking-wider text-sm">ACTIVITY FEED COMING SOON...</p>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isOwnProfile && (
          <WelcomeModal 
            isOpen={showEditModal} 
            onClose={async () => {
              setShowEditModal(false);
              // Reload profile after edit
              await loadUserProfile();
            }} 
          />
        )}
      </div>
    </div>
  );
}