'use client';

import { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import { Dare, BetType } from '@/types';
import { useDareApi } from '@/hooks/useDareApi';
import { useSocket } from '@/contexts/SocketContext';

import ProofSubmissionModal from './ProofSubmissionModal';
import { CommentModal } from './CommentModal';
import { BetModal } from './BetModal';

interface DareCardProps {
  dare: Dare;
  onUpdate: () => void;
}

export const DareCard: React.FC<DareCardProps> = ({ dare, onUpdate }) => {
  const { publicKey } = useWallet();
  const router = useRouter();
  const { placeBet, submitProof, claimWinnings, cashOutEarly, claimCreatorFee, claimCompleterReward } = useDareApi();
  const { notifyDareUpdate } = useSocket();
  const cardRef = useRef<HTMLDivElement>(null);
  
  const [showBetModal, setShowBetModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentCount, setCommentCount] = useState(0);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  
  const deadline = new Date(dare.account.deadline * 1000);
  const isExpired = Date.now() > deadline.getTime();

  // Betting state
  const [userBets, setUserBets] = useState<any[]>([]);
  const [potentialWinnings, setPotentialWinnings] = useState<number>(0);
  const [hasBet, setHasBet] = useState(false);
  const [allWinningsClaimed, setAllWinningsClaimed] = useState(false);

  // Fetch social data
  const fetchSocialData = async () => {
    try {
      const onChainId = dare.publicKey.toString();
      
      // Fetch likes
      const likeRes = await fetch(`/api/dares/like?onChainId=${onChainId}${publicKey ? `&userWallet=${publicKey.toString()}` : ''}`);
      const likeData = await likeRes.json();
      if (likeData.success) {
        setLikeCount(likeData.likesCount);
        setIsLiked(likeData.isLiked);
      }

      // Fetch comments count
      const commentRes = await fetch(`/api/comments?onChainId=${onChainId}&limit=1`);
      const commentData = await commentRes.json();
      if (commentData.totalCount !== undefined) {
        setCommentCount(commentData.totalCount);
      }
    } catch (error) {
      console.error('Error fetching social data:', error);
    }
  };

  useEffect(() => {
    fetchSocialData();
  }, [dare.publicKey, publicKey]);

  // Fetch user bets
  useEffect(() => {
    const fetchUserBets = async () => {
      if (!publicKey) {
        setUserBets([]);
        setHasBet(false);
        return;
      }
      
      try {
        const res = await fetch(`/api/bets?bettor=${publicKey.toString()}&dareOnChainId=${dare.publicKey.toString()}`);
        const data = await res.json();
        if (data.success) {
          setUserBets(data.data);
          setHasBet(data.data.length > 0);
        }
      } catch (error) {
        console.error('Error fetching user bets:', error);
      }
    };

    fetchUserBets();
  }, [dare.publicKey, publicKey]);

  // Calculate potential winnings
  useEffect(() => {
    // Reset if no bets or dare not in a state to calculate winnings
    if (!userBets.length || (!dare.account.isCompleted && !isExpired)) {
      setPotentialWinnings(0);
      setAllWinningsClaimed(false);
      return;
    }

    let winnings = 0;
    let winningBets: any[] = [];
    const totalPool = dare.account.totalPool; // in lamports
    
    // Determine winning bets based on outcome
    if (dare.account.isCompleted) {
      // Completed -> Will Do wins
      const winningPool = dare.account.willDoPool; // in lamports
      if (winningPool > 0) {
        winningBets = userBets.filter(b => b.betType === 'WILL_DO');
        
        if (winningBets.length > 0) {
          // Sum user bets in SOL and convert to lamports
          const userWinningBetAmountLamports = winningBets.reduce((sum, b) => sum + b.amount, 0) * 1e9;
          
          // Calculate share: Total * 0.48 * (UserShare / TotalWinningShare)
          winnings = totalPool * 0.48 * (userWinningBetAmountLamports / winningPool);
        }
      }
    } else if (isExpired && !dare.account.isCompleted) {
      // Expired & Not Completed -> Won't Do wins
      const winningPool = dare.account.wontDoPool; // in lamports
      if (winningPool > 0) {
        winningBets = userBets.filter(b => b.betType === 'WONT_DO');
        
        if (winningBets.length > 0) {
          // Sum user bets in SOL and convert to lamports
          const userWinningBetAmountLamports = winningBets.reduce((sum, b) => sum + b.amount, 0) * 1e9;
          
          // Calculate share: Total * 0.48 * (UserShare / TotalWinningShare)
          winnings = totalPool * 0.48 * (userWinningBetAmountLamports / winningPool);
        }
      }
    }
    
    // Check if all winning bets are already claimed
    const allClaimed = winningBets.length > 0 && winningBets.every(b => b.isClaimed);
    
    setPotentialWinnings(winnings);
    setAllWinningsClaimed(allClaimed);
  }, [userBets, dare.account, isExpired]);

  // DEBUG: Log when component renders and state changes
  useEffect(() => {
    console.log(`[DareCard] Rendered - ID: ${dare.publicKey.toString().slice(0, 8)}`, {
      showBetModal,
      showProofModal,
      showCommentModal,
      isLoading,
      title: dare.account.title,
      fullPublicKey: dare.publicKey.toString(),
      bannerUrl: dare.account.bannerUrl,
      hasCompletionProof: !!dare.account.completionProof
    });
  }, [showBetModal, showProofModal, showCommentModal, isLoading, dare]);

  // DEBUG: Log when bet modal is toggled
  useEffect(() => {
    if (showBetModal) {
      console.log(`[DareCard] Bet modal opened for: ${dare.account.title.slice(0, 30)}...`);
    }
  }, [showBetModal]);

  // Default images
  const DEFAULT_LOGO = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy';
  const DEFAULT_BANNER = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu';

  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}D ${hours}H ${minutes}M ${seconds}S`);
      } else {
        setTimeLeft(`${hours}H ${minutes}M ${seconds}S`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dare.account.deadline]);
  
  // Check if within 10 minutes of deadline (600,000 milliseconds)
  const tenMinutesFromDeadline = deadline.getTime() - (10 * 60 * 1000);
  const canCashOut = Date.now() < tenMinutesFromDeadline && !isExpired && !dare.account.isCompleted;

  const willDoOdds = dare.account.totalPool > 0 ? 
    ((dare.account.totalPool / dare.account.willDoPool) * 100).toFixed(1) : '0';
  const wontDoOdds = dare.account.totalPool > 0 ? 
    ((dare.account.totalPool / dare.account.wontDoPool) * 100).toFixed(1) : '0';

  const handlePlaceBet = async (amount: string, betType: BetType) => {
    if (!amount || !publicKey) return;
    
    setIsLoading(true);
    try {
      const success = await placeBet({
        darePublicKey: dare.publicKey,
        amount: parseFloat(amount) * 1e6, // Convert to lamports/smallest unit
        betType: betType,
      });
      
      if (success) {
        setShowBetModal(false);
        // Notify all users via WebSocket
        notifyDareUpdate(dare.publicKey.toString(), 'bet-placed');
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
      const isCreator = dare.account.creator.toString() === publicKey.toString();
      const isCompleter = dare.account.completionProof?.submitter.toString() === publicKey.toString();
      
      let success = false;

      // Priority: Creator Fee -> Completer Reward -> Winnings
      // This allows a user who is both creator/completer/bettor to claim all sequentially
      
      if (isCreator && !dare.account.creatorFeeClaimed) {
        success = await claimCreatorFee(dare.publicKey.toString());
        if (success) {
          notifyDareUpdate(dare.publicKey.toString(), 'creator-fee-claimed');
          onUpdate();
          return; // Return to allow UI to update before next claim
        }
      }
      
      if (isCompleter && !dare.account.completerFeeClaimed && dare.account.isCompleted) {
        success = await claimCompleterReward(dare.publicKey.toString());
        if (success) {
          notifyDareUpdate(dare.publicKey.toString(), 'completer-reward-claimed');
          onUpdate();
          return;
        }
      }

      // If we get here, try to claim winnings
      success = await claimWinnings(dare.publicKey);

      if (success) {
        notifyDareUpdate(dare.publicKey.toString(), 'winnings-claimed');
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
        notifyDareUpdate(dare.publicKey.toString(), 'cash-out');
        onUpdate();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!publicKey) return;
    if (isLikeLoading) return;

    // Optimistic update
    const prevIsLiked = isLiked;
    const prevCount = likeCount;
    
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    setIsLikeLoading(true);

    try {
      const response = await fetch('/api/dares/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          onChainId: dare.publicKey.toString(),
          userWallet: publicKey.toString()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setLikeCount(data.likesCount);
        setIsLiked(data.isLiked);
      } else {
        // Revert on error
        setIsLiked(prevIsLiked);
        setLikeCount(prevCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      setIsLiked(prevIsLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLikeLoading(false);
    }
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
    <div 
      ref={cardRef}
      className="bg-anarchist-black border-2 border-anarchist-red shadow-lg overflow-hidden flex flex-col h-full"
      style={{ maxHeight: '800px' }}
    >
      {/* Banner Image - 3:1 aspect ratio for 1500x500 - Clickable to navigate */}
      <div 
        className="relative w-full overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ height: '130px', minHeight: '130px', maxHeight: '130px' }}
        onClick={handleNavigateToDare}
      >
        <img 
          src={dare.account.bannerUrl || DEFAULT_BANNER} 
          alt="Dare banner"
          className="absolute inset-0 w-full h-full object-cover bg-anarchist-charcoal"
          style={{ objectFit: 'cover' }}
          onLoad={(e) => {
            console.log(`[DareCard] Banner loaded for: ${dare.account.title.slice(0, 30)}...`, {
              naturalWidth: (e.target as HTMLImageElement).naturalWidth,
              naturalHeight: (e.target as HTMLImageElement).naturalHeight,
              displayWidth: (e.target as HTMLImageElement).width,
              displayHeight: (e.target as HTMLImageElement).height,
              parentHeight: (e.target as HTMLImageElement).parentElement?.offsetHeight
            });
          }}
          onError={(e) => {
            console.log(`[DareCard] Banner failed to load, using default for: ${dare.account.title.slice(0, 30)}...`);
            (e.target as HTMLImageElement).src = DEFAULT_BANNER;
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Logo positioned at top left corner, overlapping banner */}
        <img 
          src={dare.account.logoUrl || DEFAULT_LOGO} 
          alt="Dare logo"
          className="absolute top-2 left-2 w-[46px] h-[46px] object-cover rounded-full border-2 border-anarchist-red bg-anarchist-black"
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
        
        {/* Entries counter positioned at bottom right corner, overlapping banner - CLICKABLE */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/daretok/${dare.publicKey.toString()}`);
          }}
          className="absolute bottom-2 right-2 bg-anarchist-black bg-opacity-80 px-2 py-1 border border-anarchist-red flex items-center space-x-1.5 hover:bg-anarchist-red hover:bg-opacity-80 transition-colors cursor-pointer"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="w-4 h-4 text-anarchist-red group-hover:text-anarchist-offwhite" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span className="text-xs font-brutal font-bold text-anarchist-offwhite uppercase tracking-wider">
            {dare.account.submissionCount || 0} ENTRIES
          </span>
        </button>
        
        {/* Deadline countdown positioned at bottom left corner, overlapping banner */}
        <div className="absolute bottom-2 left-2 bg-anarchist-black bg-opacity-80 px-2 py-1 border border-anarchist-red">
          <span className="text-xs font-brutal font-bold text-anarchist-offwhite uppercase tracking-wider">
            {timeLeft}
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
          <div className="space-y-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setShowBetModal(true)}
                className="flex-1 bg-anarchist-red hover:bg-red-700 text-anarchist-black py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-anarchist-red"
              >
                PLACE BET
              </button>
              <button
                onClick={handleSubmitProof}
                className="flex-1 bg-green-600 hover:bg-green-700 text-anarchist-black py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 border-green-600"
              >
                ENTER DARE
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
        </div>
      )}

      {/* Show claim button for winning bets, creator fees, or completer rewards */}
      {publicKey && (dare.account.isCompleted || isExpired) && (
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          {(() => {
            const isCreator = dare.account.creator.toString() === publicKey.toString();
            const isCompleter = dare.account.completionProof?.submitter.toString() === publicKey.toString();
            const hasFunds = dare.account.totalPool > 0;
            
            const canClaimCreator = isCreator && !dare.account.creatorFeeClaimed && hasFunds;
            const canClaimCompleter = isCompleter && !dare.account.completerFeeClaimed && dare.account.isCompleted && hasFunds;
            const canClaimWinnings = hasBet && potentialWinnings > 0 && !allWinningsClaimed;
            
            const canClaimAnything = canClaimCreator || canClaimCompleter || canClaimWinnings;
            
            // Determine button text
            let buttonText = 'NO CLAIM AVAILABLE';
            if (isLoading) buttonText = 'CLAIMING...';
            else if (canClaimCreator) buttonText = 'CLAIM CREATOR FEE (2%)';
            else if (isCreator && !dare.account.creatorFeeClaimed && !hasFunds) buttonText = 'NO CREATOR FEE (0 SOL)';
            else if (canClaimCompleter) buttonText = 'CLAIM REWARD (50%)';
            else if (canClaimWinnings) buttonText = `CLAIM WINNINGS (${(potentialWinnings / 1e9).toFixed(4)} SOL)`;
            else if (allWinningsClaimed) buttonText = 'WINNINGS CLAIMED';
            else if (hasBet) buttonText = 'NO WINNINGS'; // Bet but lost
            else buttonText = 'NO BET PLACED'; // Didn't bet
            
            return (
              <button
                onClick={handleClaimWinnings}
                disabled={isLoading || !canClaimAnything}
                className={`w-full py-2 px-3 text-xs font-brutal font-bold uppercase tracking-wider transition-colors border-2 
                  ${(isLoading || !canClaimAnything)
                    ? 'bg-anarchist-charcoal text-anarchist-gray border-anarchist-gray cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700 text-anarchist-black border-green-600'
                  }`}
              >
                {buttonText}
              </button>
            );
          })()}
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
          dare={dare}
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
          onCommentAdded={() => {
            fetchSocialData();
          }}
        />
      )}

      {/* Bet Modal */}
      <BetModal
        isOpen={showBetModal}
        onClose={() => setShowBetModal(false)}
        onPlaceBet={handlePlaceBet}
        minBet={dare.account.minBet / 1e9}
        willDoOdds={willDoOdds}
        wontDoOdds={wontDoOdds}
        dareTitle={dare.account.title}
        isLoading={isLoading}
      />
    </div>
  );
};
