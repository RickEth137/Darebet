import { PublicKey } from '@solana/web3.js';

export interface Dare {
  publicKey: PublicKey;
  account: {
    creator: PublicKey;
    platformAuthority: PublicKey;
    title: string;
    description: string;
    deadline: number;
    minBet: number;
    totalPool: number;
    willDoPool: number;
    wontDoPool: number;
    isCompleted: boolean;
    isExpired: boolean;
    completionProof?: CompletionProof;
    creatorFeeClaimed: boolean;
    completerFeeClaimed: boolean;
    submissionCount: number;
    winnersSelected: boolean;
    firstPlaceWinner?: PublicKey;
    secondPlaceWinner?: PublicKey;
    thirdPlaceWinner?: PublicKey;
    firstPlaceClaimed: boolean;
    secondPlaceClaimed: boolean;
    thirdPlaceClaimed: boolean;
    logoUrl?: string;
    bannerUrl?: string;
    bump: number;
  };
}

export interface Bet {
  publicKey: PublicKey;
  account: {
    dare: PublicKey;
    bettor: PublicKey;
    amount: number;
    betType: BetType;
    isClaimed: boolean;
    bump: number;
  };
}

export interface CompletionProof {
  submitter: PublicKey;
  proofHash: string;
  proofDescription: string;
  timestamp: number;
  isApproved: boolean;
  approvedBy: PublicKey;
  approvalTimestamp: number;
}

export enum BetType {
  WillDo = 'WillDo',
  WontDo = 'WontDo',
}

export interface CreateDareParams {
  title: string;
  description: string;
  deadline: number;
  minBet: number;
  logoUrl?: string;
  bannerUrl?: string;
}

export interface PlaceBetParams {
  darePublicKey: PublicKey;
  amount: number;
  betType: BetType;
}

export interface SubmitProofParams {
  darePublicKey: PublicKey;
  proofHash: string;
  proofDescription: string;
}

export interface CashOutParams {
  darePublicKey: PublicKey;
}