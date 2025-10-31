import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { dareId: string } }
) {
  try {
    const { dareId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before'); // Cursor for pagination

    // Get or create chat room for this dare
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { dareId },
    });

    if (!chatRoom) {
      // Create chat room if it doesn't exist
      const dare = await prisma.dare.findUnique({
        where: { id: dareId },
        select: { title: true },
      });

      if (!dare) {
        return NextResponse.json(
          { error: 'Dare not found' },
          { status: 404 }
        );
      }

      chatRoom = await prisma.chatRoom.create({
        data: {
          dareId,
          name: `${dare.title} Chat`,
        },
      });
    }

    // Fetch messages with pagination
    const messages = await prisma.chatMessage.findMany({
      where: {
        chatRoomId: chatRoom.id,
        isDeleted: false,
        ...(before && {
          createdAt: { lt: new Date(before) },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            walletAddress: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      chatRoomId: chatRoom.id,
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { dareId: string } }
) {
  try {
    const { dareId } = params;
    const body = await request.json();
    const { userId, userWallet, username, content, replyToId, messageType } = body;

    if (!userId || !userWallet || !content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create chat room
    let chatRoom = await prisma.chatRoom.findUnique({
      where: { dareId },
    });

    if (!chatRoom) {
      const dare = await prisma.dare.findUnique({
        where: { id: dareId },
        select: { title: true },
      });

      if (!dare) {
        return NextResponse.json(
          { error: 'Dare not found' },
          { status: 404 }
        );
      }

      chatRoom = await prisma.chatRoom.create({
        data: {
          dareId,
          name: `${dare.title} Chat`,
        },
      });
    }

    // Create message
    const message = await prisma.chatMessage.create({
      data: {
        chatRoomId: chatRoom.id,
        userId,
        userWallet,
        username,
        content,
        messageType: messageType || 'TEXT',
        ...(replyToId && { replyToId }),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            walletAddress: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}
