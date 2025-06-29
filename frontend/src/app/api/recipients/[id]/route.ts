import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');

  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/recipients/${params.id}`, {
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to fetch recipient' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching recipient:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch recipient' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const body = await request.json();
    
    const response = await fetch(`${BACKEND_URL}/api/recipients/${params.id}`, {
      method: 'PUT',
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
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating recipient:', error);
    return NextResponse.json(
      { detail: 'Failed to update recipient' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token');
  
  if (!token) {
    return new NextResponse(null, { status: 401 });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/recipients/${params.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete recipient' }));
      return NextResponse.json(error, { status: response.status });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting recipient:', error);
    return NextResponse.json(
      { detail: 'Failed to delete recipient' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
  });
} 