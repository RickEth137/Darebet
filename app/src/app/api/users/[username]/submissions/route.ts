import { NextRequest, NextResponse } from 'next/server';

// Temporarily disabled API routes for deployment
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  return NextResponse.json({ 
    message: 'API temporarily disabled for deployment',
    submissions: [],
    success: false
  });
}