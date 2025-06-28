"use client"

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './ui/button';
import { RecipientList } from './recipient-list';
import { useToast } from './ui/use-toast';

export default function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          throw new Error('Not authenticated');
        }
        const userData = await response.json();
        setUser(userData);
      } catch (error) {
        router.push('/login');
      }
    };
    fetchUser();
  }, [router]);

  // Fetch recipients
  const { data: recipients = [], isLoading } = useQuery({
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

      {isLoading ? (
        <div>Loading recipients...</div>
      ) : (
        <RecipientList recipients={recipients} />
      )}
    </div>
  );
} 