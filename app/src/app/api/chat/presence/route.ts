import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/chat/presence?dareId=xxx - Get online users in a dare's chat
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dareId = searchParams.get('dareId');

    if (!dareId) {
      return NextResponse.json(
        { success: false, error: 'dareId parameter is required' },
        { status: 400 }
      );
    }

    // Get chat room
    const chatRoom = await prisma.chatRoom.findUnique({
      where: { dareId }
    });

    if (!chatRoom) {
      return NextResponse.json({
        success: true,
        data: { onlineUsers: [], totalOnline: 0 }
      });
    }

    // Get online users in this room (last seen within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const onlineUsers = await prisma.userPresence.findMany({
      where: {
        currentRoom: chatRoom.id,
        isOnline: true,
        lastSeen: {
          gte: fiveMinutesAgo
        }
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      },
      orderBy: {
        lastSeen: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        onlineUsers,
        totalOnline: onlineUsers.length,
        chatRoomId: chatRoom.id
      }
    });

  } catch (error) {
    console.error('Error fetching user presence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chat/presence - Update user presence
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userWallet, username, dareId, isOnline, socketId } = body;

    if (!userWallet) {
      return NextResponse.json(
        { success: false, error: 'userWallet is required' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress: userWallet }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: userWallet,
          username: username || null
        }
      });
    }

    let currentRoom = null;
    if (dareId && isOnline) {
      // Get chat room
      const chatRoom = await prisma.chatRoom.findUnique({
        where: { dareId }
      });
      currentRoom = chatRoom?.id || null;
    }

    // Update or create presence
    const presence = await prisma.userPresence.upsert({
      where: {
        userId: user.id
      },
      update: {
        isOnline: isOnline ?? true,
        lastSeen: new Date(),
        currentRoom,
        socketId,
        username: user.username || username
      },
      create: {
        userId: user.id,
        userWallet,
        username: user.username || username,
        isOnline: isOnline ?? true,
        currentRoom,
        socketId
      }
    });

    return NextResponse.json({
      success: true,
      data: presence
    });

  } catch (error) {
    console.error('Error updating user presence:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}