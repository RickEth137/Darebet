import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PinataService } from '@/lib/pinata';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let dareId: string;
    let description: string;
    let ipfsHash: string;
    let mediaUrl: string;
    let walletAddress: string | null;

    console.log('[Proof Submission API] Received submission, content-type:', contentType);

    // Check if this is JSON (IPFS hash already uploaded) or FormData (video upload)
    if (contentType.includes('application/json')) {
      // JSON request - IPFS already uploaded
      const body = await request.json();
      dareId = body.dareId;
      description = body.description;
      ipfsHash = body.ipfsHash;
      mediaUrl = body.mediaUrl || `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
      walletAddress = request.headers.get('x-wallet-address') || body.walletAddress;

      console.log('[Proof Submission API] JSON submission for dareId:', dareId);

      if (!dareId || !description || !ipfsHash) {
        return NextResponse.json(
          { error: 'Missing required fields', message: 'dareId, description, and ipfsHash are required' },
          { status: 400 }
        );
      }
    } else {
      // FormData request - need to upload video to Pinata
      const formData = await request.formData();
      const video = formData.get('video') as File;
      dareId = formData.get('dareId') as string;
      description = formData.get('description') as string;
      const recordedAt = formData.get('recordedAt') as string;
      walletAddress = request.headers.get('x-wallet-address');

      console.log('[Proof Submission API] FormData submission for dareId:', dareId);

      if (!video || !dareId || !description) {
        return NextResponse.json(
          { error: 'Missing required fields', message: 'Video, dareId, and description are required' },
          { status: 400 }
        );
      }

      if (!walletAddress) {
        return NextResponse.json(
          { error: 'Wallet address required', message: 'Please connect your wallet' },
          { status: 401 }
        );
      }

      // Upload video to Pinata
      console.log('[Proof Submission API] Uploading video to Pinata...');
      const videoBlob = new Blob([await video.arrayBuffer()], { type: video.type });
      const uploadResult = await PinataService.uploadVideoBlob(
        videoBlob,
        dareId,
        walletAddress,
        description
      );

      console.log('[Proof Submission API] Video uploaded to IPFS:', uploadResult.ipfsHash);
      ipfsHash = uploadResult.ipfsHash;
      mediaUrl = uploadResult.url;
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required', message: 'Please connect your wallet' },
        { status: 401 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      // Create a default user for now
      user = await prisma.user.create({
        data: {
          walletAddress,
          username: walletAddress.slice(0, 8),
        },
      });
    }

    // Save to database
    const proofSubmission = await prisma.proofSubmission.create({
      data: {
        dareId,
        userId: user.id,
        submitter: walletAddress,
        mediaUrl,
        ipfsHash,
        description,
        mediaType: 'VIDEO',
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,
        duration: 0, // You can extract this from video metadata if needed
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            walletAddress: true,
          },
        },
      },
    });

    console.log('[Proof Submission API] Saved to database with ID:', proofSubmission.id);
    console.log('[Proof Submission API] Saved with dareId:', proofSubmission.dareId);
    console.log('[Proof Submission API] IPFS hash:', proofSubmission.ipfsHash);

    return NextResponse.json({
      success: true,
      submission: {
        id: proofSubmission.id,
        dareId: proofSubmission.dareId,
        ipfsHash: proofSubmission.ipfsHash,
        description: proofSubmission.description,
        ipfsUrl: mediaUrl,
        createdAt: proofSubmission.createdAt,
        submitter: {
          walletAddress: user.walletAddress,
          username: user.username,
        },
      },
    });
  } catch (error) {
    console.error('[Proof Submission API] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to submit proof',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}