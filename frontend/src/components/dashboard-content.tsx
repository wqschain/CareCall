"use client"

import { useRouter } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from './ui/button';
import { RecipientList } from './recipient-list';
import { useToast } from './ui/use-toast';
import { Input } from './ui/input';
import { Pencil, Check, X, LogOut } from 'lucide-react';

interface User {
  name: string;
  email: string;
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

// Animated Nodes Background Component
function AnimatedNodesBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-background"></div>
    </div>
  );
}

export default function DashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    return (
      <div className="min-h-screen">
        <AnimatedNodesBackground />
        <LoadingFallback />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      <AnimatedNodesBackground />
      
      <div className="container py-8 relative z-10">
        <div 
          className={`transition-all duration-1000 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="flex justify-between items-center mb-12">
            <div className="space-y-2">
              <h1 className="text-5xl font-bold flex items-center gap-3 text-gray-900 dark:text-white">
                Welcome,
                {editingName ? (
                  <>
                    <Input
                      className="w-auto text-4xl font-bold px-3 py-2 bg-white/80 backdrop-blur-sm border-2 border-blue-300 focus:border-blue-500 rounded-lg transition-all duration-200 shadow-lg"
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
                      className="hover:bg-green-100 hover:text-green-600 transition-all duration-200"
                    >
                      <Check className="w-5 h-5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingName(false)}
                      aria-label="Cancel"
                      className="hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span
                      className="cursor-pointer hover:underline transition-all duration-200 hover:scale-105 inline-block"
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
                      className="ml-2 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200"
                      onClick={() => {
                        setEditingName(true);
                        setNameInput(user.name);
                      }}
                      aria-label="Edit name"
                    >
                      <Pencil className="w-5 h-5" />
                    </Button>
                  </>
                )}
                !
              </h1>
              <p className="text-lg text-gray-800 dark:text-gray-300 font-medium">{user.email}</p>
            </div>
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="group hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <LogOut className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform duration-200" />
                Logout
              </Button>
            </div>
          </div>

          <Suspense fallback={<LoadingFallback />}>
            {recipientsLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <RecipientList recipients={recipients} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
} 