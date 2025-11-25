import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { verifyTransaction } from '@/lib/treasury';

const BetSchema = z.object({
  onChainId: z.string().optional(),
  bettor: z.string(),
  dareId: z.string().optional(), // Use internal ID
  dareOnChainId: z.string().optional(), // Legacy/Hybrid
  amount: z.number(),
  betType: z.enum(['WILL_DO', 'WONT_DO']),
  txSignature: z.string(), // Made required for verification
});

// Helper function to ensure user exists
async function ensureUserExists(walletAddress: string) {
  let user = await db.user.findUnique({
    where: { walletAddress }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        walletAddress,
        // Default values will be set by schema
      }
    });
  }

  return user;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = BetSchema.parse(body);

    // 1. Verify Transaction Signature (CRITICAL FOR SECURITY)
    if (validatedData.txSignature) {
      // Check if signature already used
      const existingTx = await db.bet.findFirst({
        where: { txSignature: validatedData.txSignature }
      });

      if (existingTx) {
        return NextResponse.json(
          { success: false, error: 'Transaction signature already used' },
          { status: 400 }
        );
      }

      // Verify on-chain
      try {
        await verifyTransaction(
          validatedData.txSignature,
          validatedData.amount,
          validatedData.bettor
        );
      } catch (txError: any) {
        console.error('Transaction verification failed:', txError);
        return NextResponse.json(
          { success: false, error: `Transaction verification failed: ${txError.message}` },
          { status: 400 }
        );
      }
    } else {
      // In production, we should probably reject bets without signatures
      // For now, we'll allow it if it's a legacy call, but the schema requires it now.
      return NextResponse.json(
        { success: false, error: 'Transaction signature required' },
        { status: 400 }
      );
    }

    // Check if bet already exists (only if onChainId provided)
    if (validatedData.onChainId) {
      const existingBet = await db.bet.findUnique({
        where: { onChainId: validatedData.onChainId }
      });

      if (existingBet) {
        return NextResponse.json({ 
          success: true, 
          bet: existingBet,
          message: 'Bet already exists' 
        });
      }
    }

    // Find the dare
    let dare;
    if (validatedData.dareId) {
      dare = await db.dare.findUnique({ where: { id: validatedData.dareId } });
    } else if (validatedData.dareOnChainId) {
      dare = await db.dare.findUnique({ where: { onChainId: validatedData.dareOnChainId } });
    }

    if (!dare) {
      return NextResponse.json(
        { success: false, error: 'Dare not found' },
        { status: 404 }
      );
    }

    // Ensure user exists
    const user = await ensureUserExists(validatedData.bettor);

    // Create new bet record
    const newBet = await db.bet.create({
      data: {
        onChainId: validatedData.onChainId,
        bettor: validatedData.bettor,
        userId: user.id,
        dareId: dare.id,
        amount: validatedData.amount,
        betType: validatedData.betType,
        txSignature: validatedData.txSignature,
        status: 'PLACED',
        isClaimed: false,
        isEarlyCashOut: false,
        createdAt: new Date(),
      },
      include: {
        dare: {
          select: {
            title: true,
            onChainId: true,
            deadline: true,
            isCompleted: true,
          }
        }
      }
    });

    // Update dare pools
    const poolUpdate = validatedData.betType === 'WILL_DO' 
      ? { willDoPool: { increment: validatedData.amount } }
      : { wontDoPool: { increment: validatedData.amount } };

    await db.dare.update({
      where: { id: dare.id },
      data: {
        totalPool: { increment: validatedData.amount },
        ...poolUpdate
      }
    });

    return NextResponse.json({ 
      success: true, 
      bet: newBet 
    });

  } catch (error) {
    console.error('Error creating bet:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onChainId = searchParams.get('onChainId');
    const bettor = searchParams.get('bettor');
    const dareOnChainId = searchParams.get('dareOnChainId');

    let where: any = {};

    if (onChainId) {
      where.onChainId = onChainId;
    }

    if (bettor) {
      where.bettor = bettor;
    }

    if (dareOnChainId) {
      where.dare = {
        onChainId: dareOnChainId
      };
    }

    const bets = await db.bet.findMany({
      where,
      include: {
        dare: {
          select: {
            title: true,
            onChainId: true,
            deadline: true,
            isCompleted: true,
            logoUrl: true,
          }
        },
        user: {
          select: {
            username: true,
            walletAddress: true,
          }
        },
        likes: {
          select: {
            userWallet: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: bets 
    });

  } catch (error) {
    console.error('Error fetching bets:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { onChainId, isClaimed, isEarlyCashOut } = body;

    if (!onChainId) {
      return NextResponse.json(
        { success: false, error: 'onChainId is required' },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (typeof isClaimed === 'boolean') {
      updateData.isClaimed = isClaimed;
    }

    if (typeof isEarlyCashOut === 'boolean') {
      updateData.isEarlyCashOut = isEarlyCashOut;
    }

    const updatedBet = await db.bet.update({
      where: { onChainId },
      data: updateData,
      include: {
        dare: {
          select: {
            title: true,
            onChainId: true,
            deadline: true,
            isCompleted: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      bet: updatedBet 
    });

  } catch (error) {
    console.error('Error updating bet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}