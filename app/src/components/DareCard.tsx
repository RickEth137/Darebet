'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { Dare, BetType } from '@/types';
import { useDareProgram } from '@/hooks/useDareProgram';
import { formatDistanceToNow } from 'date-fns';
import ProofSubmissionModal from './ProofSubmissionModal';
import { CommentModal } from './CommentModal';

interface DareCardProps {
  dare: Dare;
  onUpdate: () => void;
}

export const DareCard: React.FC<DareCardProps> = ({ dare, onUpdate }) => {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { placeBet, submitProof, claimWinnings, cashOutEarly } = useDareProgram();
  
  const [betAmount, setBetAmount] = useState('');
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BetType.WillDo);
  const [showBetForm, setShowBetForm] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 50) + 10); // Mock like count
  const [commentCount, setCommentCount] = useState(Math.floor(Math.random() * 25) + 5); // Mock comment count

  // Default images
  const DEFAULT_LOGO = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy';
  const DEFAULT_BANNER = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu';

  const deadline = new Date(dare.account.deadline * 1000);
  const isExpired = Date.now() > deadline.getTime();
  const timeRemaining = isExpired ? 'Expired' : formatDistanceToNow(deadline, { addSuffix: true });
  
  // Check if within 10 minutes of deadline (600,000 milliseconds)
  const tenMinutesFromDeadline = deadline.getTime() - (10 * 60 * 1000);
  const canCashOut = Date.now() < tenMinutesFromDeadline && !isExpired && !dare.account.isCompleted;

  const willDoOdds = dare.account.totalPool > 0 ? 
    ((dare.account.totalPool / dare.account.willDoPool) * 100).toFixed(1) : '0';
  const wontDoOdds = dare.account.totalPool > 0 ? 
    ((dare.account.totalPool / dare.account.wontDoPool) * 100).toFixed(1) : '0';

  const handlePlaceBet = async () => {
    if (!betAmount || !publicKey) return;
    
    setIsLoading(true);
    try {
      const success = await placeBet({
        darePublicKey: dare.publicKey,
        amount: parseFloat(betAmount) * 1e6, // Convert to lamports/smallest unit
        betType: selectedBetType,
      });
      
      if (success) {
        setBetAmount('');
        setShowBetForm(false);
        onUpdate();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitProof = () => {
    setShowProofModal(true);
  };

  const handleNavigateToDare = () => {
    router.push(`/dare/${dare.publicKey.toString()}`);
  };

  const handleClaimWinnings = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      const success = await claimWinnings(dare.publicKey);
      if (success) {
        onUpdate();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCashOut = async () => {
    if (!publicKey) return;
    
    setIsLoading(true);
    try {
      const success = await cashOutEarly({
        darePublicKey: dare.publicKey,
      });
      if (success) {
        onUpdate();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    // Open comment modal instead of navigating
    setShowCommentModal(true);
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/dare/${dare.publicKey.toString()}`;
    const shareText = `Check out this dare: ${dare.account.title}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: dare.account.title,
          text: shareText,
          url: shareUrl,
        });
      } catch (error) {
        // Fallback to copying to clipboard
        copyToClipboard(shareUrl);
      }
    } else {
      // Fallback to copying to clipboard
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could show a toast notification here
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="bg-anarchist-black border-2 border-anarchist-red shadow-lg overflow-hidden flex flex-col h-full">
      {/* Banner Image - 3:1 aspect ratio for 1500x500 - Clickable to navigate */}
      <div 
        className="aspect-[3/1] bg-anarchist-charcoal relative overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={handleNavigateToDare}
      >
        <img 
          src={dare.account.bannerUrl || DEFAULT_BANNER} 
          alt="Dare banner"
          className="w-full h-full object-contain bg-anarchist-charcoal"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_BANNER;
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Logo positioned at bottom left corner, overlapping banner */}
        <img 
          src={dare.account.logoUrl || DEFAULT_LOGO} 
          alt="Dare logo"
          className="absolute bottom-2 left-2 w-[46px] h-[46px] object-cover border border-anarchist-red bg-anarchist-black"
          onError={(e) => {
            (e.target as HTMLImageElement).src = DEFAULT_LOGO;
          }}
        />
        
        {/* Status and Details buttons positioned at top right corner, overlapping banner */}
        <div className="absolute top-2 right-2 flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs font-brutal font-bold uppercase tracking-wider border ${
            dare.account.isCompleted ? 'bg-green-600 text-anarchist-black border-green-600' :
            isExpired ? 'bg-anarchist-red text-anarchist-black border-anarchist-red' :
            'bg-green-600 text-anarchist-black border-green-600'
          }`}>
            {dare.account.isCompleted ? 'COMPLETED' : isExpired ? 'EXPIRED' : 'ACTIVE'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNavigateToDare();
            }}
            className="text-anarchist-red hover:text-anarchist-offwhite text-xs font-brutal font-bold uppercase tracking-wider underline bg-anarchist-black bg-opacity-70 px-2 py-1 border border-anarchist-red"
            title="View Details"
          >
            DETAILS
          </button>
        </div>
        
        {/* Deadline countdown positioned at bottom right corner, overlapping banner */}
        <div className="absolute bottom-2 right-2 bg-anarchist-black bg-opacity-80 px-2 py-1 border border-anarchist-red">
          <span className="text-xs font-brutal font-bold text-anarchist-offwhite uppercase tracking-wider">
            {isExpired ? 'EXPIRED' : timeRemaining.toUpperCase()}
          </span>
        </div>
      </div>

      <div 
        className="p-4 flex flex-col flex-grow cursor-pointer hover:bg-opacity-80 hover:bg-anarchist-charcoal transition-colors"
        onClick={handleNavigateToDare}
      >
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex-grow">
              <h3 className="text-lg font-brutal font-bold text-anarchist-offwhite uppercase tracking-wider line-clamp-1">
                {dare.account.title}
              </h3>
              <p className="text-xs text-anarchist-gray font-brutal uppercase tracking-wider">
                Created by {dare.account.creator.toString().slice(0, 8)}...
              </p>
            </div>
          </div>
        </div>

      <p className="text-anarchist-white text-xs mb-3 font-brutal line-clamp-2 flex-shrink-0">
        {dare.account.description}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="text-center p-2 bg-anarchist-charcoal border border-anarchist-red">
          <div className="text-lg font-brutal font-bold text-anarchist-red">
            {(dare.account.willDoPool / 1e9).toFixed(2)} SOL
          </div>
          <div className="text-xs text-anarchist-offwhite font-brutal uppercase tracking-wider">Will Do ({willDoOdds}%)</div>
        </div>
        
        <div className="text-center p-2 bg-anarchist-charcoal border border-anarchist-red">
          <div className="text-lg font-brutal font-bold text-anarchist-red">
            {(dare.account.wontDoPool / 1e9).toFixed(2)} SOL
          </div>
          <div className="text-xs text-anarchist-offwhite font-brutal uppercase tracking-wider">Won't Do ({wontDoOdds}%)</div>
        </div>
      </div>

      {/* Enhanced betting info display */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-anarchist-black border border-anarchist-gray p-2 text-center">
          <div className="text-xs text-anarchist-gray font-brutal uppercase tracking-wider mb-1">MIN BET</div>
          <div className="text-sm font-brutal font-bold text-anarchist-offwhite">
            {(dare.account.minBet / 1e9).toFixed(2)} SOL
          </div>
        </div>
        
        <div className="bg-anarchist-black border border-anarchist-gray p-2 text-center">
          <div className="text-xs text-anarchist-gray font-brutal uppercase tracking-wider mb-1">TOTAL POOL</div>
          <div className="text-sm font-brutal font-bold text-anarchist-red">
            {(dare.account.totalPool / 1e9).toFixed(2)} SOL
          </div>
        </div>
      </div>

      {!canCashOut && !isExpired && !dare.account.isCompleted && (
        <div className="text-anarchist-red text-xs mb-3 font-brutal text-center bg-anarchist-charcoal border border-anarchist-red p-2 flex-shrink-0">
          ⚠️ LEAVING BET UNAVAILABLE IN LAST 10 MINUTES
        </div>
      )}

      {dare.account.completionProof && (
        <div className="bg-anarchist-charcoal border border-green-600 p-2 mb-3 flex-shrink-0">
          <div className="text-xs font-brutal font-bold text-green-600 uppercase tracking-wider">PROOF SUBMITTED</div>
          <div className="text-xs text-anarchist-offwhite mt-1 font-brutal line-clamp-2">
            {dare.account.completionProof.proofDescription}
          </div>
        </div>
      )}

      {/* Spacer to push buttons to bottom */}
      <div className="flex-grow"></div>

      {publicKey && !dare.account.isCompleted && !isExpired && (
        <div className="space-y-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {!showBetForm && (
            <div className="space-y-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBetForm(true)}
                  className="flex-1 bg-anarchist-red hover:bg-red-700 text-anarchist-black py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red"
                >
                  PLACE BET
                </button>
                <button
                  onClick={handleSubmitProof}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-anarchist-black py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-green-600"
                >
                  RECORD PROOF
                </button>
              </div>
              
              {/* Leave Bet Button - Show if user has placed a bet and can leave */}
              {canCashOut && (
                <button
                  onClick={handleCashOut}
                  disabled={isLoading}
                  className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-anarchist-charcoal text-anarchist-black py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-yellow-600"
                >
                  {isLoading ? 'LEAVING BET...' : 'LEAVE THE BET (10% PENALTY)'}
                </button>
              )}
            </div>
          )}

          {showBetForm && (
            <div className="space-y-2 p-3 bg-anarchist-charcoal border border-anarchist-red">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedBetType(BetType.WillDo)}
                  className={`flex-1 py-2 px-2 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border ${
                    selectedBetType === BetType.WillDo
                      ? 'bg-green-600 text-anarchist-black border-green-600'
                      : 'bg-anarchist-black text-anarchist-offwhite border-anarchist-gray hover:border-anarchist-red'
                  }`}
                >
                  WILL DO
                </button>
                <button
                  onClick={() => setSelectedBetType(BetType.WontDo)}
                  className={`flex-1 py-2 px-2 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border ${
                    selectedBetType === BetType.WontDo
                      ? 'bg-anarchist-red text-anarchist-black border-anarchist-red'
                      : 'bg-anarchist-black text-anarchist-offwhite border-anarchist-gray hover:border-anarchist-red'
                  }`}
                >
                  WON'T DO
                </button>
              </div>
              
              <input
                type="number"
                placeholder="BET AMOUNT (SOL)"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full px-2 py-2 bg-anarchist-black border border-anarchist-gray text-anarchist-offwhite font-brutal text-xs uppercase tracking-wider focus:border-anarchist-red focus:outline-none"
                step="0.01"
                min={dare.account.minBet / 1e9}
              />
              
              <div className="flex space-x-2">
                <button
                  onClick={handlePlaceBet}
                  disabled={isLoading || !betAmount}
                  className={`flex-1 py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red ${
                    !betAmount 
                      ? 'bg-anarchist-red text-anarchist-offwhite' 
                      : 'bg-anarchist-red hover:bg-red-700 text-anarchist-black'
                  } ${isLoading ? 'bg-anarchist-charcoal' : ''}`}
                >
                  {isLoading ? 'PLACING...' : 'PLACE BET'}
                </button>
                <button
                  onClick={() => setShowBetForm(false)}
                  className="px-3 py-2 border border-anarchist-gray text-anarchist-offwhite text-xs font-brutal font-bold uppercase tracking-wider hover:border-anarchist-red transition-colors"
                >
                  CANCEL
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Show claim button for winning bets */}
      {publicKey && (dare.account.isCompleted || isExpired) && (
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleClaimWinnings}
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-anarchist-charcoal text-anarchist-black py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-green-600"
          >
            {isLoading ? 'CLAIMING...' : 'CLAIM WINNINGS'}
          </button>
        </div>
      )}

      {(!publicKey || (isExpired && !dare.account.isCompleted)) && (
        <div className="text-center flex-shrink-0">
          {!publicKey && (
            <p className="text-anarchist-offwhite text-xs font-brutal">CONNECT WALLET TO BET</p>
          )}
          {isExpired && !dare.account.isCompleted && (
            <p className="text-anarchist-red text-xs font-brutal">DARE EXPIRED</p>
          )}
        </div>
      )}
      </div>
      
      {/* Social Interaction Bar */}
      <div className="bg-anarchist-charcoal border-t border-anarchist-gray p-3 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        {/* Left side - Like and Comment */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 transition-colors hover:text-anarchist-red ${
              isLiked ? 'text-anarchist-red' : 'text-anarchist-offwhite'
            }`}
            title={isLiked ? 'Unlike' : 'Like'}
          >
            <span className="text-sm">{isLiked ? '❤️' : '🤍'}</span>
            <span className="text-xs font-brutal font-bold">{likeCount}</span>
          </button>
          
          <button
            onClick={handleComment}
            className="flex items-center space-x-1 text-anarchist-offwhite hover:text-anarchist-red transition-colors"
            title="View Comments"
          >
            <span className="text-sm">💬</span>
            <span className="text-xs font-brutal font-bold">{commentCount}</span>
          </button>
        </div>

        {/* Right side - Share */}
        <button
          onClick={handleShare}
          className="flex items-center space-x-1 text-anarchist-offwhite hover:text-anarchist-red transition-colors"
          title="Share Dare"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          <span className="text-xs font-brutal font-bold uppercase tracking-wider">SHARE</span>
        </button>
      </div>
      
      {/* Proof Upload Modal */}
      {showProofModal && (
        <ProofSubmissionModal
          isOpen={showProofModal}
          onClose={() => setShowProofModal(false)}
          dareId={dare.publicKey.toString()}
          dareTitle={dare.account.title}
          onSubmissionComplete={() => {
            setShowProofModal(false);
            onUpdate();
          }}
        />
      )}

      {/* Comment Modal */}
      {showCommentModal && (
        <CommentModal
          dare={dare}
          onClose={() => setShowCommentModal(false)}
        />
      )}
    </div>
  );
};
