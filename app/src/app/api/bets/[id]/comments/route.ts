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
    const { content, userWallet } = await request.json();

    if (!userWallet || !content?.trim()) {
      return NextResponse.json(
        { success: false, error: 'User wallet and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Comment must be 500 characters or less' },
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

    // Create comment and update count in a transaction
    const comment = await db.$transaction(async (tx: any) => {
      const newComment = await tx.betComment.create({
        data: {
          betId: bet.id,
          userId: user.id,
          userWallet: userWallet,
          content: content.trim(),
        },
        include: {
          user: {
            select: {
              username: true,
              walletAddress: true,
              avatar: true,
            }
          }
        }
      });

      await tx.bet.update({
        where: { id: bet.id },
        data: {
          commentsCount: {
            increment: 1
          }
        }
      });

      return newComment;
    });

    return NextResponse.json({ 
      success: true, 
      comment 
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    const comments = await db.betComment.findMany({
      where: { betId: bet.id },
      include: {
        user: {
          select: {
            username: true,
            walletAddress: true,
            avatar: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      comments 
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}