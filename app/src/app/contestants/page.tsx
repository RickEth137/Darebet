'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/hooks/useUser';
import { formatDistanceToNow } from 'date-fns';

interface ContestantSubmission {
  id: string;
  dareId: string;
  userId: string;
  submitter: string; // wallet address
  username?: string;
  mediaUrl: string;
  description: string;
  mediaType: 'VIDEO' | 'IMAGE' | 'AUDIO' | 'DOCUMENT';
  ipfsHash: string;
  submittedAt: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean; // by current user
  dare: {
    title: string;
    onChainId: string;
    deadline: string;
    isCompleted: boolean;
  };
  user: {
    username?: string;
    avatar?: string;
  };
}

export default function ContestantsFeedPage() {
  const { user } = useUser();
  const [submissions, setSubmissions] = useState<ContestantSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'trending' | 'recent'>('trending');

  useEffect(() => {
    loadSubmissions();
  }, [filter]);

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      const mockSubmissions: ContestantSubmission[] = [
        {
          id: '1',
          dareId: 'dare1',
          userId: 'user1',
          submitter: 'ABC123...XYZ789',
          username: 'daredevil_mike',
          mediaUrl: 'https://via.placeholder.com/400x600/000000/FF0000?text=GHOST+PEPPER+VIDEO',
          description: 'JUST DEMOLISHED 10 CAROLINA REAPERS IN 4:30! 🔥🔥🔥 NO WATER, NO MERCY! Check the timer! #DareComplete #GhostPepper',
          mediaType: 'VIDEO',
          ipfsHash: 'QmTest123',
          submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          likesCount: 847,
          commentsCount: 156,
          isLiked: false,
          dare: {
            title: 'EAT 10 GHOST PEPPERS IN 5 MINUTES',
            onChainId: '11111111111111111111111111111111',
            deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false
          },
          user: {
            username: 'daredevil_mike',
            avatar: undefined
          }
        },
        {
          id: '2',
          dareId: 'dare2',
          userId: 'user2',
          submitter: 'DEF456...UVW012',
          username: 'bald_eagle_22',
          mediaUrl: 'https://via.placeholder.com/400x600/FF0000/FFFFFF?text=SHAVED+HEAD+PROOF',
          description: 'IT\'S DONE! Completely bald - head AND eyebrows! 30 days starts now. RIP my hair 😭 #BaldChallenge #NoRegrets',
          mediaType: 'VIDEO',
          ipfsHash: 'QmTest456',
          submittedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          likesCount: 234,
          commentsCount: 89,
          isLiked: true,
          dare: {
            title: 'SHAVE HEAD AND EYEBROWS COMPLETELY',
            onChainId: '22222222222222222222222222222222',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            isCompleted: false
          },
          user: {
            username: 'bald_eagle_22',
            avatar: undefined
          }
        }
      ];
      
      setSubmissions(mockSubmissions);
    } catch (error) {
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (submissionId: string) => {
    try {
      // TODO: API call to like/unlike
      setSubmissions(prev => prev.map(sub => 
        sub.id === submissionId 
          ? { 
              ...sub, 
              isLiked: !sub.isLiked,
              likesCount: sub.isLiked ? sub.likesCount - 1 : sub.likesCount + 1
            }
          : sub
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const formatUsername = (submission: ContestantSubmission) => {
    return submission.username || `${submission.submitter.slice(0, 4)}...${submission.submitter.slice(-4)}`;
  };

  const getTimeBonus = (submittedAt: string, deadline: string) => {
    const submitted = new Date(submittedAt).getTime();
    const end = new Date(deadline).getTime();
    const now = Date.now();
    
    const totalTime = end - (end - 7 * 24 * 60 * 60 * 1000); // assume 7 day dare duration
    const timeLeft = end - submitted;
    const bonus = Math.floor((timeLeft / totalTime) * 100);
    
    return Math.max(0, Math.min(100, bonus));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-anarchist-black">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center py-16">
              <div className="text-anarchist-red text-6xl mb-4 animate-pulse">📹</div>
              <h1 className="text-2xl font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">
                Loading Contestants...
              </h1>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-anarchist-black">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-4">
              🔴 CONTESTANTS FEED
            </h1>
            <p className="text-anarchist-offwhite font-brutal mb-6">
              WATCH DARE SUBMISSIONS • LIKE • COMMENT • SUPPORT YOUR FAVORITES
            </p>
            
            {/* Filter Tabs */}
            <div className="flex space-x-4 mb-6">
              {(['trending', 'recent', 'all'] as const).map((filterType) => (
                <button
                  key={filterType}
                  onClick={() => setFilter(filterType)}
                  className={`px-4 py-2 font-brutal font-bold uppercase tracking-wider transition-colors border-2 ${
                    filter === filterType
                      ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                      : 'bg-anarchist-charcoal text-anarchist-offwhite border-anarchist-gray hover:border-anarchist-red'
                  }`}
                >
                  {filterType}
                </button>
              ))}
            </div>
          </div>

          {/* Submissions Feed */}
          <div className="space-y-8">
            {submissions.map((submission) => (
              <div key={submission.id} className="bg-anarchist-charcoal border-2 border-anarchist-red overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-anarchist-red">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-anarchist-black border border-anarchist-red flex items-center justify-center">
                        <span className="text-anarchist-red font-brutal font-bold">
                          {formatUsername(submission)[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-brutal font-bold text-anarchist-red">
                            @{formatUsername(submission)}
                          </span>
                          <span className="text-anarchist-gray font-brutal text-sm">
                            entry for
                          </span>
                        </div>
                        <p className="text-anarchist-white font-brutal text-sm">
                          {submission.dare.title}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-anarchist-gray font-brutal">
                        {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs bg-anarchist-black text-anarchist-red px-2 py-1 border border-anarchist-red font-brutal">
                          TIME BONUS: {getTimeBonus(submission.submittedAt, submission.dare.deadline)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Media */}
                <div className="relative bg-anarchist-black">
                  {submission.mediaType === 'VIDEO' ? (
                    <div className="aspect-[9/16] max-h-[600px] bg-anarchist-black flex items-center justify-center border border-anarchist-gray">
                      <div className="text-center">
                        <div className="text-anarchist-red text-6xl mb-2">▶️</div>
                        <p className="text-anarchist-offwhite font-brutal text-sm">
                          VIDEO PLAYER
                        </p>
                        <p className="text-anarchist-gray font-brutal text-xs">
                          {submission.mediaUrl}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <img 
                      src={submission.mediaUrl} 
                      alt="Submission"
                      className="w-full max-h-[600px] object-contain"
                    />
                  )}
                </div>

                {/* Description */}
                <div className="p-4">
                  <p className="text-anarchist-offwhite font-brutal text-sm mb-4 leading-relaxed">
                    {submission.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <button
                        onClick={() => handleLike(submission.id)}
                        className={`flex items-center space-x-2 transition-colors ${
                          submission.isLiked 
                            ? 'text-anarchist-red' 
                            : 'text-anarchist-gray hover:text-anarchist-red'
                        }`}
                      >
                        <span className="text-xl">{submission.isLiked ? '🔥' : '🔥'}</span>
                        <span className="font-brutal font-bold">{submission.likesCount}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 text-anarchist-gray hover:text-anarchist-red transition-colors">
                        <span className="text-xl">💬</span>
                        <span className="font-brutal font-bold">{submission.commentsCount}</span>
                      </button>
                      
                      <button className="flex items-center space-x-2 text-anarchist-gray hover:text-anarchist-red transition-colors">
                        <span className="text-xl">📤</span>
                        <span className="font-brutal font-bold text-sm">SHARE</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-brutal font-bold border ${
                        submission.dare.isCompleted
                          ? 'bg-green-600 border-green-600 text-anarchist-black'
                          : 'bg-anarchist-charcoal border-anarchist-red text-anarchist-red'
                      }`}>
                        {submission.dare.isCompleted ? 'DARE COMPLETE' : 'ACTIVE DARE'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button className="bg-anarchist-red hover:bg-red-700 text-anarchist-black font-brutal font-bold py-3 px-6 uppercase tracking-wider transition-colors border-2 border-anarchist-red">
              LOAD MORE CONTESTANTS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}