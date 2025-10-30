import { NextRequest, NextResponse } from 'next/server';

// Temporarily disabled API routes for deployment
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API temporarily disabled for deployment',
    data: []
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API temporarily disabled for deployment',
    success: false
  });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ 
    message: 'API temporarily disabled for deployment',
    success: false
  });
}