import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'https://carecall-backend-943219616764.us-east1.run.app';

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/recipients`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { detail: 'Failed to fetch recipients' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/recipients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating recipient:', error);
    return NextResponse.json(
      { detail: 'Failed to create recipient' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
} 