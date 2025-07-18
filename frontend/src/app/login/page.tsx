'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
console.log('[DEBUG] API_URL:', API_URL);

const formSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  code: z.string()
    .optional()
    .refine((val) => !val || /^\d{4}$/.test(val), {
      message: 'Verification code must be exactly 4 digits'
    }),
});

export default function LoginPage() {
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Check if we're already logged in
    const token = document.cookie.includes('auth-token');
    console.log('[DEBUG] Initial auth check - Token exists:', token);
    if (token) {
      console.log('[DEBUG] Token found, redirecting to dashboard');
      window.location.href = '/dashboard';
    }
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      code: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!isCodeSent) {
        const loginUrl = `${API_URL}/api/auth/login/email`;
        console.log('[DEBUG] Sending code - URL:', loginUrl);
        console.log('[DEBUG] Sending code - Data:', { email: values.email });

        // Request verification code
        const response = await fetch(loginUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: values.email }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('[DEBUG] Send code error:', error);
          throw new Error(error.detail || 'Failed to send verification code');
        }

        setIsCodeSent(true);
        toast({
          title: 'Code Sent',
          description: 'Please check your email for the verification code.',
        });
      } else {
        if (isRedirecting) return;
        setIsRedirecting(true);
        console.log('[DEBUG] Starting verification process...');

        const verifyUrl = `${API_URL}/api/auth/verify`;
        console.log('[DEBUG] Verifying code - URL:', verifyUrl);
        console.log('[DEBUG] Verifying code - Data:', { email: values.email, code: values.code });

        const response = await fetch(verifyUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: values.email,
            code: values.code
          }),
          credentials: 'include'
        });

        if (!response.ok) {
          setIsRedirecting(false);
          const error = await response.json().catch(e => ({ detail: 'Failed to parse error response' }));
          console.error('[DEBUG] Verify error:', error);
          throw new Error(error.detail || 'Invalid verification code');
        }

        const data = await response.json();
        console.log('[DEBUG] Verify success, got data:', data);
        
        if (!data.access_token) {
          throw new Error('No access token received from server');
        }
        
        // Store the token
        console.log('[DEBUG] Setting auth-token cookie...');
        document.cookie = `auth-token=${data.access_token}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;
        console.log('[DEBUG] Cookie set, verifying cookie exists:', document.cookie.includes('auth-token'));
        
        toast({
          title: 'Success',
          description: 'Login successful! Redirecting...',
        });

        // Force a hard redirect to dashboard
        console.log('[DEBUG] Redirecting to dashboard...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cookie to be set
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('[DEBUG] Request failed:', error);
      setIsRedirecting(false);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
      });
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to CareCall</CardTitle>
          <CardDescription>
            {isCodeSent
              ? 'Enter the verification code sent to your email'
              : 'Enter your email to receive a verification code'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        disabled={isCodeSent}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isCodeSent && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter verification code"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" className="w-full">
                {isCodeSent ? 'Verify Code' : 'Send Code'}
              </Button>

              {isCodeSent && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsCodeSent(false)}
                >
                  Try Different Email
                </Button>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
} 