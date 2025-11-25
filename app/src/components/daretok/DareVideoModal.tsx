'use client';

import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, Send, Calendar, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useUser } from '@/hooks/useUser';
import toast from 'react-hot-toast';

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
  isLiked?: boolean;
  submitter: {
    walletAddress: string;
    username?: string;
    avatar?: string;
  };
}

interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    username?: string;
    walletAddress: string;
  };
}

interface DareVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ProofSubmission;
  dareTitle: string;
}

const DareVideoModal: React.FC<DareVideoModalProps> = ({
  isOpen,
  onClose,
  submission,
  dareTitle,
}) => {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(submission.isLiked || false);
  const [likesCount, setLikesCount] = useState(submission.likesCount);
  const [commentsCount, setCommentsCount] = useState(submission.commentsCount);
  const [viewsCount, setViewsCount] = useState(submission.viewsCount);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [viewTracked, setViewTracked] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchComments();
      // Track view when modal opens
      if (!viewTracked) {
        trackView();
        setViewTracked(true);
      }
    }
  }, [isOpen, submission.id]);

  const trackView = async () => {
    try {
      const response = await fetch(`/api/proof-submissions/${submission.id}/view`, {
        method: 'POST',
      });
      if (response.ok) {
        const data = await response.json();
        setViewsCount(data.viewsCount);
      }
    } catch (error) {
      console.error('Failed to track view:', error);
    }
  };

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const response = await fetch(`/api/proof-submissions/${submission.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error('Please connect your wallet to like');
      return;
    }

    try {
      const response = await fetch(`/api/proof-submissions/${submission.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(data.likesCount);
      }
    } catch (error) {
      console.error('Failed to like submission:', error);
      toast.error('Failed to like submission');
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please connect your wallet to comment');
      return;
    }

    if (!newComment.trim()) {
      return;
    }

    try {
      setIsSubmittingComment(true);
      const response = await fetch(`/api/proof-submissions/${submission.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          content: newComment.trim(),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setComments([data.comment, ...comments]);
        setCommentsCount(commentsCount + 1);
        setNewComment('');
        toast.success('Comment posted!');
      } else {
        console.error('API Error:', data);
        throw new Error(data.error || 'Failed to post comment');
      }
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/daretok/${submission.dareId}?entry=${submission.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${submission.submitter.username || 'User'}'s dare entry`,
          text: submission.description || 'Check out this dare entry!',
          url: shareUrl,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const getIpfsVideoUrl = (ipfsHash: string) => {
    return `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <div className="bg-anarchist-charcoal border-2 border-anarchist-red w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-anarchist-red">
          <div>
            <h2 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider">
              {dareTitle}
            </h2>
            <p className="text-xs text-anarchist-white">
              Entry by {submission.submitter.username || formatAddress(submission.submitter.walletAddress)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-anarchist-gray hover:text-anarchist-red transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left side - Video */}
          <div className="flex-1 bg-anarchist-black flex flex-col">
            <div className="flex-1 flex items-center justify-center p-4">
              <video
                src={getIpfsVideoUrl(submission.ipfsHash)}
                controls
                autoPlay
                className="max-w-full max-h-full"
              />
            </div>

            {/* Video info and actions */}
            <div className="p-4 border-t border-anarchist-gray">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleLike}
                    className={`flex items-center space-x-2 transition-colors ${
                      isLiked ? 'text-anarchist-red' : 'text-anarchist-white hover:text-anarchist-red'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-brutal">{likesCount}</span>
                  </button>

                  <div className="flex items-center space-x-2 text-anarchist-white">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-brutal">{commentsCount}</span>
                  </div>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 text-anarchist-white hover:text-anarchist-red transition-colors"
                  >
                    <Share2 className="w-5 h-5" />
                    <span className="text-sm font-brutal">Share</span>
                  </button>

                  <div className="flex items-center space-x-2 text-anarchist-gray">
                    <Eye className="w-5 h-5" />
                    <span className="text-sm font-brutal">{viewsCount}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-anarchist-gray text-sm">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDistanceToNow(new Date(submission.createdAt), { addSuffix: true })}</span>
                </div>
              </div>

              {submission.description && (
                <p className="text-sm text-anarchist-offwhite">
                  {submission.description}
                </p>
              )}
            </div>
          </div>

          {/* Right side - Comments */}
          <div className="w-96 bg-anarchist-black border-l border-anarchist-red flex flex-col">
            <div className="p-4 border-b border-anarchist-gray">
              <h3 className="text-sm font-brutal font-bold text-anarchist-red uppercase tracking-wider">
                Comments ({commentsCount})
              </h3>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingComments ? (
                <div className="text-center text-anarchist-gray py-8">
                  Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center text-anarchist-gray py-8">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No comments yet</p>
                  <p className="text-xs mt-1">Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-start space-x-2">
                      <div className="w-8 h-8 bg-anarchist-red rounded-full flex items-center justify-center text-anarchist-offwhite text-xs font-brutal font-bold flex-shrink-0">
                        {comment.user.username 
                          ? comment.user.username[0].toUpperCase() 
                          : '😈'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline space-x-2">
                          <span className="text-sm font-brutal font-bold text-anarchist-offwhite">
                            {comment.user.username || formatAddress(comment.user.walletAddress)}
                          </span>
                          <span className="text-xs text-anarchist-gray">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-anarchist-white mt-1">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="p-4 border-t border-anarchist-gray">
              <form onSubmit={handleComment} className="flex space-x-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 bg-anarchist-charcoal border border-anarchist-gray px-3 py-2 text-sm text-anarchist-offwhite placeholder-anarchist-gray focus:outline-none focus:border-anarchist-red"
                  disabled={!user || isSubmittingComment}
                />
                <button
                  type="submit"
                  disabled={!user || !newComment.trim() || isSubmittingComment}
                  className="bg-anarchist-red text-anarchist-offwhite px-4 py-2 font-brutal font-bold text-sm uppercase tracking-wider hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              {!user && (
                <p className="text-xs text-anarchist-gray mt-2">
                  Connect your wallet to comment
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DareVideoModal;
