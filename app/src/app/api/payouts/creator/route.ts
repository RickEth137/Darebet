import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendPayout } from '@/lib/treasury';
import { verifyWalletSignature } from '@/lib/auth';
import { z } from 'zod';

const CreatorClaimSchema = z.object({
  dareId: z.string(),
  userWallet: z.string(),
  signature: z.string(),
  timestamp: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dareId, userWallet, signature: authSignature, timestamp } = CreatorClaimSchema.parse(body);

    // 1. Verify Auth
    const message = `ClaimCreatorFee:${dareId}:${timestamp}`;
    if (Date.now() - timestamp > 5 * 60 * 1000) {
      return NextResponse.json({ success: false, error: 'Request expired' }, { status: 401 });
    }
    if (!verifyWalletSignature(userWallet, message, authSignature)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 });
    }

    // 2. Fetch Dare
    let dare = await db.dare.findUnique({ where: { id: dareId } });
    if (!dare) dare = await db.dare.findUnique({ where: { onChainId: dareId } });

    if (!dare) {
      return NextResponse.json({ success: false, error: 'Dare not found' }, { status: 404 });
    }

    // 3. Verify Eligibility
    if (dare.creator !== userWallet) {
      return NextResponse.json({ success: false, error: 'Not the creator' }, { status: 403 });
    }

    if (dare.creatorFeeClaimed) {
      return NextResponse.json({ success: false, error: 'Fee already claimed' }, { status: 400 });
    }

    const dareData = dare as any;
    const isCompleted = dareData.status === 'COMPLETED' || dare.isCompleted;
    const isExpired = dareData.status === 'EXPIRED' || (dare.isExpired && !isCompleted);

    if (!isCompleted && !isExpired) {
      return NextResponse.json({ success: false, error: 'Dare not finished yet' }, { status: 400 });
    }

    // 4. Calculate Fee (2% of Total Pool)
    const feeAmount = dare.totalPool * 0.02;

    if (feeAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Pool is empty' }, { status: 400 });
    }

    // 5. Send Payout
    console.log(`Sending creator fee to ${userWallet}: ${feeAmount} SOL`);
    const txSignature = await sendPayout(userWallet, feeAmount);

    // 6. Update DB
    await db.dare.update({
      where: { id: dare.id },
      data: {
        creatorFeeClaimed: true,
      }
    });

    return NextResponse.json({ success: true, signature: txSignature, amount: feeAmount });

  } catch (error) {
    console.error('Error claiming creator fee:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
