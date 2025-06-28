"use client"

import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { RecipientList } from './recipient-list';
import { useToast } from './ui/use-toast';

interface User {
  name: string;
  email: string;
}

function LoadingFallback() {
  return <div>Loading...</div>;
}

export default function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();

  // Fetch user data
  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        router.push('/login');
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false
  });

  // Fetch recipients
  const { data: recipients = [], isLoading: recipientsLoading } = useQuery({
    queryKey: ['recipients'],
    queryFn: async () => {
      const response = await fetch('/api/recipients', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch recipients');
      }
      return response.json();
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      router.push('/login');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out',
      });
    }
  };

  if (userLoading) {
    return <LoadingFallback />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Welcome, {user.name}!</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => router.push('/dashboard/recipients/new')}>
            Add Recipient
          </Button>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        {recipientsLoading ? (
          <div>Loading recipients...</div>
        ) : (
          <RecipientList recipients={recipients} />
        )}
      </Suspense>
    </div>
  );
} 