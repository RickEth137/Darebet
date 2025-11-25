import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Upload to Pinata
    const pinataFormData = new FormData();
    pinataFormData.append('file', file);

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    if (!pinataResponse.ok) {
      throw new Error('Failed to upload to Pinata');
    }

    const pinataData = await pinataResponse.json();
    const ipfsUrl = `${process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL}${pinataData.IpfsHash}`;

    return NextResponse.json({
      success: true,
      ipfsUrl,
      ipfsHash: pinataData.IpfsHash,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
