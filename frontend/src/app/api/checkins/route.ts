import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const recipientId = searchParams.get('recipient_id');
    const days = searchParams.get('days') || '7';

    if (!recipientId) {
      return NextResponse.json(
        { detail: 'recipient_id is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/checkins?recipient_id=${recipientId}&days=${days}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Failed to fetch check-ins' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching check-ins:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch check-ins' },
      { status: 500 }
    );
  }
} 