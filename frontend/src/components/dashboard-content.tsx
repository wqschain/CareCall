"use client"

import { withPageAuthRequired } from '@auth0/nextjs-auth0/client'
import { useUser } from '@auth0/nextjs-auth0/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecipientList } from '@/components/recipient-list'

function DashboardContentInner() {
  const { user } = useUser();

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Recipients</h1>
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/recipients/new">
            <Button>Add New Recipient</Button>
          </Link>
          <Link href="/api/auth/logout">
            <Button variant="outline">
              Logout {user?.name ? `(${user.name})` : ''}
            </Button>
          </Link>
        </div>
      </div>
      <RecipientList />
    </div>
  )
}

export const DashboardContent = withPageAuthRequired(DashboardContentInner, {
  returnTo: '/dashboard',
}) 