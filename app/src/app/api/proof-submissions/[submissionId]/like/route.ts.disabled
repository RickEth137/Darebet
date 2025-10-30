import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if the user has already liked this submission
    const existingLike = await prisma.proofSubmissionLike.findUnique({
      where: {
        userId_proofSubmissionId: {
          userId,
          proofSubmissionId: params.submissionId,
        },
      },
    });

    let liked = false;
    let likesCount = 0;

    if (existingLike) {
      // Unlike: Remove the like
      await prisma.proofSubmissionLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Decrement likes count
      const updatedSubmission = await prisma.proofSubmission.update({
        where: { id: params.submissionId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });

      likesCount = updatedSubmission.likesCount;
      liked = false;
    } else {
      // Like: Create a new like
      await prisma.proofSubmissionLike.create({
        data: {
          userId,
          proofSubmissionId: params.submissionId,
        },
      });

      // Increment likes count
      const updatedSubmission = await prisma.proofSubmission.update({
        where: { id: params.submissionId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
        select: {
          likesCount: true,
        },
      });

      likesCount = updatedSubmission.likesCount;
      liked = true;
    }

    return NextResponse.json({
      liked,
      likesCount,
    });
  } catch (error) {
    console.error('Error handling like:', error);
    return NextResponse.json(
      { error: 'Failed to handle like' },
      { status: 500 }
    );
  }
}