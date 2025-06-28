"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, AlertTriangle, CheckCircle } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface Recipient {
  id: number
  name: string
  condition: string
  phone_number: string
  check_ins: Array<{
    id: number
    status: 'OK' | 'CONCERN' | 'EMERGENCY' | 'NO_ANSWER'
    created_at: string
  }>
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

export function RecipientList() {
  const { toast } = useToast()
  const { data: recipients, error, isLoading, refetch } = useQuery({
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

  if (!recipients?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">No recipients found.</p>
            <p className="mt-2">
              <Link href="/dashboard/recipients/new">
                <Button variant="link">Add your first recipient</Button>
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recipients.map((recipient) => {
        const lastCheckIn = recipient.check_ins[0]
        const statusColor = {
          OK: 'bg-green-500',
          CONCERN: 'bg-yellow-500',
          EMERGENCY: 'bg-red-500',
          NO_ANSWER: 'bg-gray-500',
        }[lastCheckIn?.status || 'NO_ANSWER']

        return (
          <Card key={recipient.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-bold">
                {recipient.name}
              </CardTitle>
              <div className={`w-3 h-3 rounded-full ${statusColor}`} />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{recipient.phone_number}</span>
                </div>
                <div>
                  <Badge variant="secondary">{recipient.condition}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Link href={`/dashboard/recipients/${recipient.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/recipients/${recipient.id}/call-now`, {
                          method: 'POST',
                          credentials: 'include'
                        })
                        if (!response.ok) {
                          const error = await response.json().catch(() => ({ detail: 'Failed to initiate call' }))
                          throw new Error(error.detail)
                        }
                        toast({
                          title: "Call Initiated",
                          description: "The check-in call has been started.",
                        })
                      } catch (error) {
                        toast({
                          variant: "destructive",
                          title: "Error",
                          description: error instanceof Error ? error.message : "Failed to initiate call",
                        })
                      }
                    }}
                    size="sm"
                  >
                    Call Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 