import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const bet = await db.bet.findUnique({
      where: { onChainId: id },
      include: {
        dare: {
          select: {
            id: true,
            onChainId: true,
            title: true,
            description: true,
            creator: true,
            logoUrl: true,
            deadline: true,
            minBet: true,
            isCompleted: true,
          }
        },
        user: {
          select: {
            walletAddress: true,
            username: true,
            avatar: true,
          }
        },
        likes: {
          include: {
            user: {
              select: {
                username: true,
                walletAddress: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        comments: {
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
        }
      }
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: 'Bet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      bet 
    });

  } catch (error) {
    console.error('Error fetching bet:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}