'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dare } from '@/types';
import { CircularLoader, LoadingSpinner } from './CircularLoader';

interface Comment {
  id: string;
  author: string;
  authorWallet: string;
  content: string;
  timestamp: number;
  likes: number;
  isLiked: boolean;
  replies: Comment[];
  parentId?: string;
  avatar: string;
  showReplies?: boolean;
}

interface CommentModalProps {
  dare: Dare;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function CommentModal({ dare, onClose, onCommentAdded }: CommentModalProps) {
  const { publicKey } = useWallet();
  const [comments, setComments] = useState<Comment[]>([]);
  const [displayedComments, setDisplayedComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const COMMENTS_PER_PAGE = 5;

  useEffect(() => {
    const fetchComments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/comments?onChainId=${dare.publicKey.toString()}&page=0&limit=${COMMENTS_PER_PAGE}`);
        
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
          setDisplayedComments(data.comments);
          setHasMore(data.hasMore);
        } else {
          console.error('Failed to fetch comments');
          setComments([]);
          setDisplayedComments([]);
          setHasMore(false);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        setComments([]);
        setDisplayedComments([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchComments();
  }, [dare.publicKey]);

  const loadMoreComments = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/comments?onChainId=${dare.publicKey.toString()}&page=${nextPage}&limit=${COMMENTS_PER_PAGE}`);
      
      if (response.ok) {
        const data = await response.json();
        setDisplayedComments(prev => [...prev, ...data.comments]);
        setPage(nextPage);
        setHasMore(data.hasMore);
      }
    } catch (error) {
      console.error('Error loading more comments:', error);
    } finally {
      setLoadingMore(false);
    }
  };



  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / (3600000 * 24));

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return 'now';
  };

  const handleLikeComment = async (commentId: string) => {
    if (!publicKey) return;

    try {
      const response = await fetch('/api/comments/like', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentId,
          userWallet: publicKey.toString(),
          username: 'User', // Could be enhanced with actual username
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update the comment in local state
        const updateCommentLikes = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                isLiked: data.isLiked,
                likes: data.likeCount
              };
            }
            if (comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentLikes(comment.replies)
              };
            }
            return comment;
          });
        };

        setDisplayedComments(updateCommentLikes(displayedComments));
        setComments(updateCommentLikes(comments));
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !publicKey) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onChainId: dare.publicKey.toString(),
          content: newComment,
          userWallet: publicKey.toString(),
          username: 'User', // Could be enhanced with actual username
        }),
      });

      if (response.ok) {
        const newCommentObj = await response.json();
        setComments([newCommentObj, ...comments]);
        setDisplayedComments([newCommentObj, ...displayedComments]);
        setNewComment('');
        onCommentAdded?.();
      } else {
        console.error('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !publicKey) return;

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onChainId: dare.publicKey.toString(),
          content: replyContent,
          userWallet: publicKey.toString(),
          username: 'User',
          parentId,
        }),
      });

      if (response.ok) {
        const newReply = await response.json();
        
        const addReplyToComment = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === parentId) {
              return {
                ...comment,
                replies: [...comment.replies, newReply],
                showReplies: true
              };
            }
            if (comment.replies.length > 0) {
              return {
                ...comment,
                replies: addReplyToComment(comment.replies)
              };
            }
            return comment;
          });
        };

        setComments(addReplyToComment(comments));
        setDisplayedComments(addReplyToComment(displayedComments));
        setReplyContent('');
        setReplyingTo(null);
        onCommentAdded?.();
      } else {
        console.error('Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
    }
  };

  const toggleReplies = (commentId: string) => {
    const updateRepliesVisibility = (comments: Comment[]): Comment[] => {
      return comments.map(comment => {
        if (comment.id === commentId) {
          return {
            ...comment,
            showReplies: !comment.showReplies
          };
        }
        if (comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateRepliesVisibility(comment.replies)
          };
        }
        return comment;
      });
    };

    setDisplayedComments(updateRepliesVisibility(displayedComments));
    setComments(updateRepliesVisibility(comments));
  };

  const renderComment = (comment: Comment, depth: number = 0) => {
    const isNested = depth > 0;
    const maxDepth = 3;

    return (
      <div key={comment.id} className={`${isNested ? 'ml-8 mt-3' : 'mb-4'}`}>
        {/* Comment */}
        <div className="bg-anarchist-black border border-anarchist-gray p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-anarchist-charcoal border border-anarchist-red flex items-center justify-center text-sm">
                {comment.avatar}
              </div>
              <div>
                <div className="font-brutal font-bold text-anarchist-white text-sm">
                  {comment.author}
                </div>
                <div className="text-xs font-brutal text-anarchist-gray">
                  {comment.authorWallet} • {formatTimeAgo(comment.timestamp)}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <p className="text-anarchist-offwhite text-sm font-brutal mb-3">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleLikeComment(comment.id)}
              className={`flex items-center space-x-1 transition-colors ${
                comment.isLiked ? 'text-anarchist-red' : 'text-anarchist-gray hover:text-anarchist-red'
              }`}
            >
              <span className="text-sm">{comment.isLiked ? '❤️' : '🤍'}</span>
              <span className="text-xs font-brutal font-bold">{comment.likes}</span>
            </button>

            {depth < maxDepth && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-anarchist-gray hover:text-anarchist-red transition-colors text-xs font-brutal font-bold uppercase"
              >
                REPLY
              </button>
            )}

            {/* Show/Hide Replies Button */}
            {comment.replies.length > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="text-anarchist-gray hover:text-anarchist-red transition-colors text-xs font-brutal font-bold uppercase flex items-center space-x-1"
              >
                <span>{comment.showReplies ? '▼' : '▶'}</span>
                <span>
                  {comment.showReplies ? 'HIDE' : 'SHOW'} {comment.replies.length} REPL{comment.replies.length === 1 ? 'Y' : 'IES'}
                </span>
              </button>
            )}
          </div>

          {/* Reply Form */}
          {replyingTo === comment.id && (
            <div className="mt-3 pt-3 border-t border-anarchist-gray">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                className="w-full bg-anarchist-charcoal border border-anarchist-gray text-anarchist-white p-3 text-sm font-brutal focus:border-anarchist-red focus:outline-none resize-none"
                rows={3}
              />
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setReplyingTo(null)}
                  className="px-3 py-1 text-xs font-brutal text-anarchist-gray hover:text-anarchist-red transition-colors"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={!replyContent.trim()}
                  className="px-3 py-1 bg-anarchist-red text-anarchist-black text-xs font-brutal font-bold disabled:bg-anarchist-gray disabled:text-anarchist-offwhite transition-colors"
                >
                  REPLY
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Render Replies */}
        {comment.replies.length > 0 && comment.showReplies && (
          <div className="mt-2">
            {comment.replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-anarchist-charcoal border-2 border-anarchist-red w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-anarchist-black p-4 border-b border-anarchist-red flex justify-between items-center">
          <div>
            <h2 className="text-xl font-brutal font-bold text-anarchist-red uppercase tracking-wider">
              COMMENTS
            </h2>
            <p className="text-sm font-brutal text-anarchist-offwhite">
              {dare.account.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-anarchist-red hover:text-anarchist-white transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* New Comment Form */}
        {publicKey && (
          <div className="p-4 border-b border-anarchist-gray">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="What do you think about this dare?"
              className="w-full bg-anarchist-black border border-anarchist-gray text-anarchist-white p-3 text-sm font-brutal focus:border-anarchist-red focus:outline-none resize-none"
              rows={3}
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-anarchist-red text-anarchist-black text-sm font-brutal font-bold disabled:bg-anarchist-gray disabled:text-anarchist-offwhite transition-colors"
              >
                POST COMMENT
              </button>
            </div>
          </div>
        )}

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse bg-anarchist-black border border-anarchist-gray p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="w-8 h-8 bg-anarchist-gray rounded"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-anarchist-gray rounded w-32 mb-1"></div>
                      <div className="h-3 bg-anarchist-gray rounded w-24"></div>
                    </div>
                  </div>
                  <div className="h-4 bg-anarchist-gray rounded w-full mb-2"></div>
                  <div className="h-4 bg-anarchist-gray rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : displayedComments.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-anarchist-offwhite font-brutal text-lg mb-2">NO COMMENTS YET</p>
              <p className="text-anarchist-gray font-brutal text-sm">
                Be the first to share your thoughts on this dare!
              </p>
            </div>
          ) : (
            <div>
              {displayedComments.map(comment => renderComment(comment))}
              
              {/* Load More Button */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMoreComments}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-anarchist-black border border-anarchist-red text-anarchist-red hover:bg-anarchist-red hover:text-anarchist-black transition-colors font-brutal font-bold uppercase tracking-wider disabled:opacity-50 flex items-center space-x-2"
                  >
                    {loadingMore && <CircularLoader size="sm" />}
                    <span>{loadingMore ? 'LOADING...' : 'LOAD MORE COMMENTS'}</span>
                  </button>
                </div>
              )}
              
              {/* Loading indicator for more comments */}
              {loadingMore && (
                <div className="mt-4 space-y-4">
                  {[...Array(2)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-anarchist-black border border-anarchist-gray p-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-8 h-8 bg-anarchist-gray rounded"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-anarchist-gray rounded w-32 mb-1"></div>
                          <div className="h-3 bg-anarchist-gray rounded w-24"></div>
                        </div>
                      </div>
                      <div className="h-4 bg-anarchist-gray rounded w-full mb-2"></div>
                      <div className="h-4 bg-anarchist-gray rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="bg-anarchist-black p-3 border-t border-anarchist-gray">
          <div className="flex items-center justify-between text-xs font-brutal text-anarchist-gray">
            <span>{comments.length} TOTAL COMMENTS</span>
            <span>SHOWING {Math.min(displayedComments.length, comments.length)} OF {comments.length}</span>
            <span>
              {comments.reduce((total, comment) => 
                total + comment.likes + comment.replies.reduce((replyTotal, reply) => 
                  replyTotal + reply.likes + reply.replies.reduce((nestedTotal, nested) => 
                    nestedTotal + nested.likes, 0), 0), 0
              )} TOTAL LIKES
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}