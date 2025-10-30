import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Toggle like on a comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { commentId, userWallet, username } = body;

    if (!commentId || !userWallet) {
      return NextResponse.json({ 
        error: 'Comment ID and user wallet are required' 
      }, { status: 400 });
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { walletAddress: userWallet }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          walletAddress: userWallet,
          username: username || null,
        }
      });
    }

    // Check if comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Check if user already liked this comment
    const existingLike = await db.commentLike.findUnique({
      where: {
        commentId_userId: {
          commentId,
          userId: user.id,
        }
      }
    });

    let isLiked = false;
    let newLikeCount = 0;

    if (existingLike) {
      // Unlike the comment
      await db.commentLike.delete({
        where: { id: existingLike.id }
      });
      
      // Update comment like count
      const updatedComment = await db.comment.update({
        where: { id: commentId },
        data: {
          likesCount: {
            decrement: 1
          }
        }
      });
      
      newLikeCount = updatedComment.likesCount;
      isLiked = false;
    } else {
      // Like the comment
      await db.commentLike.create({
        data: {
          commentId,
          userId: user.id,
          userWallet,
        }
      });
      
      // Update comment like count
      const updatedComment = await db.comment.update({
        where: { id: commentId },
        data: {
          likesCount: {
            increment: 1
          }
        }
      });
      
      newLikeCount = updatedComment.likesCount;
      isLiked = true;
    }

    return NextResponse.json({
      isLiked,
      likeCount: newLikeCount,
    });

  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
  }
}