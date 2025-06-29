'use client'

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
  phone_number: z.string().regex(/^\+?1?\d{9,15}$/, 'Invalid phone number format (e.g. +1234567890)'),
  condition: z.string().min(2, 'Condition must be at least 2 characters'),
  preferred_time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  emergency_contact_name: z.string().min(2, 'Name must be at least 2 characters'),
  emergency_contact_phone: z.string().regex(/^\+?1?\d{9,15}$/, 'Invalid phone number format (e.g. +1234567890)'),
  emergency_contact_email: z.string().email('Invalid email address'),
})

type FormData = z.infer<typeof formSchema>

interface RecipientFormProps {
  recipient?: FormData & { id?: number }
  onSuccess?: () => void
  isEditing?: boolean
}

export function RecipientForm({ recipient, onSuccess, isEditing = false }: RecipientFormProps) {
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
      const url = isEditing && recipient 
        ? `/api/recipients/${recipient.id}` 
        : '/api/recipients'
      
      const response = await fetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `Failed to ${isEditing ? 'update' : 'create'} recipient`)
      }

      return response.json()
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recipients'] })
      if (isEditing && recipient) {
        await queryClient.cancelQueries({ queryKey: ['recipient', recipient.id] })
      }

      // Snapshot the previous value
      const previousRecipients = queryClient.getQueryData(['recipients'])
      const previousRecipient = isEditing && recipient 
        ? queryClient.getQueryData(['recipient', recipient.id])
        : null

      // Optimistically update to the new value
      if (isEditing && recipient) {
        queryClient.setQueryData(['recipient', recipient.id], (old: any) => ({
          ...old,
          ...newData
        }))
      }

      // Return a context object with the snapshotted value
      return { previousRecipients, previousRecipient }
    },
    onError: (err, newData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousRecipients) {
        queryClient.setQueryData(['recipients'], context.previousRecipients)
      }
      if (context?.previousRecipient) {
        queryClient.setQueryData(['recipient', recipient?.id], context.previousRecipient)
      }
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || `Failed to ${isEditing ? 'update' : 'create'} recipient. Please try again.`,
      })
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['recipients'] })
      if (isEditing && recipient) {
        queryClient.invalidateQueries({ queryKey: ['recipient', recipient.id] })
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: `Recipient has been ${isEditing ? 'updated' : 'created'} successfully.`,
      })
      
      // Only redirect for new recipients, not for updates
      if (!isEditing) {
        if (onSuccess) onSuccess()
        router.push('/dashboard')
      } else {
        // For updates, just call onSuccess if provided
        if (onSuccess) onSuccess()
      }
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
          {mutation.isPending ? 'Saving...' : `${isEditing ? 'Update' : 'Save'} Recipient`}
        </Button>
      </form>
    </Form>
  )
} 