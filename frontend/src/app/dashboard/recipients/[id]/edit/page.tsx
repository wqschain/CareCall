'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { RecipientForm } from '@/components/recipient-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle, User, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface Recipient {
  id: number
  name: string
  phone_number: string
  condition: string
  preferred_time: string
  emergency_contact_name: string
  emergency_contact_phone: string
  emergency_contact_email: string
}

async function getRecipient(id: string): Promise<Recipient> {
  const response = await fetch(`/api/recipients/${id}`, {
    credentials: 'include'
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch recipient' }))
    throw new Error(error.detail || 'Failed to fetch recipient')
  }
  return response.json()
}

export default function EditRecipientPage() {
  const params = useParams()
  const router = useRouter()
  const recipientId = params.id as string
  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: recipient, error, isLoading } = useQuery({
    queryKey: ['recipient', recipientId],
    queryFn: () => getRecipient(recipientId),
    enabled: !!recipientId,
  })

  const handleSuccess = () => {
    setUpdateSuccess(true)
    // Show success message for 2 seconds before redirecting
    setTimeout(() => {
      router.push('/dashboard')
    }, 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container py-8">
          <Card className="animate-in slide-in-from-top-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-lg font-medium text-gray-800">Loading recipient...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="container py-8">
          <Card className="animate-in slide-in-from-top-4">
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 animate-pulse" />
                <p className="mt-4 text-lg font-medium text-red-600">Error: {error.message}</p>
                <Link href="/dashboard">
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700 transition-all duration-200">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container py-8">
        <div className={`transition-all duration-1000 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}>
          <div className="flex items-center gap-4 mb-8">
            <Link href="/dashboard">
              <Button 
                variant="outline" 
                className="group hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
              >
                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform duration-200" />
                Back
              </Button>
            </Link>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
              Edit Recipient
            </h1>
          </div>
          
          {updateSuccess && (
            <Card className="mb-8 border-green-200 bg-green-50 animate-in slide-in-from-top-4">
              <CardContent className="pt-6">
                <div className="text-center text-green-700">
                  <CheckCircle className="mx-auto h-12 w-12 mb-4 animate-pulse" />
                  <p className="text-xl font-bold">Recipient updated successfully!</p>
                  <p className="text-lg">Redirecting to dashboard...</p>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="animate-in slide-in-from-top-4 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                Edit {recipient?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recipient && (
                <RecipientForm 
                  recipient={recipient} 
                  onSuccess={handleSuccess}
                  isEditing={true}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 