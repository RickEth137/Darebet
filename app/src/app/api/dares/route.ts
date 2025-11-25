import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const DareSchema = z.object({
  onChainId: z.string().optional(),
  title: z.string(),
  description: z.string(),
  creator: z.string(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  deadline: z.string(),
  minBet: z.number(),
  txSignature: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = DareSchema.parse(body);

    // Default images
    const DEFAULT_LOGO = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy';
    const DEFAULT_BANNER = 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafybeih6nwb4mkrtqg2pucdgutumvn464m6nup5clop5msyfzkmifzeumy';

    // Check if dare already exists (only if onChainId is provided)
    if (validatedData.onChainId) {
      const existingDare = await db.dare.findUnique({
        where: { onChainId: validatedData.onChainId }
      });

      if (existingDare) {
        return NextResponse.json({ 
          success: true, 
          dare: existingDare,
          message: 'Dare already exists' 
        });
      }
    }

    // Create new dare record
    const newDare = await db.dare.create({
      data: {
        onChainId: validatedData.onChainId,
        title: validatedData.title,
        description: validatedData.description,
        creator: validatedData.creator,
        logoUrl: validatedData.logoUrl || DEFAULT_LOGO,
        bannerUrl: validatedData.bannerUrl || DEFAULT_BANNER,
        deadline: new Date(validatedData.deadline),
        minBet: validatedData.minBet,
        txSignature: validatedData.txSignature,
        status: 'ACTIVE', // Default status
        createdAt: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      dare: newDare 
    });

  } catch (error) {
    console.error('Error creating dare:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const onChainId = searchParams.get('onChainId');
    const creator = searchParams.get('creator');

    let where: any = {};

    if (onChainId) {
      where.onChainId = onChainId;
    }

    if (creator) {
      where.creator = creator;
    }

    const dares = await db.dare.findMany({
      where,
      include: {
        _count: {
          select: {
            bets: true,
            proofSubmissions: true,
            comments: true,
          }
        },
        proofSubmissions: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: dares 
    });

  } catch (error) {
    console.error('Error fetching dares:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}