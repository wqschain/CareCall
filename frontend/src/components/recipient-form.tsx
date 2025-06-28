import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_number: z.string().regex(/^\+?1?\d{9,15}$/, 'Invalid phone number'),
  condition: z.string().min(2, 'Condition must be at least 2 characters'),
  preferred_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  emergency_contact_name: z.string().min(2, 'Name must be at least 2 characters'),
  emergency_contact_phone: z.string().regex(/^\+?1?\d{9,15}$/, 'Invalid phone number'),
  emergency_contact_email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof formSchema>

interface RecipientFormProps {
  recipient?: FormData
  onSuccess?: () => void
}

export function RecipientForm({ recipient, onSuccess }: RecipientFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: recipient || {
      name: '',
      phone_number: '',
      condition: '',
      preferred_time: '09:00',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_email: '',
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create recipient')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients'] })
      toast({
        title: 'Success',
        description: 'Recipient has been created.',
      })
      if (onSuccess) onSuccess()
      router.push('/dashboard')
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create recipient. Please try again.',
      })
    },
  })

  function onSubmit(data: FormData) {
    mutation.mutate(data)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="condition"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Condition</FormLabel>
              <FormControl>
                <Input placeholder="Diabetes" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="preferred_time"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preferred Call Time (UTC)</FormLabel>
              <FormControl>
                <Input type="time" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergency_contact_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergency_contact_phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Phone</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emergency_contact_email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emergency Contact Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Saving...' : 'Save Recipient'}
        </Button>
      </form>
    </Form>
  )
} 