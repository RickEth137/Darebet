'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface ProofSubmission {
  id: string;
  mediaUrl: string;
  description: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  submittedAt: string;
  user: {
    walletAddress: string;
  };
  dare: {
    title: string;
    onChainId: string;
  };
}

interface ProofSubmissionsListProps {
  dareOnChainId?: string;
  submitter?: string;
  limit?: number;
}

export const ProofSubmissionsList: React.FC<ProofSubmissionsListProps> = ({
  dareOnChainId,
  submitter,
  limit = 10
}) => {
  const [submissions, setSubmissions] = useState<ProofSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, [dareOnChainId, submitter]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (dareOnChainId) params.append('dareOnChainId', dareOnChainId);
      if (submitter) params.append('submitter', submitter);
      
      const response = await fetch(`/api/proof-submissions?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.data.slice(0, limit));
      } else {
        setError('Failed to load proof submissions');
      }
    } catch (err) {
      setError('Error loading proof submissions');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const getMediaTypeIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'VIDEO':
        return 'VID';
      case 'IMAGE':
        return 'IMG';
      case 'AUDIO':
        return 'AUD';
      case 'DOCUMENT':
        return 'DOC';
      default:
        return 'FILE';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-anarchist-charcoal border border-anarchist-red p-4 animate-pulse">
            <div className="h-4 bg-anarchist-gray rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-anarchist-gray rounded w-1/2 mb-2"></div>
            <div className="h-20 bg-anarchist-gray rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-anarchist-charcoal border-2 border-anarchist-red p-4 text-center">
        <p className="text-anarchist-red font-brutal font-bold uppercase tracking-wider">{error}</p>
        <button 
          onClick={fetchSubmissions}
          className="mt-2 text-anarchist-offwhite font-brutal text-sm uppercase underline hover:text-anarchist-red transition-colors"
        >
          Try again
        </button>
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <div className="bg-anarchist-charcoal border-2 border-anarchist-red p-8 text-center">
        <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-2">No Proof Submissions</h3>
        <p className="text-anarchist-offwhite font-brutal text-sm">
          {dareOnChainId ? 'No proofs have been submitted for this dare yet.' : 'No proof submissions found.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-4">
        Proof Submissions {dareOnChainId && `(${submissions.length})`}
      </h3>
      
      {submissions.map((submission) => (
        <div key={submission.id} className="bg-anarchist-charcoal border-2 border-anarchist-red p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-brutal font-bold text-anarchist-red bg-anarchist-black border border-anarchist-red px-2 py-1 uppercase tracking-wider">
                {getMediaTypeIcon(submission.mediaType)}
              </span>
              <div>
                <p className="font-brutal font-bold text-anarchist-white">
                  {formatAddress(submission.user.walletAddress)}
                </p>
                <p className="text-xs font-brutal text-anarchist-gray uppercase tracking-wider">
                  {formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <span className="px-2 py-1 bg-anarchist-black border border-anarchist-red text-anarchist-red text-xs font-brutal font-bold uppercase tracking-wider">
              {submission.mediaType}
            </span>
          </div>

          {!dareOnChainId && (
            <div className="mb-3 p-2 bg-anarchist-black border border-anarchist-gray">
              <p className="text-sm font-brutal font-bold text-anarchist-offwhite uppercase tracking-wider">
                Dare: {submission.dare.title}
              </p>
            </div>
          )}

          <p className="text-anarchist-offwhite font-brutal text-sm mb-3">{submission.description}</p>

          {/* Media Preview */}
          <div className="bg-anarchist-black border border-anarchist-gray p-3">
            {submission.mediaType === 'IMAGE' && (
              <img 
                src={submission.mediaUrl} 
                alt="Proof submission"
                className="max-w-full max-h-64 mx-auto object-contain border border-anarchist-gray"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            
            {submission.mediaType === 'VIDEO' && (
              <video 
                src={submission.mediaUrl} 
                controls 
                className="max-w-full max-h-64 mx-auto border border-anarchist-gray"
                onError={(e) => {
                  (e.target as HTMLVideoElement).style.display = 'none';
                }}
              />
            )}
            
            {submission.mediaType === 'AUDIO' && (
              <audio 
                src={submission.mediaUrl} 
                controls 
                className="w-full"
                onError={(e) => {
                  (e.target as HTMLAudioElement).style.display = 'none';
                }}
              />
            )}
            
            {(submission.mediaType === 'DOCUMENT' || 
              (!['IMAGE', 'VIDEO', 'AUDIO'].includes(submission.mediaType))) && (
              <div className="text-center py-8">
                <div className="text-anarchist-red font-brutal font-bold text-2xl mb-2 uppercase tracking-wider">DOCUMENT</div>
                <a 
                  href={submission.mediaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-anarchist-offwhite font-brutal text-sm uppercase tracking-wider underline hover:text-anarchist-red transition-colors"
                >
                  View Document
                </a>
              </div>
            )}
            
            {/* Fallback link if media fails to load */}
            <div className="mt-2 text-center">
              <a 
                href={submission.mediaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs font-brutal text-anarchist-gray uppercase tracking-wider underline hover:text-anarchist-red transition-colors"
              >
                View Original File
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
