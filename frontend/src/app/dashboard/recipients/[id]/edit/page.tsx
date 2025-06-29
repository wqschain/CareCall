'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { RecipientForm } from '@/components/recipient-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

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
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">Loading recipient...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-500">Error: {error.message}</p>
              <Link href="/dashboard">
                <Button className="mt-4">Back to Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Edit Recipient</h1>
        </div>
        
        {updateSuccess && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="text-center text-green-700">
                <CheckCircle className="mx-auto h-8 w-8 mb-2" />
                <p className="font-medium">Recipient updated successfully!</p>
                <p className="text-sm">Redirecting to dashboard...</p>
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Edit {recipient?.name}</CardTitle>
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
  )
} 