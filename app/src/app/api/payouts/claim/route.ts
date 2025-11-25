import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPayout } from '@/lib/treasury';
import { verifyWalletSignature } from '@/lib/auth';
import { z } from 'zod';

const ClaimSchema = z.object({
  dareId: z.string(), // Can be DB ID or onChainId (we'll check both)
  userWallet: z.string(),
  signature: z.string().optional(), // Optional for now to support legacy calls, but should be required
  timestamp: z.number().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dareId, userWallet, signature: authSignature, timestamp } = ClaimSchema.parse(body);

    // 0. Verify Auth
    const message = `ClaimWinnings:${dareId}:${timestamp}`;
    
    // Check timestamp freshness (5 minutes)
    if (!timestamp || Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({ success: false, error: 'Request expired or missing timestamp' }, { status: 401 });
    }

    if (!authSignature) {
       return NextResponse.json({ success: false, error: 'Signature required' }, { status: 401 });
    }

    const isValid = verifyWalletSignature(userWallet, message, authSignature);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    // 1. Fetch Dare and Bets
    // Try finding by ID first, then onChainId
    let dare = await db.dare.findUnique({
      where: { id: dareId },
      include: { bets: true }
    });

    if (!dare) {
      dare = await db.dare.findUnique({
        where: { onChainId: dareId },
        include: { bets: true }
      });
    }

    if (!dare) {
      return NextResponse.json({ success: false, error: 'Dare not found' }, { status: 404 });
    }

    // Check status
    // We support both the new 'status' field and the legacy boolean flags
    const dareData = dare as any;
    const isCompleted = dareData.status === 'COMPLETED' || dare.isCompleted;
    const isExpired = dareData.status === 'EXPIRED' || (dare.isExpired && !isCompleted);

    if (!isCompleted && !isExpired) {
      return NextResponse.json({ success: false, error: 'Dare not completed or expired' }, { status: 400 });
    }

    // 2. Determine if user is a winner
    const winningType = isCompleted ? 'WILL_DO' : 'WONT_DO';
    
    const userBet = dare.bets.find((b: any) => b.bettor === userWallet && b.betType === winningType);
    
    if (!userBet) {
       return NextResponse.json({ success: false, error: 'No winning bet found for this user' }, { status: 400 });
    }

    if (userBet.isClaimed) {
      return NextResponse.json({ success: false, error: 'Winnings already claimed' }, { status: 400 });
    }

    // 3. Calculate Payout
    // Formula: Total Pool * 0.48 (48% to bettors) * (User Bet Amount / Winning Pool Total)
    
    const winningPoolTotal = winningType === 'WILL_DO' ? dare.willDoPool : dare.wontDoPool;
    const totalPool = dare.totalPool;
    
    if (winningPoolTotal === 0) {
        return NextResponse.json({ success: false, error: 'Winning pool is empty' }, { status: 400 });
    }

    const bettorShare = 0.48; // 48% of total pool goes to winning bettors
    const userShare = userBet.amount / winningPoolTotal;
    const payoutAmount = totalPool * bettorShare * userShare;

    if (payoutAmount <= 0) {
        return NextResponse.json({ success: false, error: 'Payout amount is zero' }, { status: 400 });
    }

    // 4. Send Payout
    console.log(`Processing payout for ${userWallet}: ${payoutAmount} SOL`);
    const signature = await sendPayout(userWallet, payoutAmount);

    // 5. Update DB
    await db.bet.update({
      where: { id: userBet.id },
      data: { 
        isClaimed: true,
        payoutSignature: signature,
        status: 'WON'
      } as any
    });

    return NextResponse.json({ 
      success: true, 
      signature,
      amount: payoutAmount 
    });

  } catch (error) {
    console.error('Error processing payout:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
