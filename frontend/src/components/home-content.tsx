"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function HomeContent() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container flex flex-col items-center justify-center min-h-screen py-12 space-y-8">
        <div className="space-y-6 text-center">
          <h1 className="text-6xl font-bold tracking-tighter sm:text-8xl">
            CareCall
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl">
            AI-powered wellness check-ins for your loved ones. Automated calls with natural conversation and instant alerts.
          </p>
        </div>
        <div className="space-x-4">
          <Link href="/api/auth/login">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link href="https://github.com/wqschain/carecall" target="_blank">
            <Button variant="outline" size="lg">View on GitHub</Button>
          </Link>
        </div>
        <div className="grid gap-8 pt-12 sm:grid-cols-3">
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold">Natural Conversations</h3>
            <p className="text-muted-foreground">
              AI-powered calls that feel warm and personal, adapting to each recipient.
            </p>
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold">Smart Monitoring</h3>
            <p className="text-muted-foreground">
              Automated analysis of responses to detect concerns or emergencies.
            </p>
          </div>
          <div className="space-y-2 text-center">
            <h3 className="text-xl font-bold">Instant Alerts</h3>
            <p className="text-muted-foreground">
              Real-time notifications via SMS and email when attention is needed.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 