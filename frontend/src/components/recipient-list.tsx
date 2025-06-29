"use client"

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, AlertTriangle, CheckCircle, Edit, Trash2, Plus, History } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { CallLogs } from '@/components/call-logs'

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
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch recipients')
  }
  return response.json()
}

async function deleteRecipient(recipientId: number): Promise<void> {
  const response = await fetch(`/api/recipients/${recipientId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to delete recipient' }))
    throw new Error(error.detail || 'Failed to delete recipient')
  }
}

async function callNow(recipientId: number): Promise<void> {
  const response = await fetch(`/api/recipients/${recipientId}/call-now`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to trigger call' }))
    throw new Error(error.detail || 'Failed to trigger call')
  }
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
  const router = useRouter()
  const queryClient = useQueryClient()
  const [expandedRecipients, setExpandedRecipients] = React.useState<Set<number>>(new Set())
  
  const { data: recipientsData, error, isLoading, refetch } = useQuery({
    queryKey: ['recipients'],
    queryFn: getRecipients,
    retry: 1
  })

  const deleteMutation = useMutation({
    mutationFn: deleteRecipient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients'] })
      toast({
        title: 'Success',
        description: 'Recipient deleted successfully.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete recipient.',
      })
    },
  })

  const callNowMutation = useMutation({
    mutationFn: callNow,
    onSuccess: () => {
      toast({
        title: 'Call Started',
        description: 'The check-in call is being placed.',
      })
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start call.',
      })
    },
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

  const handleEdit = (recipientId: number) => {
    router.push(`/dashboard/recipients/${recipientId}/edit`)
  }

  const handleDelete = (recipientId: number, recipientName: string) => {
    if (confirm(`Are you sure you want to delete ${recipientName}?`)) {
      deleteMutation.mutate(recipientId)
    }
  }

  const toggleCallLogs = (recipientId: number) => {
    const newExpanded = new Set(expandedRecipients)
    if (newExpanded.has(recipientId)) {
      newExpanded.delete(recipientId)
    } else {
      newExpanded.add(recipientId)
    }
    setExpandedRecipients(newExpanded)
  }

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
        <CardContent>
          <Link href="/dashboard/recipients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Recipient
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Recipients</h2>
        <Link href="/dashboard/recipients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Recipient
          </Button>
        </Link>
      </div>
      
      <div className="space-y-6">
        {recipientsData.map((recipient) => {
          const lastCheckIn = recipient.check_ins?.[0]
          const statusColor = {
            OK: 'bg-green-500',
            CONCERN: 'bg-yellow-500',
            EMERGENCY: 'bg-red-500',
            NO_ANSWER: 'bg-gray-500',
          }[lastCheckIn?.status || 'NO_ANSWER']

          return (
            <div key={recipient.id} className="space-y-4">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {recipient.name}
                    <div className="flex items-center gap-2">
                      {lastCheckIn && (
                        <div
                          className={`w-3 h-3 rounded-full ${statusColor}`}
                          title={`Status: ${lastCheckIn.status}`}
                        />
                      )}
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recipient.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipient.id, recipient.name)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-auto px-2 flex items-center gap-1"
                          onClick={() => callNowMutation.mutate(recipient.id)}
                          disabled={callNowMutation.isPending}
                          title="Call Now"
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          {callNowMutation.isPending ? 'Calling...' : 'Call Now'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-auto px-2 flex items-center gap-1"
                          onClick={() => toggleCallLogs(recipient.id)}
                          title="View Call Logs"
                        >
                          <History className="w-4 h-4 mr-1" />
                          {expandedRecipients.has(recipient.id) ? 'Hide Logs' : 'View Logs'}
                        </Button>
                      </div>
                    </div>
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
              
              {expandedRecipients.has(recipient.id) && (
                <div className="ml-4">
                  <CallLogs recipientId={recipient.id} recipientName={recipient.name} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 