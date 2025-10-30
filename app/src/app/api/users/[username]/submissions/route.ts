import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    // First, find the user by username to get their ID
    const user = await prisma.user.findUnique({
      where: {
        username: params.username,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's proof submissions with dare information
    const submissions = await prisma.proofSubmission.findMany({
      where: {
        userId: user.id,
      },
      include: {
        dare: {
          select: {
            id: true,
            title: true,
            category: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc', // Most recent first
      },
    });

    return NextResponse.json({
      submissions,
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user submissions' },
      { status: 500 }
    );
  }
}