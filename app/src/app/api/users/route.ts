import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const UserRegistrationSchema = z.object({
  walletAddress: z.string().min(32, 'Invalid wallet address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UserRegistrationSchema.parse(body);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { walletAddress: validatedData.walletAddress }
    });

    if (existingUser) {
      return NextResponse.json({ 
        success: true, 
        user: existingUser,
        isNewUser: false 
      });
    }

    // Check if username is already taken
    if (validatedData.username) {
      const existingUsername = await db.user.findUnique({
        where: { username: validatedData.username }
      });

      if (existingUsername) {
        return NextResponse.json(
          { success: false, error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    // Create new user
    const newUser = await db.user.create({
      data: {
        walletAddress: validatedData.walletAddress,
        username: validatedData.username,
        bio: validatedData.bio,
        email: validatedData.email,
        avatar: validatedData.avatar,
        createdAt: new Date(),
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      isNewUser: true 
    });

  } catch (error) {
    console.error('Error registering user:', error);
    
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
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json(
        { success: false, error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { walletAddress },
      include: {
        _count: {
          select: {
            bets: true,
            proofSubmissions: true,
          }
        }
      }
    });

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
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}