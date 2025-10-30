'use client';

import { useState, useEffect } from 'react';
import { useDareProgram } from '@/hooks/useDareProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Dare } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface AdminProofApprovalProps {
  darePublicKey: PublicKey;
  dare: Dare;
  onApprovalUpdate?: () => void;
}

export const AdminProofApproval: React.FC<AdminProofApprovalProps> = ({
  darePublicKey,
  dare,
  onApprovalUpdate
}) => {
  const { approveProof } = useDareProgram();
  const { publicKey } = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if current user is the platform authority
  const isPlatformAuthority = publicKey && 
    dare.account.platformAuthority.toString() === publicKey.toString();

  const completionProof = dare.account.completionProof;

  const handleApproval = async (approve: boolean) => {
    if (!isPlatformAuthority || !completionProof) return;

    setIsProcessing(true);
    try {
      const success = await approveProof(darePublicKey, approve);
      if (success && onApprovalUpdate) {
        onApprovalUpdate();
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if no proof or user is not platform authority
  if (!completionProof || !isPlatformAuthority) {
    return null;
  }

  // Check if proof is already processed
  const isAlreadyProcessed = completionProof.approvalTimestamp > 0;

  return (
    <div className="bg-anarchist-charcoal border-2 border-anarchist-red p-6 mt-6">
      <h3 className="text-xl font-brutal font-bold text-anarchist-red uppercase tracking-wider mb-4">
        🔴 Admin Proof Review Required
      </h3>
      
      <div className="bg-anarchist-black border border-anarchist-gray p-4 mb-4">
        <div className="mb-3">
          <p className="text-sm font-brutal text-anarchist-gray uppercase tracking-wider mb-1">Submitter</p>
          <p className="font-brutal text-anarchist-white font-mono">
            {completionProof.submitter.toString()}
          </p>
        </div>
        
        <div className="mb-3">
          <p className="text-sm font-brutal text-anarchist-gray uppercase tracking-wider mb-1">Submitted</p>
          <p className="font-brutal text-anarchist-white">
            {formatDistanceToNow(new Date(completionProof.timestamp * 1000), { addSuffix: true })}
          </p>
        </div>
        
        <div className="mb-3">
          <p className="text-sm font-brutal text-anarchist-gray uppercase tracking-wider mb-1">Proof Hash</p>
          <p className="font-brutal text-anarchist-white font-mono text-sm break-all">
            {completionProof.proofHash}
          </p>
        </div>
        
        <div>
          <p className="text-sm font-brutal text-anarchist-gray uppercase tracking-wider mb-1">Description</p>
          <p className="font-brutal text-anarchist-white">
            {completionProof.proofDescription}
          </p>
        </div>
      </div>

      {isAlreadyProcessed ? (
        <div className="bg-anarchist-black border border-anarchist-gray p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`text-xl ${completionProof.isApproved ? '✅' : '❌'}`}></span>
            <span className={`font-brutal font-bold uppercase tracking-wider ${
              completionProof.isApproved ? 'text-green-400' : 'text-red-400'
            }`}>
              {completionProof.isApproved ? 'Approved' : 'Rejected'}
            </span>
          </div>
          <p className="text-sm font-brutal text-anarchist-gray">
            By: {completionProof.approvedBy.toString()}
          </p>
          <p className="text-sm font-brutal text-anarchist-gray">
            {formatDistanceToNow(new Date(completionProof.approvalTimestamp * 1000), { addSuffix: true })}
          </p>
        </div>
      ) : (
        <div className="flex space-x-4">
          <button
            onClick={() => handleApproval(true)}
            disabled={isProcessing}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-brutal font-bold py-3 px-6 uppercase tracking-wider transition-colors border-2 border-green-500"
          >
            {isProcessing ? 'Processing...' : '✅ Approve'}
          </button>
          
          <button
            onClick={() => handleApproval(false)}
            disabled={isProcessing}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-brutal font-bold py-3 px-6 uppercase tracking-wider transition-colors border-2 border-red-500"
          >
            {isProcessing ? 'Processing...' : '❌ Reject'}
          </button>
        </div>
      )}

      <div className="mt-4 p-3 bg-anarchist-black border border-anarchist-gray">
        <p className="text-xs font-brutal text-anarchist-gray uppercase tracking-wider">
          ⚠️ Review the proof carefully. Winners can only claim rewards after approval.
        </p>
      </div>
    </div>
  );
};