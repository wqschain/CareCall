"use client"

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Phone, MessageSquare, Calendar, User } from 'lucide-react'
import { useState } from 'react'

interface CallLog {
  id: number
  status: string
  created_at: string
  completed_at: string
  transcript: string
  ai_notes: string
  call_metadata: {
    script_generated: boolean
    caregiver_name: string
    call_sid: string
    webhook_timestamp: string
  }
}

interface CallLogsProps {
  recipientId: number
  recipientName: string
}

async function getCallLogs(recipientId: number): Promise<CallLog[]> {
  const response = await fetch(`/api/checkins?recipient_id=${recipientId}&days=30`, {
    credentials: 'include',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch call logs')
  }
  return response.json()
}

export function CallLogs({ recipientId, recipientName }: CallLogsProps) {
  const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set())

  const { data: callLogs = [], isLoading, error } = useQuery({
    queryKey: ['call-logs', recipientId],
    queryFn: () => getCallLogs(recipientId),
    retry: 1
  })

  const toggleLog = (logId: number) => {
    const newExpanded = new Set(expandedLogs)
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId)
    } else {
      newExpanded.add(logId)
    }
    setExpandedLogs(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OK': return 'bg-green-500'
      case 'CONCERN': return 'bg-yellow-500'
      case 'EMERGENCY': return 'bg-red-500'
      case 'NO_ANSWER': return 'bg-gray-500'
      default: return 'bg-gray-500'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground">Loading call logs...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Failed to load call logs</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!callLogs.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Phone className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No call logs found for {recipientName}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Phone className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Call Logs for {recipientName}</h3>
        <Badge variant="secondary">{callLogs.length} calls</Badge>
      </div>
      
      <div className="space-y-3">
        {callLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(log.status)}`} />
                  <div>
                    <CardTitle className="text-base">
                      Call #{log.id} - {log.status}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(log.created_at)}
                      </div>
                      {log.call_metadata?.caregiver_name && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.call_metadata.caregiver_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleLog(log.id)}
                >
                  {expandedLogs.has(log.id) ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedLogs.has(log.id) && (
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {log.transcript && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <h4 className="font-medium">Script Played</h4>
                      </div>
                      <div className="bg-muted p-3 rounded-md text-sm">
                        "{log.transcript}"
                      </div>
                    </div>
                  )}
                  
                  {log.ai_notes && (
                    <div>
                      <h4 className="font-medium mb-2">Call Notes</h4>
                      <p className="text-sm text-muted-foreground">{log.ai_notes}</p>
                    </div>
                  )}
                  
                  {log.call_metadata && (
                    <div>
                      <h4 className="font-medium mb-2">Call Details</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Call SID: {log.call_metadata.call_sid}</div>
                        <div>Script Generated: {log.call_metadata.script_generated ? 'Yes' : 'No'}</div>
                        <div>Webhook Time: {formatDate(log.call_metadata.webhook_timestamp)}</div>
                        {log.completed_at && (
                          <div>Completed: {formatDate(log.completed_at)}</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
} 