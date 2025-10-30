import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@/lib/prisma';
import { PinataService } from '@/lib/pinata';
import { z } from 'zod';

const ProofSubmissionSchema = z.object({
  dareOnChainId: z.string(),
  submitter: z.string(),
  mediaUrl: z.string(),
  description: z.string(),
  mediaType: z.enum(['IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT']),
  ipfsHash: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    
    // Handle multipart form data (video uploads)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      
      const video = formData.get('video') as File;
      const dareId = formData.get('dareId') as string;
      const description = formData.get('description') as string;
      const recordedAt = formData.get('recordedAt') as string;

      // Validate required fields
      if (!video || !dareId || !description) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      // Validate file type
      if (!video.type.startsWith('video/')) {
        return NextResponse.json(
          { error: 'Invalid file type. Only video files are allowed.' },
          { status: 400 }
        );
      }

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (video.size > maxSize) {
        return NextResponse.json(
          { error: 'File too large. Maximum size is 50MB.' },
          { status: 400 }
        );
      }

      // Check if dare exists
      let dare = await prisma.dare.findFirst({
        where: { onChainId: dareId }
      });

      if (!dare) {
        // Create dare record if it doesn't exist
        dare = await prisma.dare.create({
          data: {
            onChainId: dareId,
            title: 'Unknown Dare',
            description: '',
            minimumBet: 0,
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            createdAt: new Date(),
          }
        });
      }

      // Check if dare deadline has passed
      if (new Date() > dare.deadline) {
        return NextResponse.json(
          { error: 'Dare deadline has passed' },
          { status: 400 }
        );
      }

      // Get wallet address from headers or use a demo value
      const walletAddress = request.headers.get('wallet-address') || 'demo-wallet';

      // Find or create user
      let user = await prisma.user.findUnique({
        where: { walletAddress }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            walletAddress,
            username: `user_${walletAddress.slice(-8)}`,
            createdAt: new Date(),
          }
        });
      }

      // Upload video to Pinata IPFS
      let ipfsHash = '';
      let pinataUrl = '';
      
      try {
        console.log('Uploading video to Pinata IPFS...');
        const pinataResult = await PinataService.uploadVideoBlob(
          video,
          dareId,
          walletAddress,
          description
        );
        
        ipfsHash = pinataResult.ipfsHash;
        pinataUrl = pinataResult.url;
        console.log('Video uploaded to IPFS:', ipfsHash);
      } catch (pinataError) {
        console.error('Failed to upload to Pinata:', pinataError);
        // Continue with local storage as fallback
      }

      // Create uploads directory if it doesn't exist (local backup)
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'proofs');
      if (!existsSync(uploadsDir)) {
        await mkdir(uploadsDir, { recursive: true });
      }

      // Generate unique filename for local backup
      const timestamp = Date.now();
      const fileExtension = video.name.split('.').pop() || 'webm';
      const filename = `proof_${dareId}_${user.id}_${timestamp}.${fileExtension}`;
      const filepath = join(uploadsDir, filename);

      // Save file locally as backup
      const bytes = await video.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Use IPFS URL if available, otherwise use local URL
      const mediaUrl = pinataUrl || `/uploads/proofs/${filename}`;

      // Create proof submission in database
      const proofSubmission = await prisma.proofSubmission.create({
        data: {
          dareId: dare.id,
          userId: user.id,
          submitter: walletAddress,
          mediaUrl: mediaUrl,
          description,
          mediaType: 'VIDEO',
          ipfsHash: ipfsHash || null,
          submittedAt: recordedAt ? new Date(recordedAt) : new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              walletAddress: true,
            }
          },
          dare: {
            select: {
              id: true,
              title: true,
              onChainId: true,
            }
          }
        }
      });

      return NextResponse.json({
        success: true,
        proofSubmission: {
          id: proofSubmission.id,
          mediaUrl: proofSubmission.mediaUrl,
          ipfsHash: proofSubmission.ipfsHash,
          ipfsUrl: ipfsHash ? PinataService.getIpfsUrl(ipfsHash) : null,
          description: proofSubmission.description,
          submittedAt: proofSubmission.submittedAt,
          user: proofSubmission.user,
          dare: proofSubmission.dare,
        },
        message: 'Proof submitted successfully and uploaded to IPFS'
      });
    }
    
    // Handle JSON data (legacy format)
    else {
      const body = await request.json();
      const validatedData = ProofSubmissionSchema.parse(body);

      // Check if dare exists
      let dare = await prisma.dare.findUnique({
        where: { onChainId: validatedData.dareOnChainId }
      });

      if (!dare) {
        // Create dare record if it doesn't exist
        dare = await prisma.dare.create({
          data: {
            onChainId: validatedData.dareOnChainId,
            title: 'Unknown Dare',
            description: '',
            minimumBet: 0,
            deadline: new Date(),
            createdAt: new Date(),
          }
        });
      }

      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { walletAddress: validatedData.submitter }
      });

      if (!user) {
        // Create user record if it doesn't exist
        user = await prisma.user.create({
          data: {
            walletAddress: validatedData.submitter,
            createdAt: new Date(),
          }
        });
      }

      // Create proof submission
      const proofSubmission = await prisma.proofSubmission.create({
        data: {
          dareId: dare.id,
          userId: user.id,
          mediaUrl: validatedData.mediaUrl,
          description: validatedData.description,
          mediaType: validatedData.mediaType,
          ipfsHash: validatedData.ipfsHash,
          submittedAt: new Date(),
        },
        include: {
          user: true,
          dare: true,
        }
      });

      return NextResponse.json({ 
        success: true, 
        data: proofSubmission 
      });
    }

  } catch (error) {
    console.error('Error creating proof submission:', error);
    
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
    const dareOnChainId = searchParams.get('dareOnChainId');
    const submitter = searchParams.get('submitter');

    let where: any = {};

    if (dareOnChainId) {
      where.dare = { onChainId: dareOnChainId };
    }

    if (submitter) {
      where.user = { walletAddress: submitter };
    }

    const proofSubmissions = await prisma.proofSubmission.findMany({
      where,
      include: {
        user: true,
        dare: true,
      },
      orderBy: {
        submittedAt: 'desc'
      }
    });

    return NextResponse.json({ 
      success: true, 
      data: proofSubmissions 
    });

  } catch (error) {
    console.error('Error fetching proof submissions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}