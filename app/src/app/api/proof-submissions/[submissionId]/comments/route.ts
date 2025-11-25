import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET comments for a submission
export async function GET(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const submissionId = params.submissionId;

    const comments = await prisma.proofSubmissionComment.findMany({
      where: {
        proofSubmissionId: submissionId,
        parentId: null, // Only top-level comments for now
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      comments: comments.map((comment) => ({
        id: comment.id,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          username: comment.user.username,
          walletAddress: comment.user.walletAddress,
        },
      })),
    });
  } catch (error) {
    console.error('[Comments API] Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { userId, content } = await request.json();
    const submissionId = params.submissionId;

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'User ID and content required' },
        { status: 400 }
      );
    }

    // Get user wallet address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true, username: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create comment
    const comment = await prisma.proofSubmissionComment.create({
      data: {
        proofSubmissionId: submissionId,
        userId,
        userWallet: user.walletAddress,
        content,
      },
    });

    // Increment comment count on submission
    await prisma.proofSubmission.update({
      where: { id: submissionId },
      data: {
        commentsCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      comment: {
        id: comment.id,
        userId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          username: user.username,
          walletAddress: user.walletAddress,
        },
      },
    });
  } catch (error) {
    console.error('[Comments API] Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
