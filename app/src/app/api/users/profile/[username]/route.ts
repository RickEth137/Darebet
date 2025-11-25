import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = params.username;

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    let user = await db.user.findUnique({
      where: { username },
      include: {
        _count: {
          select: {
            bets: true,
            proofSubmissions: true,
          }
        }
      }
    });

    // If not found by username, try wallet address
    if (!user) {
      user = await db.user.findUnique({
        where: { walletAddress: username },
        include: {
          _count: {
            select: {
              bets: true,
              proofSubmissions: true,
            }
          }
        }
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      user 
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}