'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { formatDistanceToNow } from 'date-fns';

interface BetCardProps {
  bet: {
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
      avatar?: string | null;
    };
    likes?: {
      userWallet: string;
    }[];
  };
  showSocialActions?: boolean;
  compact?: boolean;
}

export function BetCard({ bet, showSocialActions = true, compact = false }: BetCardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [userHasLiked, setUserHasLiked] = useState(
    bet.likes?.some(like => like.userWallet === user?.walletAddress) || false
  );
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(bet.likesCount);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated || !user || likingInProgress) return;

    setLikingInProgress(true);
    try {
      const response = await fetch(`/api/bets/${bet.onChainId}/like`, {
        method: userHasLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: user.walletAddress,
        }),
      });

      if (response.ok) {
        setUserHasLiked(!userHasLiked);
        setLocalLikesCount(prev => userHasLiked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleShare = async (platform: 'twitter' | 'copy') => {
    const url = `${window.location.origin}/bet/${bet.onChainId}`;
    const text = `Check out this bet: ${bet.user.username || 'Someone'} bet ${bet.amount} SOL that they ${bet.betType === 'WILL_DO' ? 'WILL' : "WON'T"} complete "${bet.dare.title}"!`;

    if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        prompt('Copy this link:', url);
      }
    }

    // Track share
    try {
      await fetch(`/api/bets/${bet.onChainId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform })
      });
    } catch (error) {
      console.error('Error tracking share:', error);
    }

    setShowShareMenu(false);
  };

  const getBetStatus = () => {
    const deadline = new Date(bet.dare.deadline);
    const isExpired = Date.now() > deadline.getTime();
    
    if (bet.isClaimed) return { text: 'Claimed', color: 'bg-blue-100 text-blue-700' };
    if (bet.isEarlyCashOut) return { text: 'Cashed Out', color: 'bg-yellow-100 text-yellow-700' };
    if (bet.dare.isCompleted) return { text: 'Completed', color: 'bg-green-100 text-green-700' };
    if (isExpired) return { text: 'Expired', color: 'bg-gray-100 text-gray-700' };
    return { text: 'Active', color: 'bg-blue-100 text-blue-700' };
  };

  const status = getBetStatus();

  if (compact) {
    return (
      <div 
        className="bg-white rounded-lg p-4 border border-gray-200 hover:border-primary-200 transition-all cursor-pointer hover:shadow-md"
        onClick={() => router.push(`/bet/${bet.onChainId}`)}
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">{bet.dare.title}</h4>
            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
              <span>{bet.amount} SOL</span>
              <span>•</span>
              <span className={bet.betType === 'WILL_DO' ? 'text-green-600' : 'text-red-600'}>
                {bet.betType === 'WILL_DO' ? 'Will Do' : "Won't Do"}
              </span>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
            {status.text}
          </span>
        </div>

        {showSocialActions && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-3 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{localLikesCount}</span>
              </span>
              <span className="flex items-center space-x-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{bet.commentsCount}</span>
              </span>
            </div>
            <span className="text-xs text-gray-400">{formatDate(bet.createdAt)}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-anarchist-black border-2 border-anarchist-red hover:border-anarchist-darkred transition-all">
      <div 
        className="p-6 cursor-pointer"
        onClick={() => router.push(`/bet/${bet.onChainId}`)}
      >
        {/* Header with Dare Info */}
        <div className="flex items-start space-x-4 mb-4">
          {bet.dare.logoUrl && (
            <img 
              src={bet.dare.logoUrl} 
              alt="Dare logo"
              className="w-12 h-12 object-cover border border-anarchist-red"
            />
          )}
          <div className="flex-1">
            <h3 className="font-brutal font-bold text-anarchist-red mb-1 line-clamp-2 uppercase tracking-wider">{bet.dare.title}</h3>
            <div className="flex items-center space-x-2 text-sm text-anarchist-offwhite font-brutal">
              <span>DEADLINE: {new Date(bet.dare.deadline).toLocaleDateString()}</span>
              <span>•</span>
              <span className={`text-anarchist-red font-bold`}>
                {status.text.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Bet Info */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {bet.user.avatar ? (
              <img 
                src={bet.user.avatar} 
                alt="User avatar"
                className="w-10 h-10 object-cover border border-anarchist-red"
              />
            ) : (
              <div className="w-10 h-10 bg-anarchist-red border border-anarchist-red flex items-center justify-center text-anarchist-black text-sm font-brutal font-bold">
                {bet.user.username ? bet.user.username[0].toUpperCase() : 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <a 
                  href={bet.user.username ? `/${bet.user.username}` : '#'}
                  className="font-brutal font-bold text-anarchist-red hover:text-anarchist-darkred transition-colors uppercase tracking-wider"
                  onClick={(e) => e.stopPropagation()}
                >
                  {bet.user.username || formatAddress(bet.user.walletAddress)}
                </a>
                <span className="text-anarchist-offwhite">•</span>
                <span className="text-anarchist-offwhite text-sm font-brutal">{formatDate(bet.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xl font-brutal font-bold text-anarchist-red">
              {bet.amount} SOL
            </div>
            <span className={`inline-block px-2 py-1 border text-xs font-brutal font-bold uppercase tracking-wider ${
              bet.betType === 'WILL_DO' 
                ? 'bg-anarchist-red text-anarchist-black border-anarchist-red' 
                : 'bg-anarchist-black text-anarchist-red border-anarchist-red'
            }`}>
              {bet.betType === 'WILL_DO' ? 'WILL DO' : "WON'T DO"}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        {(bet.isClaimed || bet.isEarlyCashOut) && (
          <div className="mb-4">
            <span className={`inline-block px-3 py-1 border border-anarchist-red text-sm font-brutal font-bold uppercase tracking-wider bg-anarchist-red text-anarchist-black`}>
              {status.text.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Social Actions */}
      {showSocialActions && (
        <div className="px-6 py-4 border-t-2 border-anarchist-red bg-anarchist-charcoal">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated || likingInProgress}
                className={`flex items-center space-x-1 px-3 py-2 border-2 transition-colors font-brutal font-bold uppercase tracking-wider ${
                  userHasLiked 
                    ? 'bg-anarchist-red text-anarchist-black border-anarchist-red hover:bg-anarchist-darkred' 
                    : 'bg-anarchist-black text-anarchist-red border-anarchist-red hover:bg-anarchist-charcoal'
                } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <svg className="w-4 h-4" fill={userHasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{localLikesCount}</span>
              </button>

              <button
                onClick={() => router.push(`/bet/${bet.onChainId}#comments`)}
                className="flex items-center space-x-1 px-3 py-2 border-2 bg-anarchist-black text-anarchist-red border-anarchist-red hover:bg-anarchist-charcoal transition-colors font-brutal font-bold uppercase tracking-wider"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>{bet.commentsCount}</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center space-x-1 px-3 py-2 border-2 bg-anarchist-black text-anarchist-red border-anarchist-red hover:bg-anarchist-charcoal transition-colors font-brutal font-bold uppercase tracking-wider"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                  <span>{bet.sharesCount}</span>
                </button>

                {showShareMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-anarchist-black border-2 border-anarchist-red py-2 z-10">
                    <button
                      onClick={() => handleShare('twitter')}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-anarchist-charcoal transition-colors text-anarchist-red font-brutal font-bold uppercase tracking-wider"
                    >
                      <svg className="w-4 h-4 text-anarchist-red" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                      </svg>
                      <span>SHARE ON TWITTER</span>
                    </button>
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 text-anarchist-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy Link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => router.push(`/dare/${bet.dare.onChainId}`)}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              View Dare →
            </button>
          </div>
        </div>
      )}

      {/* Click outside to close share menu */}
      {showShareMenu && (
        <div 
          className="fixed inset-0 z-0" 
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}
