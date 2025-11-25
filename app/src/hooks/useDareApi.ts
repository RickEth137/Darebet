import { useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Dare, Bet, CreateDareParams, PlaceBetParams, BetType } from '@/types';
import toast from 'react-hot-toast';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useConnection } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';

// Treasury wallet for receiving bets/fees
const TREASURY_WALLET = new PublicKey('GGXAfALmMiw2jpm6Awn6tmTpRdA3iTQqhh5pfie5dNbW'); 

export const useDareApi = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signMessage } = useWallet();

  const getDares = useCallback(async (): Promise<Dare[]> => {
    try {
      const response = await fetch('/api/dares');
      const data = await response.json();
      if (data.success) {
        console.log('[useDareApi] Raw dares from API:', data.data.length);
        const mappedDares = data.data.map((dbDare: any) => {
          let darePublicKey: PublicKey;
          try {
            if (dbDare.onChainId) {
              darePublicKey = new PublicKey(dbDare.onChainId);
            } else {
              // Generate a deterministic key from ID for off-chain dares
              const encoder = new TextEncoder();
              const encoded = encoder.encode(dbDare.id);
              const bytes = new Uint8Array(32);
              bytes.set(encoded.slice(0, 32));
              darePublicKey = new PublicKey(bytes);
            }
          } catch (e) {
            console.warn('Invalid public key for dare:', dbDare.id);
            darePublicKey = new PublicKey('11111111111111111111111111111111');
          }

          return {
            publicKey: darePublicKey,
            account: {
              creator: new PublicKey(dbDare.creator),
              platformAuthority: TREASURY_WALLET,
              title: dbDare.title,
              description: dbDare.description,
              deadline: new Date(dbDare.deadline).getTime() / 1000,
              minBet: (dbDare.minBet || 0) * 1e9, // Convert SOL to lamports
              totalPool: (dbDare.totalPool || 0) * 1e9,
              willDoPool: (dbDare.willDoPool || 0) * 1e9,
              wontDoPool: (dbDare.wontDoPool || 0) * 1e9,
              isCompleted: dbDare.status === 'COMPLETED',
              isExpired: dbDare.status === 'EXPIRED' || new Date(dbDare.deadline) < new Date(),
              creatorFeeClaimed: dbDare.creatorFeeClaimed || false,
              completerFeeClaimed: dbDare.completerFeeClaimed || false,
              submissionCount: dbDare._count?.proofSubmissions || 0,
              winnersSelected: false,
              firstPlaceClaimed: false,
              secondPlaceClaimed: false,
              thirdPlaceClaimed: false,
              logoUrl: dbDare.logoUrl,
              bannerUrl: dbDare.bannerUrl,
              bump: 0,
            }
          };
        });
        console.log('[useDareApi] Mapped dares:', mappedDares.length);
        return mappedDares;
      }
      return [];
    } catch (error) {
      console.error('Error fetching dares:', error);
      return [];
    }
  }, []);

  const createDare = async (params: CreateDareParams): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      // Optional: Charge a creation fee here via transaction
      // const transaction = new Transaction().add(
      //   SystemProgram.transfer({
      //     fromPubkey: publicKey,
      //     toPubkey: TREASURY_WALLET,
      //     lamports: 0.01 * 1e9, // 0.01 SOL fee
      //   })
      // );
      // const signature = await sendTransaction(transaction, connection);
      // await connection.confirmTransaction(signature, 'confirmed');

      const response = await fetch('/api/dares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: params.title,
          description: params.description,
          creator: publicKey.toString(),
          logoUrl: params.logoUrl,
          bannerUrl: params.bannerUrl,
          deadline: new Date(params.deadline * 1000).toISOString(),
          minBet: params.minBet / 1e9, // Convert to SOL
          // txSignature: signature, // Pass signature if fee charged
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Dare created successfully!');
        return true;
      } else {
        throw new Error(data.error || 'Failed to create dare');
      }
    } catch (error: any) {
      console.error('Error creating dare:', error);
      toast.error(error.message || 'Failed to create dare');
      return false;
    }
  };

  const placeBet = async (params: PlaceBetParams): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      // 1. Send SOL to Treasury
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_WALLET,
          lamports: params.amount, // Amount in lamports
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      // 2. Record Bet in API
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dareId: params.darePublicKey.toString(), // Assuming we pass ID here now, or map it
          // Note: params.darePublicKey might need to be the database ID now. 
          // We'll need to adjust the calling code to pass the DB ID.
          bettor: publicKey.toString(),
          amount: params.amount / 1e9, // Convert to SOL
          betType: params.betType === BetType.WillDo ? 'WILL_DO' : 'WONT_DO',
          txSignature: signature,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Bet placed successfully!');
        return true;
      } else {
        throw new Error(data.error || 'Failed to place bet');
      }
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast.error(error.message || 'Failed to place bet');
      return false;
    }
  };

  const submitProof = async (params: any): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      const response = await fetch('/api/proofs/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dareId: params.darePublicKey.toString(),
          submitter: publicKey.toString(),
          proofHash: params.proofHash,
          description: params.proofDescription,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Proof submitted successfully!');
        return true;
      } else {
        throw new Error(data.error || 'Failed to submit proof');
      }
    } catch (error: any) {
      console.error('Error submitting proof:', error);
      toast.error(error.message || 'Failed to submit proof');
      return false;
    }
  };

  const claimWinnings = async (darePublicKey: PublicKey): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error('Wallet not connected or does not support signing');
      return false;
    }

    try {
      const timestamp = Date.now();
      const message = `ClaimWinnings:${darePublicKey.toString()}:${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureStr = bs58.encode(signature);
      
      const response = await fetch('/api/payouts/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dareId: darePublicKey.toString(),
          userWallet: publicKey.toString(),
          signature: signatureStr,
          timestamp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Winnings claimed! Sent ${data.amount.toFixed(4)} SOL`);
        return true;
      } else {
        throw new Error(data.error || 'Failed to claim winnings');
      }
    } catch (error: any) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings');
      return false;
    }
  };

  const cashOutEarly = async (params: any): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error('Wallet not connected or does not support signing');
      return false;
    }

    try {
      const timestamp = Date.now();
      const message = `CashOut:${params.darePublicKey.toString()}:${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureStr = bs58.encode(signature);

      const response = await fetch('/api/bets/cashout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dareId: params.darePublicKey.toString(),
          userWallet: publicKey.toString(),
          signature: signatureStr,
          timestamp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Cashed out successfully! Refunded ${data.refundAmount.toFixed(4)} SOL`);
        return true;
      } else {
        throw new Error(data.error || 'Failed to cash out');
      }
    } catch (error: any) {
      console.error('Error cashing out:', error);
      toast.error(error.message || 'Failed to cash out');
      return false;
    }
  };

  const claimCreatorFee = async (dareId: string): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      const timestamp = Date.now();
      const message = `ClaimCreatorFee:${dareId}:${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureStr = bs58.encode(signature);

      const response = await fetch('/api/payouts/creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dareId,
          userWallet: publicKey.toString(),
          signature: signatureStr,
          timestamp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Creator fee claimed! Sent ${data.amount.toFixed(4)} SOL`);
        return true;
      } else {
        throw new Error(data.error || 'Failed to claim fee');
      }
    } catch (error: any) {
      console.error('Error claiming creator fee:', error);
      toast.error(error.message || 'Failed to claim fee');
      return false;
    }
  };

  const claimCompleterReward = async (dareId: string): Promise<boolean> => {
    if (!publicKey || !signMessage) {
      toast.error('Wallet not connected');
      return false;
    }

    try {
      const timestamp = Date.now();
      const message = `ClaimCompleterReward:${dareId}:${timestamp}`;
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      const signatureStr = bs58.encode(signature);

      const response = await fetch('/api/payouts/completer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dareId,
          userWallet: publicKey.toString(),
          signature: signatureStr,
          timestamp,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Reward claimed! Sent ${data.amount.toFixed(4)} SOL`);
        return true;
      } else {
        throw new Error(data.error || 'Failed to claim reward');
      }
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      toast.error(error.message || 'Failed to claim reward');
      return false;
    }
  };

  const approveProof = async (darePublicKey: PublicKey, approve: boolean): Promise<boolean> => {
    if (!publicKey) {
      toast.error('Wallet not connected');
      return false;
    }

    // Placeholder for now
    toast.error('Proof approval not yet implemented in API mode');
    return false;
  };

  return {
    getDares,
    createDare,
    placeBet,
    submitProof,
    claimWinnings,
    cashOutEarly,
    approveProof,
    claimCreatorFee,
    claimCompleterReward,
  };
};
