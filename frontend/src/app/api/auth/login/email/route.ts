import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function POST(request: Request) {
  try {
    console.log('API_URL:', API_URL);
    const body = await request.json();
    console.log('Request body:', body);
    
    const response = await fetch(`${API_URL}/api/auth/login/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to send verification code' }));
      console.error('Error response:', error);
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    console.log('Success response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Detailed error:', error);
    return NextResponse.json(
      { detail: 'Failed to send verification code' },
      { status: 500 }
    );
  }
} 