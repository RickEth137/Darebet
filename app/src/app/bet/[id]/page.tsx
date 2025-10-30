'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/hooks/useUser';
import { formatDistanceToNow } from 'date-fns';

interface BetData {
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
    id: string;
    onChainId: string;
    title: string;
    description: string;
    creator: string;
    logoUrl: string;
    deadline: string;
    minBet: number;
    isCompleted: boolean;
  };
  user: {
    walletAddress: string;
    username: string | null;
    avatar: string | null;
  };
  likes: {
    id: string;
    userWallet: string;
    user: {
      username: string | null;
      walletAddress: string;
    };
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    userWallet: string;
    user: {
      username: string | null;
      walletAddress: string;
      avatar: string | null;
    };
  }[];
}

export default function BetPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useUser();
  const [bet, setBet] = useState<BetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [userHasLiked, setUserHasLiked] = useState(false);
  const [likingInProgress, setLikingInProgress] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const betId = params?.id as string;

  useEffect(() => {
    if (betId) {
      loadBet();
    }
  }, [betId]);

  useEffect(() => {
    if (bet && user) {
      setUserHasLiked(bet.likes.some(like => like.userWallet === user.walletAddress));
    }
  }, [bet, user]);

  const loadBet = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/bets/${betId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load bet');
      }

      setBet(data.bet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !user || !bet || likingInProgress) return;

    setLikingInProgress(true);
    try {
      const response = await fetch(`/api/bets/${betId}/like`, {
        method: userHasLiked ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userWallet: user.walletAddress,
        }),
      });

      if (response.ok) {
        await loadBet(); // Refresh bet data
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLikingInProgress(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated || !user || !bet || !newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      const response = await fetch(`/api/bets/${betId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment.trim(),
          userWallet: user.walletAddress,
        }),
      });

      if (response.ok) {
        setNewComment('');
        await loadBet(); // Refresh bet data
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async (platform: 'twitter' | 'copy') => {
    if (!bet) return;

    const url = `${window.location.origin}/bet/${bet.onChainId}`;
    const text = `Check out this bet: ${bet.user.username || 'Someone'} bet ${bet.amount} SOL that they ${bet.betType === 'WILL_DO' ? 'WILL' : "WON'T"} complete "${bet.dare.title}"!`;

    if (platform === 'twitter') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
      window.open(twitterUrl, '_blank');
      
      // Track share
      try {
        await fetch(`/api/bets/${betId}/share`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ platform: 'twitter' })
        });
      } catch (error) {
        console.error('Error tracking share:', error);
      }
    } else if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
        
        // Track share
        try {
          await fetch(`/api/bets/${betId}/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform: 'copy' })
          });
        } catch (error) {
          console.error('Error tracking share:', error);
        }
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Fallback for older browsers
        prompt('Copy this link:', url);
      }
    }
    
    setShowShareMenu(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="h-64 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <div className="text-red-400 text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-red-900 mb-2">Bet Not Found</h1>
            <p className="text-red-700 mb-6">
              {error || 'The bet you are looking for does not exist or has been removed.'}
            </p>
            <button
              onClick={() => router.push('/')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
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
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-anarchist-white hover:text-anarchist-red mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Bet Card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          {/* Dare Info Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white p-6">
            <div className="flex items-start space-x-4">
              <img 
                src={bet.dare.logoUrl} 
                alt="Dare logo"
                className="w-16 h-16 rounded-lg object-cover border-2 border-white/20"
              />
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{bet.dare.title}</h1>
                <p className="text-primary-100 mb-3 line-clamp-2">{bet.dare.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span>Min Bet: {bet.dare.minBet} SOL</span>
                  <span>•</span>
                  <span>Deadline: {new Date(bet.dare.deadline).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className={`px-2 py-1 rounded ${bet.dare.isCompleted ? 'bg-green-500' : 'bg-yellow-500'}`}>
                    {bet.dare.isCompleted ? 'Completed' : 'Active'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => router.push(`/dare/${bet.dare.onChainId}`)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                View Dare
              </button>
            </div>
          </div>

          {/* Bet Details */}
          <div className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                {bet.user.avatar ? (
                  <img 
                    src={bet.user.avatar} 
                    alt="User avatar"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <img 
                    src="/default-avatar.jpg" 
                    alt="User avatar" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="flex items-center space-x-2">
                    <a 
                      href={bet.user.username ? `/${bet.user.username}` : '#'}
                      className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                    >
                      {bet.user.username || formatAddress(bet.user.walletAddress)}
                    </a>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-500 text-sm">{formatDate(bet.createdAt)}</span>
                  </div>
                  <p className="text-anarchist-white text-sm">
                    {formatAddress(bet.user.walletAddress)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {bet.amount} SOL
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                  bet.betType === 'WILL_DO' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {bet.betType === 'WILL_DO' ? 'Will Do' : "Won't Do"}
                </span>
              </div>
            </div>

            {/* Social Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  disabled={!isAuthenticated || likingInProgress}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    userHasLiked 
                      ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                      : 'bg-gray-100 text-anarchist-white hover:bg-gray-200'
                  } ${!isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <svg className="w-5 h-5" fill={userHasLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span>{bet.likesCount}</span>
                </button>

                <button
                  onClick={() => document.getElementById('comment-input')?.focus()}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-100 text-anarchist-white hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>{bet.commentsCount}</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-lg bg-gray-100 text-anarchist-white hover:bg-gray-200 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>{bet.sharesCount}</span>
                  </button>

                  {showShareMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                      <button
                        onClick={() => handleShare('twitter')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
                        </svg>
                        <span>Share on Twitter</span>
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex items-center space-x-2 w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors"
                      >
                        <svg className="w-5 h-5 text-anarchist-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy Link</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {bet.isClaimed && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  Claimed
                </span>
              )}
              {bet.isEarlyCashOut && (
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  Cashed Out
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Comments ({bet.commentsCount})
          </h2>

          {/* Add Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex space-x-3">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <img 
                    src="/default-avatar.jpg" 
                    alt="Your avatar" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <textarea
                    id="comment-input"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    rows={3}
                    maxLength={500}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">
                      {newComment.length}/500
                    </span>
                    <button
                      type="submit"
                      disabled={!newComment.trim() || submittingComment}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-anarchist-white mb-2">Connect your wallet to join the conversation</p>
            </div>
          )}

          {/* Comments List */}
          <div className="space-y-4">
            {bet.comments.length === 0 ? (
              <div className="text-center py-8 bg-anarchist-black border border-anarchist-red">
                <div className="text-6xl mb-4 text-anarchist-red font-brutal">[NO COMMENTS]</div>
                <h3 className="text-lg font-brutal font-bold text-anarchist-red mb-2 uppercase tracking-wider">NO COMMENTS YET</h3>
                <p className="text-anarchist-offwhite font-brutal">BE THE FIRST TO SHARE YOUR THOUGHTS</p>
              </div>
            ) : (
              bet.comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  {comment.user.avatar ? (
                    <img 
                      src={comment.user.avatar} 
                      alt={comment.user.username || 'User'} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <img 
                      src="/default-avatar.jpg" 
                      alt={comment.user.username || 'User'} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <a 
                          href={comment.user.username ? `/${comment.user.username}` : '#'}
                          className="font-medium text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {comment.user.username || formatAddress(comment.userWallet)}
                        </a>
                        <span className="text-gray-500 text-sm">•</span>
                        <span className="text-gray-500 text-sm">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

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