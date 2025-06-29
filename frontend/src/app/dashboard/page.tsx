'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface Recipient {
  id: string;
  name: string;
  phone_number: string;
  check_in_time: string;
  status: 'active' | 'inactive';
  last_check_in?: string;
}

export default function DashboardPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    loadRecipients();
  }, []);

  const loadRecipients = async () => {
    try {
      const data = await api.get<Recipient[]>('/api/recipients');
      setRecipients(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load recipients',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return new Date(time).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-gray-600 mt-1">Manage your care check-ins</p>
        </div>
        <Button
          onClick={() => router.push('/dashboard/recipients/new')}
          size="lg"
        >
          Add New Recipient
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      ) : recipients.length === 0 ? (
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">No Recipients Yet</h2>
          <p className="text-gray-600 mb-6">
            Start by adding someone you'd like to check in with regularly.
          </p>
          <Button
            onClick={() => router.push('/dashboard/recipients/new')}
            size="lg"
          >
            Add Your First Recipient
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recipients.map((recipient) => (
            <Card key={recipient.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{recipient.name}</h3>
                  <p className="text-gray-600">{recipient.phone_number}</p>
                </div>
                <Badge variant={recipient.status === 'active' ? 'default' : 'secondary'}>
                  {recipient.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm text-gray-600">
                <p>Check-in time: {formatTime(recipient.check_in_time)}</p>
                {recipient.last_check_in && (
                  <p>Last check-in: {formatDate(recipient.last_check_in)}</p>
                )}
              </div>

              <div className="mt-4 space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/recipients/${recipient.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/recipients/${recipient.id}/history`)}
                >
                  View History
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 