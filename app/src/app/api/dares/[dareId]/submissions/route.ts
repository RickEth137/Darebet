import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { dareId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const sort = searchParams.get('sort') || 'likes';
    const userId = searchParams.get('userId');

    // Build orderBy based on sort parameter
    let orderBy: any;
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' };
        break;
      case 'early':
        orderBy = { createdAt: 'asc' };
        break;
      case 'likes':
      default:
        orderBy = { likesCount: 'desc' };
        break;
    }

    // Check if this is a demo dare (mock public key)
    if (params.dareId === '11111111111111111111111111111111') {
      // Return empty submissions for demo dares
      return NextResponse.json({
        submissions: [],
      });
    }

    // Fetch submissions with user data and like status
    const submissions = await prisma.proofSubmission.findMany({
      where: {
        dareId: params.dareId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
        // Include likes if userId is provided to check if user has liked
        ...(userId && {
          likes: {
            where: {
              userId: userId,
            },
            select: {
              id: true,
            },
          },
        }),
      },
      orderBy,
    });

    // Transform submissions to include isLiked flag
    const transformedSubmissions = submissions.map((submission: any) => ({
      ...submission,
      isLiked: userId ? submission.likes?.length > 0 : false,
      likes: undefined, // Remove the likes array from response
    }));

    return NextResponse.json({
      submissions: transformedSubmissions,
    });
  } catch (error) {
    console.error('Error fetching dare submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}