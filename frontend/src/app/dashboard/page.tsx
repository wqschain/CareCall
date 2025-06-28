import { withPageAuthRequired } from '@auth0/nextjs-auth0'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { RecipientList } from '@/components/recipient-list'

export default withPageAuthRequired(
  async function DashboardPage() {
    return (
      <div className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Recipients</h1>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/recipients/new">
              <Button>Add New Recipient</Button>
            </Link>
          </div>
        </div>
        <RecipientList />
      </div>
    )
  },
  { returnTo: '/dashboard' }
) 