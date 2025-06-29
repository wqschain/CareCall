"use client"

import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Phone, AlertTriangle, CheckCircle, Edit, Trash2, Plus, History, User, Clock, PhoneCall } from 'lucide-react'
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
    <Card className="animate-in slide-in-from-top-4">
      <CardContent className="pt-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 animate-pulse" />
          <p className="mt-4 text-lg font-medium text-gray-900">{error.message}</p>
          <p className="mt-4">
            <Button onClick={resetErrorBoundary} className="bg-blue-600 hover:bg-blue-700 transition-all duration-200">
              Try Again
            </Button>
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
  const [mounted, setMounted] = React.useState(false)
  
  const { data: recipientsData, error, isLoading, refetch } = useQuery({
    queryKey: ['recipients'],
    queryFn: getRecipients,
    retry: 1
  })

  React.useEffect(() => {
    setMounted(true)
  }, [])

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
      <Card className="animate-in slide-in-from-top-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-lg font-medium text-gray-800">Loading recipients...</p>
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
      <Card className="animate-in slide-in-from-top-4 hover:shadow-lg transition-all duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">No recipients found</CardTitle>
          <CardDescription className="text-lg text-gray-800 dark:text-gray-300">
            Add a recipient to start scheduling check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link href="/dashboard/recipients/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
              <Plus className="mr-2 h-5 w-5" />
              Add Your First Recipient
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-8 transition-all duration-1000 ease-out ${
      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Your Recipients
        </h2>
        <Link href="/dashboard/recipients/new">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105">
            <Plus className="mr-2 h-5 w-5" />
            Add Recipient
          </Button>
        </Link>
      </div>
      
      <div className="space-y-6">
        {recipientsData.map((recipient, index) => {
          const lastCheckIn = recipient.check_ins?.[0]
          const statusConfig = {
            OK: { color: 'bg-green-500', border: 'border-green-200', glow: 'shadow-green-200', text: 'text-green-700' },
            CONCERN: { color: 'bg-yellow-500', border: 'border-yellow-200', glow: 'shadow-yellow-200', text: 'text-yellow-700' },
            EMERGENCY: { color: 'bg-red-500', border: 'border-red-200', glow: 'shadow-red-200', text: 'text-red-700' },
            NO_ANSWER: { color: 'bg-gray-500', border: 'border-gray-200', glow: 'shadow-gray-200', text: 'text-gray-700' },
          }[lastCheckIn?.status || 'NO_ANSWER'] || { color: 'bg-gray-500', border: 'border-gray-200', glow: 'shadow-gray-200', text: 'text-gray-700' }

          return (
            <div 
              key={recipient.id} 
              className="space-y-4"
              style={{
                animationDelay: `${index * 100}ms`,
              }}
            >
              <Card className={`animate-in slide-in-from-top-4 hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border-2 ${statusConfig.border} hover:${statusConfig.glow}`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-xl font-bold text-gray-900 dark:text-white">{recipient.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {lastCheckIn && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-4 h-4 rounded-full ${statusConfig.color} animate-pulse shadow-lg`}
                            title={`Status: ${lastCheckIn.status}`}
                          />
                          <Badge className={`${statusConfig.text} bg-opacity-10 border ${statusConfig.border}`}>
                            {lastCheckIn.status}
                          </Badge>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(recipient.id)}
                          className="h-10 w-10 p-0 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200"
                          title="Edit recipient"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(recipient.id, recipient.name)}
                          className="h-10 w-10 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 transition-all duration-200"
                          disabled={deleteMutation.isPending}
                          title="Delete recipient"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-4 flex items-center gap-2 bg-green-50 hover:bg-green-100 border-green-200 hover:border-green-300 text-green-700 transition-all duration-200"
                          onClick={() => callNowMutation.mutate(recipient.id)}
                          disabled={callNowMutation.isPending}
                          title="Call Now"
                        >
                          <PhoneCall className="w-4 h-4" />
                          {callNowMutation.isPending ? 'Calling...' : 'Call Now'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-10 px-4 flex items-center gap-2 hover:bg-purple-100 hover:text-purple-600 transition-all duration-200"
                          onClick={() => toggleCallLogs(recipient.id)}
                          title="View Call Logs"
                        >
                          <History className="w-4 h-4" />
                          {expandedRecipients.has(recipient.id) ? 'Hide Logs' : 'View Logs'}
                        </Button>
                      </div>
                    </div>
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-800 dark:text-gray-300 font-medium">{recipient.condition}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <Label className="text-sm font-medium text-gray-800 dark:text-gray-300">Phone Number</Label>
                        <div className="text-lg font-semibold text-gray-900">{recipient.phone_number}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <Label className="text-sm font-medium text-gray-800 dark:text-gray-300">Preferred Time</Label>
                        <div className="text-lg font-semibold text-gray-900">{recipient.preferred_time} UTC</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <Label className="text-sm font-medium text-gray-800 dark:text-gray-300">Last Check-in</Label>
                        <div className="text-lg font-semibold text-gray-900">
                          {lastCheckIn
                            ? new Date(lastCheckIn.created_at).toLocaleString()
                            : 'No check-ins yet'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {expandedRecipients.has(recipient.id) && (
                <div className="ml-4 animate-in slide-in-from-top-4 duration-300">
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