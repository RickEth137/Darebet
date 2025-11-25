'use client';

import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, Eye, Calendar, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useVideoViewTracking } from '@/lib/videoViewTracking';
import DareVideoModal from './DareVideoModal';

const DEFAULT_AVATAR = "https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreihpfyvyryphyedr44zteziu3d3hbq47cekhre5c5zjjyn6w3ezttq";

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
  submitter: {
    walletAddress: string;
    username?: string;
    avatar?: string;
  };
}

interface DareProofSubmissionsProps {
  dareId: string;
  dareTitle: string;
}

const DareProofSubmissions: React.FC<DareProofSubmissionsProps> = ({ dareId, dareTitle }) => {
  const [submissions, setSubmissions] = useState<ProofSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<ProofSubmission | null>(null);
  const { trackView } = useVideoViewTracking();

  useEffect(() => {
    fetchDareSubmissions();
  }, [dareId]);

  const fetchDareSubmissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/dares/${dareId}/submissions`);
      if (!response.ok) {
        throw new Error('Failed to fetch dare submissions');
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

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="animate-pulse bg-gray-800 rounded-lg h-96 border border-anarchist-red"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-anarchist-red text-center py-8 border border-anarchist-red p-6">
        {error}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 border border-anarchist-red p-8">
        <div className="text-anarchist-offwhite text-lg mb-2 font-brutal font-bold uppercase">
          No Entries Yet
        </div>
        <div className="text-anarchist-white text-sm">
          Be the first to enter this dare!
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {submissions.map((submission) => (
          <div
            key={submission.id}
            onClick={() => setSelectedSubmission(submission)}
            className="bg-anarchist-black border border-anarchist-red overflow-hidden group hover:border-red-500 transition-all duration-200 cursor-pointer"
          >
            {/* Video thumbnail */}
            <div className="relative aspect-video bg-gray-900 overflow-hidden">
              <video
                src={getIpfsVideoUrl(submission.ipfsHash)}
                className="w-full h-full object-cover"
                muted
                onMouseEnter={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.currentTime = 1; // Show frame at 1 second
                }}
              />
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all">
                <div className="bg-anarchist-red rounded-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="w-6 h-6 text-white fill-white" />
                </div>
              </div>

              {/* Duration badge */}
              {submission.duration && (
                <div className="absolute bottom-2 right-2 bg-anarchist-black bg-opacity-80 px-2 py-1 text-xs font-brutal font-bold text-anarchist-offwhite">
                  {formatDuration(submission.duration)}
                </div>
              )}
            </div>

            {/* Submission Info */}
            <div className="p-4">
              {/* Submitter info */}
              <Link 
                href={`/profile/${submission.submitter.username || submission.submitter.walletAddress}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center space-x-2 mb-3 hover:opacity-80 transition-opacity"
              >
                <img 
                  src={submission.submitter.avatar || DEFAULT_AVATAR}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover border border-anarchist-red"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-brutal font-bold text-anarchist-offwhite truncate">
                    {submission.submitter.username || formatAddress(submission.submitter.walletAddress)}
                  </div>
                </div>
              </Link>

              {/* Description */}
              {submission.description && (
                <p className="text-sm text-anarchist-white mb-3 line-clamp-2">
                  {submission.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex items-center justify-between text-xs text-anarchist-white">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{submission.viewsCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{submission.likesCount || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{submission.commentsCount || 0}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedSubmission && (
        <DareVideoModal
          isOpen={!!selectedSubmission}
          onClose={() => {
            setSelectedSubmission(null);
            // Refresh submissions to get updated counts
            fetchDareSubmissions();
          }}
          submission={selectedSubmission}
          dareTitle={dareTitle}
        />
      )}
    </>
  );
};

export default DareProofSubmissions;
