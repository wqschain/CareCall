import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

export async function GET() {
  const session = await getSession();
  
  if (!session?.user) {
    return new NextResponse(null, { status: 401 });
  }

  // TODO: Replace with actual API call to backend
  return NextResponse.json([]);
} 