import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Fetch comments for a dare
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dareId = searchParams.get('dareId');
    const page = parseInt(searchParams.get('page') || '0');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!dareId) {
      return NextResponse.json({ error: 'Dare ID is required' }, { status: 400 });
    }

    // Get top-level comments (no parent) with replies
    const comments = await db.comment.findMany({
      where: {
        dareId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    username: true,
                    avatar: true,
                  },
                },
                _count: {
                  select: {
                    likes: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
            _count: {
              select: {
                likes: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: page * limit,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await db.comment.count({
      where: {
        dareId,
        parentId: null,
      },
    });

    // Transform the data to match our frontend interface
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      author: comment.user.username || comment.username || 'Anonymous',
      authorWallet: `${comment.userWallet.slice(0, 4)}...${comment.userWallet.slice(-4)}`,
      content: comment.content,
      timestamp: comment.createdAt.getTime(),
      likes: comment._count.likes,
      isLiked: false, // TODO: Check if current user liked this
      replies: comment.replies.map(reply => ({
        id: reply.id,
        author: reply.user.username || reply.username || 'Anonymous',
        authorWallet: `${reply.userWallet.slice(0, 4)}...${reply.userWallet.slice(-4)}`,
        content: reply.content,
        timestamp: reply.createdAt.getTime(),
        likes: reply._count.likes,
        isLiked: false, // TODO: Check if current user liked this
        replies: reply.replies.map(nestedReply => ({
          id: nestedReply.id,
          author: nestedReply.user.username || nestedReply.username || 'Anonymous',
          authorWallet: `${nestedReply.userWallet.slice(0, 4)}...${nestedReply.userWallet.slice(-4)}`,
          content: nestedReply.content,
          timestamp: nestedReply.createdAt.getTime(),
          likes: nestedReply._count.likes,
          isLiked: false,
          replies: [],
          parentId: nestedReply.parentId,
          avatar: '🤖',
          showReplies: false,
        })),
        parentId: reply.parentId,
        avatar: '🤖',
        showReplies: false,
      })),
      parentId: comment.parentId,
      avatar: '🤖',
      showReplies: false,
    }));

    return NextResponse.json({
      comments: transformedComments,
      totalCount,
      hasMore: (page + 1) * limit < totalCount,
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST - Create a new comment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dareId, content, userWallet, username, parentId } = body;

    if (!dareId || !content || !userWallet) {
      return NextResponse.json({ 
        error: 'Dare ID, content, and user wallet are required' 
      }, { status: 400 });
    }

    // Check if dare exists
    const dare = await db.dare.findUnique({
      where: { id: dareId }
    });

    if (!dare) {
      return NextResponse.json({ error: 'Dare not found' }, { status: 404 });
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { walletAddress: userWallet }
    });

    if (!user) {
      user = await db.user.create({
        data: {
          walletAddress: userWallet,
          username: username || null,
        }
      });
    }

    // Create the comment
    const comment = await db.comment.create({
      data: {
        dareId,
        userId: user.id,
        userWallet,
        username: user.username || username,
        content,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
    });

    // Transform response to match frontend interface
    const transformedComment = {
      id: comment.id,
      author: comment.user.username || comment.username || 'Anonymous',
      authorWallet: `${comment.userWallet.slice(0, 4)}...${comment.userWallet.slice(-4)}`,
      content: comment.content,
      timestamp: comment.createdAt.getTime(),
      likes: comment._count.likes,
      isLiked: false,
      replies: [],
      parentId: comment.parentId,
      avatar: '🔥', // Default avatar for new comments
      showReplies: false,
    };

    return NextResponse.json(transformedComment, { status: 201 });

  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}