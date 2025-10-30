import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to ensure user exists
async function ensureUserExists(walletAddress: string) {
  let user = await db.user.findUnique({
    where: { walletAddress }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        walletAddress,
      }
    });
  }

  return user;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userWallet } = await request.json();

    if (!userWallet) {
      return NextResponse.json(
        { success: false, error: 'User wallet is required' },
        { status: 400 }
      );
    }

    // Find the bet
    const bet = await db.bet.findUnique({
      where: { onChainId: id }
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Ensure user exists
    const user = await ensureUserExists(userWallet);

    // Check if user already liked this bet
    const existingLike = await db.betLike.findUnique({
      where: {
        betId_userId: {
          betId: bet.id,
          userId: user.id
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: 'Already liked this bet' },
        { status: 400 }
      );
    }

    // Create like and update count in a transaction
    await db.$transaction([
      db.betLike.create({
        data: {
          betId: bet.id,
          userId: user.id,
          userWallet: userWallet,
        }
      }),
      db.bet.update({
        where: { id: bet.id },
        data: {
          likesCount: {
            increment: 1
          }
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Bet liked successfully' 
    });

  } catch (error) {
    console.error('Error liking bet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { userWallet } = await request.json();

    if (!userWallet) {
      return NextResponse.json(
        { success: false, error: 'User wallet is required' },
        { status: 400 }
      );
    }

    // Find the bet
    const bet = await db.bet.findUnique({
      where: { onChainId: id }
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Find the user
    const user = await db.user.findUnique({
      where: { walletAddress: userWallet }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if like exists
    const existingLike = await db.betLike.findUnique({
      where: {
        betId_userId: {
          betId: bet.id,
          userId: user.id
        }
      }
    });

    if (!existingLike) {
      return NextResponse.json(
        { success: false, error: 'Like not found' },
        { status: 404 }
      );
    }

    // Delete like and update count in a transaction
    await db.$transaction([
      db.betLike.delete({
        where: {
          betId_userId: {
            betId: bet.id,
            userId: user.id
          }
        }
      }),
      db.bet.update({
        where: { id: bet.id },
        data: {
          likesCount: {
            decrement: 1
          }
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Bet unliked successfully' 
    });

  } catch (error) {
    console.error('Error unliking bet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}