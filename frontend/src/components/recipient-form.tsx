'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { User, Phone, Heart, Clock, Shield, Mail, Save, ArrowLeft } from 'lucide-react'

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
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

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
    <div className={`transition-all duration-1000 ease-out ${
      mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
    }`}>
      <div className="flex gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="group hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information Card */}
          <Card className="animate-in slide-in-from-top-4 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-300">Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
                      <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-300">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1234567890" 
                          {...field} 
                          className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-300">Medical Condition</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Diabetes, Heart condition, etc." 
                          {...field} 
                          className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
                      <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-300">Preferred Call Time (UTC)</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                          className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact Card */}
          <Card className="animate-in slide-in-from-top-4 hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900 dark:text-white">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="emergency_contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-300">Emergency Contact Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Jane Doe" 
                        {...field} 
                        className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="emergency_contact_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-300">Emergency Contact Phone</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+1234567890" 
                          {...field} 
                          className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
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
                      <FormLabel className="text-sm font-medium text-gray-800 dark:text-gray-300">Emergency Contact Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="jane@example.com" 
                          {...field} 
                          className="h-12 text-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Save className="w-5 h-5 mr-2" />
              {mutation.isPending ? 'Saving...' : `${isEditing ? 'Update' : 'Save'} Recipient`}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
} 