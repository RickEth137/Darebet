import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { submissionId: string } }
) {
  try {
    // Increment view count for the proof submission
    const updatedSubmission = await prisma.proofSubmission.update({
      where: { id: params.submissionId },
      data: {
        viewsCount: {
          increment: 1,
        },
      },
      select: {
        viewsCount: true,
      },
    });

    return NextResponse.json({
      success: true,
      viewsCount: updatedSubmission.viewsCount,
    });
  } catch (error) {
    console.error('Error incrementing view count:', error);
    return NextResponse.json(
      { error: 'Failed to increment view count' },
      { status: 500 }
    );
  }
}