import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { platform } = await request.json();

    if (!platform || !['twitter', 'copy'].includes(platform)) {
      return NextResponse.json(
        { success: false, error: 'Valid platform is required (twitter or copy)' },
        { status: 400 }
      );
    }

    // Find the bet
    const bet = await db.bet.findUnique({
      where: { onChainId: id }
    });

    if (!bet) {
      return NextResponse.json(
        { success: false, error: 'Bet not found' },
        { status: 404 }
      );
    }

    // Increment share count
    await db.bet.update({
      where: { id: bet.id },
      data: {
        sharesCount: {
          increment: 1
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Share tracked successfully' 
    });

  } catch (error) {
    console.error('Error tracking share:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}