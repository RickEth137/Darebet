import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPayout } from '@/lib/treasury';
import { verifyWalletSignature } from '@/lib/auth';
import { z } from 'zod';

const CashOutSchema = z.object({
  dareId: z.string(),
  userWallet: z.string(),
  signature: z.string(), // Required for auth
  timestamp: z.number(), // Prevent replay
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dareId, userWallet, signature: authSignature, timestamp } = CashOutSchema.parse(body);

    // 1. Verify Authentication
    // Message format: "CashOut:{dareId}:{timestamp}"
    const message = `CashOut:${dareId}:${timestamp}`;
    
    // Check timestamp freshness (5 minutes)
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({ success: false, error: 'Request expired' }, { status: 401 });
    }

    const isValid = verifyWalletSignature(userWallet, message, authSignature);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    // Fetch Dare and User's Bet
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

    // Check deadline (10 min rule)
    const deadline = new Date(dare.deadline).getTime();
    const now = Date.now();
    if (now > deadline - 10 * 60 * 1000) {
      return NextResponse.json({ success: false, error: 'Too close to deadline to cash out' }, { status: 400 });
    }

    const userBet = dare.bets.find((b: any) => b.bettor === userWallet && !b.isClaimed && !b.isEarlyCashOut && b.status === 'PLACED');

    if (!userBet) {
      return NextResponse.json({ success: false, error: 'No active bet found' }, { status: 400 });
    }

    // Calculate Refund (90%)
    const refundAmount = userBet.amount * 0.90;

    // Send Refund
    console.log(`Processing cashout for ${userWallet}: ${refundAmount} SOL`);
    const signature = await sendPayout(userWallet, refundAmount);

    // Update Bet
    await db.bet.update({
      where: { id: userBet.id },
      data: {
        status: 'CASHED_OUT',
        isEarlyCashOut: true,
        payoutSignature: signature
      } as any
    });

    // Update Dare Pools
    const poolUpdate = userBet.betType === 'WILL_DO' 
      ? { willDoPool: { decrement: userBet.amount } }
      : { wontDoPool: { decrement: userBet.amount } };

    await db.dare.update({
      where: { id: dare.id },
      data: {
        totalPool: { decrement: userBet.amount },
        ...poolUpdate
      }
    });

    return NextResponse.json({ 
      success: true, 
      signature,
      refundAmount 
    });

  } catch (error) {
    console.error('Error cashing out:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
