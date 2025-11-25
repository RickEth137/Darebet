import { NextRequest, NextResponse } from 'next/server';

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;

export async function POST(req: NextRequest) {
  try {
    // Check if Pinata credentials are configured
    if (!PINATA_JWT && (!PINATA_API_KEY || !PINATA_API_SECRET)) {
      console.error('Pinata credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error: Pinata credentials missing' },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const pinataMetadata = formData.get('pinataMetadata');
    const pinataOptions = formData.get('pinataOptions');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('video/') && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be a video or image' },
        { status: 400 }
      );
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large (max 100MB)' },
        { status: 400 }
      );
    }

    // Create form data for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    if (pinataMetadata) {
      pinataFormData.append('pinataMetadata', pinataMetadata);
    }

    if (pinataOptions) {
      pinataFormData.append('pinataOptions', pinataOptions);
    }

    // Upload to Pinata
    console.log('Uploading to Pinata...', {
      filename: file.name,
      size: file.size,
      type: file.type
    });

    const pinataResponse = await fetch(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      {
        method: 'POST',
        headers: PINATA_JWT 
          ? { Authorization: `Bearer ${PINATA_JWT}` }
          : {
              pinata_api_key: PINATA_API_KEY!,
              pinata_secret_api_key: PINATA_API_SECRET!,
            },
        body: pinataFormData,
      }
    );

    if (!pinataResponse.ok) {
      const errorData = await pinataResponse.text();
      console.error('Pinata upload failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to upload to IPFS', details: errorData },
        { status: pinataResponse.status }
      );
    }

    const result = await pinataResponse.json();
    console.log('Upload successful:', result);

    // Return IPFS hash and gateway URL
    return NextResponse.json({
      success: true,
      ipfsHash: result.IpfsHash,
      pinSize: result.PinSize,
      timestamp: result.Timestamp,
      gatewayUrl: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
      ipfsUrl: `ipfs://${result.IpfsHash}`,
    });
  } catch (error) {
    console.error('Error in upload-to-pinata API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


