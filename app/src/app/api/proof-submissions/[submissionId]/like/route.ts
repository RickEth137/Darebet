import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { userId } = await request.json();
    const submissionId = params.submissionId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Get user wallet address
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await db.proofSubmissionLike.findFirst({
      where: {
        proofSubmissionId: submissionId,
        userId,
      },
    });

    if (existingLike) {
      // Unlike
      await db.proofSubmissionLike.delete({
        where: { id: existingLike.id },
      });

      // Decrement like count
      const submission = await db.proofSubmission.update({
        where: { id: submissionId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return NextResponse.json({
        liked: false,
        likesCount: submission.likesCount,
      });
    } else {
      // Like
      await db.proofSubmissionLike.create({
        data: {
          proofSubmissionId: submissionId,
          userId,
          userWallet: user.walletAddress,
        },
      });

      // Increment like count
      const submission = await db.proofSubmission.update({
        where: { id: submissionId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return NextResponse.json({
        liked: true,
        likesCount: submission.likesCount,
      });
    }
  } catch (error) {
    console.error('[Like API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}