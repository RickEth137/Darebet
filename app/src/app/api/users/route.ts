import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';
import { verifyWalletSignature } from '@/lib/auth';

const UserRegistrationSchema = z.object({
  walletAddress: z.string().min(32, 'Invalid wallet address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
});

const UserUpdateSchema = z.object({
  walletAddress: z.string().min(32, 'Invalid wallet address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  bio: z.string().max(200, 'Bio must be less than 200 characters').optional(),
  email: z.string().email().optional(),
  avatar: z.string().url().optional(),
  banner: z.string().url().optional(),
  signature: z.string().optional(),
  message: z.string().optional(),
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
        banner: validatedData.banner,
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

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = UserUpdateSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { walletAddress: validatedData.walletAddress }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify signature for security
    if (!validatedData.signature || !validatedData.message) {
      return NextResponse.json(
        { success: false, error: 'Missing signature or message' },
        { status: 401 }
      );
    }

    // Verify the message format matches expected format
    const expectedMessagePrefix = `Update Profile: ${validatedData.walletAddress}`;
    if (!validatedData.message.startsWith(expectedMessagePrefix)) {
      return NextResponse.json(
        { success: false, error: 'Invalid message format' },
        { status: 401 }
      );
    }

    const isValid = verifyWalletSignature(
      validatedData.walletAddress,
      validatedData.message,
      validatedData.signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Check if new username is already taken by another user
    if (validatedData.username && validatedData.username !== existingUser.username) {
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

    // Update user with only provided fields
    const updateData: any = {};
    if (validatedData.username !== undefined) updateData.username = validatedData.username;
    if (validatedData.bio !== undefined) updateData.bio = validatedData.bio;
    if (validatedData.email !== undefined) updateData.email = validatedData.email;
    if (validatedData.avatar !== undefined) updateData.avatar = validatedData.avatar;
    if (validatedData.banner !== undefined) updateData.banner = validatedData.banner;

    const updatedUser = await db.user.update({
      where: { walletAddress: validatedData.walletAddress },
      data: updateData,
      include: {
        _count: {
          select: {
            bets: true,
            proofSubmissions: true,
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    
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