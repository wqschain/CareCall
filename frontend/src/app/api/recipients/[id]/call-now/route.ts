import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')
  
  if (!token) {
    return new NextResponse(null, { status: 401 })
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/recipients/${params.id}/call-now`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`
      }
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error triggering call:', error)
    return NextResponse.json(
      { detail: 'Failed to trigger call' },
      { status: 500 }
    )
  }
} 