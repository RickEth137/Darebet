import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getTreasuryBalance, getTreasuryPublicKey } from '@/lib/treasury';

export async function GET(request: NextRequest) {
  try {
    // In a real app, add authentication here!
    
    // 1. Get Treasury Info
    const treasuryBalance = await getTreasuryBalance();
    const treasuryPubkey = getTreasuryPublicKey();

    // 2. Get all bets
    const bets = await db.bet.findMany({
      include: {
        dare: {
          select: {
            title: true,
            status: true
          }
        },
        user: {
          select: {
            username: true,
            walletAddress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }) as any; // Cast to any to resolve potential type mismatches during schema updates

    // 3. Calculate expected balance
    let totalBetAmount = 0;
    let totalPayouts = 0; // We would need to track payouts in DB to be accurate

    bets.forEach((bet: any) => {
      totalBetAmount += bet.amount;
      if (bet.isClaimed) {
        // Rough estimate of payout (assuming 1.96x for simplicity, but logic varies)
        // In reality, we should track actual payout amounts in a separate table or field
        totalPayouts += bet.amount * 1.96; 
      }
    });

    // 4. Group by Dare
    const betsByDare: Record<string, any> = {};
    bets.forEach((bet: any) => {
      const dareId = bet.dareId;
      if (!betsByDare[dareId]) {
        betsByDare[dareId] = {
          title: bet.dare.title,
          status: bet.dare.status,
          totalPool: 0,
          bets: []
        };
      }
      betsByDare[dareId].totalPool += bet.amount;
      betsByDare[dareId].bets.push({
        id: bet.id,
        bettor: bet.user.username || bet.bettor,
        amount: bet.amount,
        type: bet.betType,
        txSignature: bet.txSignature,
        verified: !!bet.txSignature // Simplified check
      });
    });

    return NextResponse.json({
      success: true,
      treasury: {
        address: treasuryPubkey,
        currentBalance: treasuryBalance / 1e9, // Convert lamports to SOL
        expectedBalance: (totalBetAmount - totalPayouts), // Very rough estimate
      },
      stats: {
        totalBets: bets.length,
        totalVolume: totalBetAmount,
      },
      reconciliation: betsByDare
    });

  } catch (error) {
    console.error('Error in reconciliation:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
