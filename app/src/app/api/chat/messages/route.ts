import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/chat/messages?dareId=xxx&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dareId = searchParams.get('dareId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!dareId) {
      return NextResponse.json(
        { success: false, error: 'dareId parameter is required' },
        { status: 400 }
      );
    }

    // First, ensure chat room exists for this dare
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { dareId }
    });

    if (!chatRoom) {
      // Get dare info for room name
      const dare = await prisma.dare.findUnique({
        where: { id: dareId },
        select: { title: true }
      });

      if (!dare) {
        return NextResponse.json(
          { success: false, error: 'Dare not found' },
          { status: 404 }
        );
      }

      // Create chat room for this dare
      chatRoom = await prisma.chatRoom.create({
        data: {
          dareId,
          name: `${dare.title} Chat`,
          isActive: true
        }
      });
    }

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: chatRoom.id,
        isDeleted: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            username: true,
            createdAt: true
          }
        },
        reactions: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    // Reverse to get chronological order (oldest first)
    const sortedMessages = messages.reverse();

    return NextResponse.json({
      success: true,
      data: {
        chatRoom,
        messages: sortedMessages,
        pagination: {
          limit,
          offset,
          hasMore: messages.length === limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chat/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dareId, content, userWallet, username, replyToId } = body;

    if (!dareId || !content || !userWallet) {
      return NextResponse.json(
        { success: false, error: 'dareId, content, and userWallet are required' },
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

    // Get or create chat room
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { dareId }
    });

    if (!chatRoom) {
      const dare = await prisma.dare.findUnique({
        where: { id: dareId },
        select: { title: true }
      });

      if (!dare) {
        return NextResponse.json(
          { success: false, error: 'Dare not found' },
          { status: 404 }
        );
      }

      chatRoom = await prisma.chatRoom.create({
        data: {
          dareId,
          name: `${dare.title} Chat`,
          isActive: true
        }
      });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: chatRoom.id,
        userId: user.id,
        userWallet,
        username: user.username || username,
        content,
        replyToId: replyToId || null
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            username: true,
            createdAt: true
          }
        },
        reactions: true,
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Error creating chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}