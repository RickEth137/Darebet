'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Eye, Trophy, Calendar, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useVideoViewTracking } from '@/lib/videoViewTracking';

interface ProofSubmission {
  id: string;
  dareId: string;
  userId: string;
  ipfsHash: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  duration?: number;
  videoBitrate?: number;
  videoCodec?: string;
  user: {
    id: string;
    username: string;
  };
  isLiked?: boolean; // Whether current user has liked this submission
}

interface ContestantsSectionProps {
  dareId: string;
  currentUserId?: string;
}

const ContestantsSection: React.FC<ContestantsSectionProps> = ({
  dareId,
  currentUserId,
}) => {
  const [submissions, setSubmissions] = useState<ProofSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'likes' | 'early'>('likes');
  const { trackView } = useVideoViewTracking();

  useEffect(() => {
    fetchSubmissions();
  }, [dareId, sortBy]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dares/${dareId}/submissions?sort=${sortBy}&userId=${currentUserId || ''}`);
      
      if (!response.ok) {
        // If it's a 404 or the dare doesn't exist in DB, show no submissions
        if (response.status === 404) {
          setSubmissions([]);
          setError(null);
          return;
        }
        throw new Error('Failed to fetch submissions');
      }
      
      const data = await response.json();
      setSubmissions(data.submissions || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching submissions:', err);
      // For demo dares or network errors, just show no submissions instead of error
      setSubmissions([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (submissionId: string) => {
    if (!currentUserId) {
      alert('Please log in to like submissions');
      return;
    }

    try {
      const response = await fetch(`/api/proof-submissions/${submissionId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      });

      if (!response.ok) {
        throw new Error('Failed to like submission');
      }

      const { liked, likesCount } = await response.json();
      
      setSubmissions(prev => prev.map(submission => 
        submission.id === submissionId 
          ? { ...submission, isLiked: liked, likesCount }
          : submission
      ));
    } catch (err) {
      console.error('Error liking submission:', err);
    }
  };

  const handleShare = async (submission: ProofSubmission) => {
    const shareUrl = `${window.location.origin}/dares/${dareId}/submission/${submission.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${submission.user.username}'s dare submission`,
          text: submission.description || 'Check out this dare submission!',
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const getIpfsVideoUrl = (ipfsHash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-yellow-500" />;
    if (index === 1) return <Trophy className="w-4 h-4 text-gray-400" />;
    if (index === 2) return <Trophy className="w-4 h-4 text-amber-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Contestants</h3>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-32"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Contestants</h3>
        <div className="text-red-400 text-center py-8">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">
          Contestants ({submissions.length})
        </h3>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-gray-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'likes' | 'early')}
            className="bg-gray-800 text-white px-3 py-1 rounded-md text-sm border border-gray-700 focus:border-purple-500 focus:outline-none"
          >
            <option value="likes">Most Liked</option>
            <option value="early">Earliest</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">No submissions yet</div>
          <div className="text-gray-500 text-sm">Be the first to take on this dare!</div>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto">
          <div className="space-y-4 pr-2">
            {submissions.map((submission, index) => (
            <div
              key={submission.id}
              className="bg-gray-800 rounded-lg p-4 transition-all duration-200 hover:bg-gray-750"
            >
              <div className="flex items-start space-x-4">
                {/* Rank indicator */}
                <div className="flex items-center justify-center w-8 h-8 bg-gray-700 rounded-full text-sm font-bold">
                  {getRankIcon(index) || (index + 1)}
                </div>

                {/* Video thumbnail */}
                <div className="flex-shrink-0">
                  <div className="relative w-20 h-20 bg-gray-700 rounded-lg overflow-hidden group cursor-pointer">
                    <video
                      src={getIpfsVideoUrl(submission.ipfsHash)}
                      className="w-full h-full object-cover"
                      muted
                      onMouseEnter={(e) => {
                        const video = e.target as HTMLVideoElement;
                        video.currentTime = 1; // Show frame at 1 second
                      }}
                      onPlay={() => trackView(submission.id)}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    {submission.duration && (
                      <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                        {formatDuration(submission.duration)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {submission.user.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-white">
                        {submission.user.username}
                      </span>
                    </div>
                    <div className="flex items-center text-gray-400 text-sm">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}
                    </div>
                  </div>

                  {submission.description && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {submission.description}
                    </p>
                  )}

                  {/* Engagement stats */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleLike(submission.id)}
                      disabled={!currentUserId}
                      className={`flex items-center space-x-1 text-sm transition-colors ${
                        submission.isLiked
                          ? 'text-red-400 hover:text-red-300'
                          : 'text-gray-400 hover:text-red-400'
                      } ${!currentUserId ? 'cursor-not-allowed opacity-50' : ''}`}
                    >
                      <Heart
                        className={`w-4 h-4 ${submission.isLiked ? 'fill-current' : ''}`}
                      />
                      <span>{submission.likesCount}</span>
                    </button>

                    <div className="flex items-center space-x-1 text-gray-400 text-sm">
                      <MessageCircle className="w-4 h-4" />
                      <span>{submission.commentsCount}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-gray-400 text-sm">
                      <Eye className="w-4 h-4" />
                      <span>{submission.viewsCount}</span>
                    </div>

                    <button
                      onClick={() => handleShare(submission)}
                      className="flex items-center space-x-1 text-gray-400 hover:text-blue-400 text-sm transition-colors"
                    >
                      <Share className="w-4 h-4" />
                      <span>{submission.sharesCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestantsSection;