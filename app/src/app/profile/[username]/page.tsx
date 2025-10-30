'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import UserProofSubmissions from '@/components/profile/UserProofSubmissions';

interface UserProfile {
  id: string;
  walletAddress: string;
  username?: string;
  bio?: string;
  avatar?: string;
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

  const username = params.username as string;

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
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div>
                  <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-400 text-6xl mb-4">👤</div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">User Not Found</h1>
            <p className="text-red-700 mb-6">
              {error || 'The user profile you\'re looking for doesn\'t exist.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Home
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
            className="flex items-center text-anarchist-white hover:text-anarchist-red transition-colors"
          >
            <span className="mr-2">←</span>
            Back to Dares
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {/* Avatar */}
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.username ? profile.username[0].toUpperCase() : '👤'}
              </div>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.username || 'Anonymous User'}
                </h1>
                <p className="text-gray-500 font-mono text-sm">
                  {formatAddress(profile.walletAddress)}
                </p>
                <p className="text-gray-500 text-sm">
                  Joined {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>

            {isOwnProfile && (
              <button
                onClick={() => router.push('/profile/edit')}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Edit Profile
              </button>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Bio</h3>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {profile.daresCreated}
            </div>
            <div className="text-sm text-anarchist-white">Dares Created</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-success-600 mb-2">
              {profile.daresCompleted}
            </div>
            <div className="text-sm text-anarchist-white">Dares Completed</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {profile.totalBets}
            </div>
            <div className="text-sm text-anarchist-white">Total Bets</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {profile.totalWinnings.toFixed(2)}
            </div>
            <div className="text-sm text-anarchist-white">SOL Won</div>
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-anarchist-red mb-4">Recent Activity</h2>
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>Activity feed coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}