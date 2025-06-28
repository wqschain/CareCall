"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'

interface Recipient {
  id: number
  name: string
  condition: string
  phone_number: string
  check_ins: Array<{
    id: number
    status: string
    created_at: string
  }>
  preferred_time: string
}

interface RecipientListProps {
  recipients: Recipient[]
}

async function getRecipients(): Promise<Recipient[]> {
  const response = await fetch('/api/recipients', {
    credentials: 'include'
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to fetch recipients' }))
    throw new Error(error.detail || 'Failed to fetch recipients')
  }
  return response.json()
}

function ErrorFallback({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <p className="mt-2 text-muted-foreground">{error.message}</p>
          <p className="mt-4">
            <Button onClick={resetErrorBoundary}>Try Again</Button>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function RecipientList({ recipients }: RecipientListProps) {
  const { toast } = useToast()
  const { data: recipientsData, error, isLoading, refetch } = useQuery({
    queryKey: ['recipients'],
    queryFn: getRecipients,
    retry: 1
  })

  React.useEffect(() => {
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load recipients",
      })
    }
  }, [error, toast])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loading recipients...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return <ErrorFallback error={error as Error} resetErrorBoundary={() => refetch()} />
  }

  if (!recipientsData?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No recipients found</CardTitle>
          <CardDescription>
            Add a recipient to start scheduling check-ins
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recipientsData.map((recipient) => {
        const lastCheckIn = recipient.check_ins[0]
        const statusColor = {
          OK: 'bg-green-500',
          CONCERN: 'bg-yellow-500',
          EMERGENCY: 'bg-red-500',
          NO_ANSWER: 'bg-gray-500',
        }[lastCheckIn?.status || 'NO_ANSWER']

        return (
          <Card key={recipient.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {recipient.name}
                {lastCheckIn && (
                  <div
                    className={`w-3 h-3 rounded-full ${statusColor}`}
                    title={`Status: ${lastCheckIn.status}`}
                  />
                )}
              </CardTitle>
              <CardDescription>{recipient.condition}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <Label>Phone Number</Label>
                  <div>{recipient.phone_number}</div>
                </div>
                <div>
                  <Label>Preferred Time</Label>
                  <div>{recipient.preferred_time} UTC</div>
                </div>
                <div>
                  <Label>Last Check-in</Label>
                  <div>
                    {lastCheckIn
                      ? new Date(lastCheckIn.created_at).toLocaleString()
                      : 'No check-ins yet'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 