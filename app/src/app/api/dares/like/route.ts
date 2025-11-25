import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dareId, userWallet, onChainId } = body;

    if ((!dareId && !onChainId) || !userWallet) {
      return NextResponse.json({ error: 'Dare ID (or onChainId) and user wallet are required' }, { status: 400 });
    }

    let targetDareId = dareId;

    // If onChainId is provided, look up the database ID
    if (!targetDareId && onChainId) {
      const dare = await db.dare.findUnique({
        where: { onChainId }
      });
      
      if (!dare) {
        return NextResponse.json({ error: 'Dare not found in database' }, { status: 404 });
      }
      targetDareId = dare.id;
    }

    if (!targetDareId) {
      return NextResponse.json({ error: 'Dare ID is required' }, { status: 400 });
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { walletAddress: userWallet }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          walletAddress: userWallet,
        }
      });
    }

    // Check if already liked
    const existingLike = await db.dareLike.findUnique({
      where: {
        dareId_userId: {
          dareId: targetDareId,
          userId: user.id,
        }
      }
    });

    let isLiked = false;

    if (existingLike) {
      // Unlike
      await db.$transaction([
        db.dareLike.delete({
          where: {
            id: existingLike.id,
          }
        }),
        db.dare.update({
          where: { id: targetDareId },
          data: {
            likesCount: {
              decrement: 1
            }
          }
        })
      ]);
      isLiked = false;
    } else {
      // Like
      await db.$transaction([
        db.dareLike.create({
          data: {
            dareId: targetDareId,
            userId: user.id,
            userWallet,
          }
        }),
        db.dare.update({
          where: { id: targetDareId },
          data: {
            likesCount: {
              increment: 1
            }
          }
        })
      ]);
      isLiked = true;
    }

    // Get updated count
    const updatedDare = await db.dare.findUnique({
      where: { id: targetDareId },
      select: { likesCount: true }
    });

    return NextResponse.json({
      success: true,
      isLiked,
      likesCount: updatedDare?.likesCount || 0
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dareId = searchParams.get('dareId');
    const onChainId = searchParams.get('onChainId');
    const userWallet = searchParams.get('userWallet');

    if (!dareId && !onChainId) {
      return NextResponse.json({ error: 'Dare ID or onChainId is required' }, { status: 400 });
    }

    let targetDareId = dareId;

    if (!targetDareId && onChainId) {
      const dare = await db.dare.findUnique({
        where: { onChainId }
      });
      
      if (!dare) {
        // If not found, return 0 likes
        return NextResponse.json({
          success: true,
          likesCount: 0,
          isLiked: false
        });
      }
      targetDareId = dare.id;
    }

    if (!targetDareId) {
      return NextResponse.json({ error: 'Dare ID is required' }, { status: 400 });
    }

    const dare = await db.dare.findUnique({
      where: { id: targetDareId },
      select: { likesCount: true }
    });

    let isLiked = false;

    if (userWallet) {
      const user = await db.user.findUnique({
        where: { walletAddress: userWallet }
      });

      if (user) {
        const like = await db.dareLike.findUnique({
          where: {
            dareId_userId: {
              dareId: targetDareId!,
              userId: user.id,
            }
          }
        });
        isLiked = !!like;
      }
    }

    return NextResponse.json({
      success: true,
      likesCount: dare?.likesCount || 0,
      isLiked
    });

  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json({ error: 'Failed to fetch like status' }, { status: 500 });
  }
}
