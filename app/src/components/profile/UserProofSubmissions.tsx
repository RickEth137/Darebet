'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Eye, Calendar, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useVideoViewTracking } from '@/lib/videoViewTracking';

interface ProofSubmission {
  id: string;
  dareId: string;
  ipfsHash: string;
  description?: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  duration?: number;
  dare: {
    id: string;
    title: string;
    category: string;
  };
}

interface UserProofSubmissionsProps {
  username: string;
  currentUserId?: string;
  showTitle?: boolean;
}

const UserProofSubmissions: React.FC<UserProofSubmissionsProps> = ({
  username,
  currentUserId,
  showTitle = true,
}) => {
  const [submissions, setSubmissions] = useState<ProofSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { trackView } = useVideoViewTracking();

  useEffect(() => {
    fetchUserSubmissions();
  }, [username]);

  const fetchUserSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${username}/submissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch user submissions');
      }
      const data = await response.json();
      setSubmissions(data.submissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setLoading(false);
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

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Physical': 'bg-red-500',
      'Creative': 'bg-purple-500',
      'Social': 'bg-blue-500',
      'Mental': 'bg-green-500',
      'Adventure': 'bg-orange-500',
      'Other': 'bg-gray-500',
    };
    return colors[category] || colors['Other'];
  };

  if (loading) {
    return (
      <div className="bg-anarchist-black border-2 border-anarchist-red p-6">
        {showTitle && <h3 className="text-xl font-brutal font-bold text-anarchist-red mb-4 uppercase tracking-wider">DARE SUBMISSIONS</h3>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse bg-anarchist-charcoal h-48 border border-anarchist-red"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-anarchist-black border-2 border-anarchist-red p-6">
        {showTitle && <h3 className="text-xl font-brutal font-bold text-anarchist-red mb-4 uppercase tracking-wider">DARE SUBMISSIONS</h3>}
        <div className="text-anarchist-red text-center py-8 font-brutal">
          {error}
        </div>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-anarchist-black border-2 border-anarchist-red p-6">
        {showTitle && <h3 className="text-xl font-brutal font-bold text-anarchist-red mb-4 uppercase tracking-wider">DARE SUBMISSIONS</h3>}
        <div className="text-center py-12">
          <div className="text-anarchist-offwhite text-lg mb-2 font-brutal">NO SUBMISSIONS YET</div>
          <div className="text-anarchist-gray text-sm font-brutal">
            {username === currentUserId ? "YOU HAVEN'T COMPLETED ANY DARES YET" : "THIS USER HASN'T COMPLETED ANY DARES YET"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-anarchist-black border-2 border-anarchist-red p-6">
      {showTitle && (
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-brutal font-bold text-anarchist-red uppercase tracking-wider">
            DARE SUBMISSIONS ({submissions.length})
          </h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            className="bg-anarchist-charcoal border border-anarchist-red overflow-hidden group hover:border-anarchist-offwhite transition-all duration-200"
          >
            {/* Video thumbnail */}
            <div className="relative aspect-video bg-black overflow-hidden">
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
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-anarchist-red bg-opacity-80 rounded-full p-3">
                  <Play className="w-6 h-6 text-anarchist-black fill-current" />
                </div>
              </div>

              {/* Duration */}
              {submission.duration && (
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-anarchist-offwhite text-xs px-2 py-1 font-brutal">
                  {formatDuration(submission.duration)}
                </div>
              )}

              {/* Category badge */}
              <div className="absolute top-2 left-2">
                <span className={`${getCategoryColor(submission.dare.category)} text-white text-xs px-2 py-1 font-brutal font-bold uppercase tracking-wider border border-black`}>
                  {submission.dare.category}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Dare title */}
              <Link 
                href={`/dares/${submission.dareId}`}
                className="block hover:text-anarchist-red transition-colors"
              >
                <h4 className="font-brutal font-bold text-anarchist-offwhite text-sm mb-2 line-clamp-2 uppercase tracking-wider">
                  {submission.dare.title}
                </h4>
              </Link>

              {/* Description */}
              {submission.description && (
                <p className="text-anarchist-gray text-xs mb-3 line-clamp-2 font-brutal">
                  {submission.description}
                </p>
              )}

              {/* Date */}
              <div className="flex items-center text-anarchist-gray text-xs mb-3 font-brutal">
                <Calendar className="w-3 h-3 mr-1" />
                {formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true }).toUpperCase()}
              </div>

              {/* Engagement stats */}
              <div className="flex items-center justify-between text-anarchist-gray text-xs font-brutal">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{submission.likesCount}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{submission.commentsCount}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Eye className="w-3 h-3" />
                    <span>{submission.viewsCount}</span>
                  </div>
                </div>

                <Link 
                  href={`/dares/${submission.dareId}/submission/${submission.id}`}
                  className="text-anarchist-red hover:text-anarchist-offwhite transition-colors text-xs font-bold uppercase tracking-wider"
                >
                  VIEW DETAILS
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserProofSubmissions;