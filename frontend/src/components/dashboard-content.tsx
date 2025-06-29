"use client"

import { useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { RecipientList } from './recipient-list';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { Pencil, Check, X } from 'lucide-react';

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
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

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

  // Name update mutation
  const updateNameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || 'Failed to update name');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast({ title: 'Name updated', description: 'Your name has been updated.' });
      setEditingName(false);
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to update name.',
      });
    },
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
          <h1 className="text-4xl font-bold flex items-center gap-2">
            Welcome,
            {editingName ? (
              <>
                <Input
                  className="w-auto text-3xl font-bold px-2 py-1"
                  value={nameInput}
                  onChange={e => setNameInput(e.target.value)}
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') updateNameMutation.mutate(nameInput);
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => updateNameMutation.mutate(nameInput)}
                  disabled={updateNameMutation.isPending}
                  aria-label="Save name"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingName(false)}
                  aria-label="Cancel"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <span
                  className="cursor-pointer hover:underline"
                  onClick={() => {
                    setEditingName(true);
                    setNameInput(user.name);
                  }}
                  title="Click to edit your name"
                >
                  {user.name}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="ml-1"
                  onClick={() => {
                    setEditingName(true);
                    setNameInput(user.name);
                  }}
                  aria-label="Edit name"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </>
            )}
            !
          </h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
        <div className="flex gap-4">
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