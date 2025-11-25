import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const ProofSchema = z.object({
  dareId: z.string(),
  submitter: z.string(),
  proofHash: z.string(), // IPFS hash
  description: z.string(),
});

async function ensureUserExists(walletAddress: string) {
  let user = await db.user.findUnique({
    where: { walletAddress }
  });

  if (!user) {
    user = await db.user.create({
      data: {
        walletAddress,
      }
    });
  }
  return user;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dareId, submitter, proofHash, description } = ProofSchema.parse(body);

    // Find dare
    let dare = await db.dare.findUnique({ where: { id: dareId } });
    if (!dare) {
      dare = await db.dare.findUnique({ where: { onChainId: dareId } });
    }

    if (!dare) {
      return NextResponse.json({ success: false, error: 'Dare not found' }, { status: 404 });
    }

    const user = await ensureUserExists(submitter);

    // Create Proof Submission
    const submission = await db.proofSubmission.create({
      data: {
        dareId: dare.id,
        userId: user.id,
        submitter,
        mediaUrl: `https://gateway.pinata.cloud/ipfs/${proofHash}`,
        ipfsHash: proofHash,
        description,
        mediaType: 'VIDEO', // Defaulting to video
      }
    });

    // Update Dare status to PENDING_PROOF
    await db.dare.update({
      where: { id: dare.id },
      data: {
        status: 'PENDING_PROOF',
        proofMediaUrl: `https://gateway.pinata.cloud/ipfs/${proofHash}`,
        proofDescription: description,
        proofSubmitter: submitter,
        proofTimestamp: new Date(),
      } as any
    });

    return NextResponse.json({ success: true, submission });

  } catch (error) {
    console.error('Error submitting proof:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
