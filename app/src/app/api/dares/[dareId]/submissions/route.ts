import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { dareId: string } }
) {
  try {
    console.log('[Submissions API] Fetching submissions for dareId:', params.dareId);
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

    // ALWAYS try to fetch real submissions from database first
    try {
      console.log('[Submissions API] Querying database for dareId:', params.dareId);
      const submissions = await prisma.proofSubmission.findMany({
        where: {
          dareId: params.dareId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            },
          },
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

      console.log('[Submissions API] Found submissions in database:', submissions.length);

      // If we have real submissions, ALWAYS return them
      if (submissions.length > 0) {
        const transformedSubmissions = submissions.map((submission: any) => ({
          id: submission.id,
          dareId: submission.dareId,
          ipfsHash: submission.ipfsHash,
          description: submission.description,
          createdAt: submission.createdAt,
          likesCount: submission.likesCount || 0,
          commentsCount: submission.commentsCount || 0,
          sharesCount: submission.sharesCount || 0,
          viewsCount: submission.viewsCount || 0,
          duration: submission.duration,
          submitter: {
            walletAddress: submission.user.walletAddress,
            username: submission.user.username,
            avatar: null,
          },
          isLiked: userId ? submission.likes?.length > 0 : false,
        }));

        console.log('[Submissions API] Returning real submissions:', transformedSubmissions);
        return NextResponse.json({
          submissions: transformedSubmissions,
        });
      }
    } catch (dbError) {
      console.error('[Submissions API] Error fetching submissions from database:', dbError);
      // Continue to check if we should return mock data
    }

    console.log('[Submissions API] No real submissions found');
    
    // No submissions found
    return NextResponse.json({
      submissions: [],
    });
  } catch (error) {
    console.error('[Submissions API] Error fetching dare submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}