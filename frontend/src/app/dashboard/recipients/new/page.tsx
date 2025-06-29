'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

interface RecipientFormData {
  name: string;
  phone_number: string;
  check_in_time: string;
  timezone: string;
}

export default function NewRecipientPage() {
  const [formData, setFormData] = useState<RecipientFormData>({
    name: '',
    phone_number: '',
    check_in_time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Format phone number to E.164 format
      const formattedPhone = formData.phone_number.replace(/\D/g, '');
      const phoneWithCountry = formattedPhone.startsWith('1') ? 
        formattedPhone : 
        `1${formattedPhone}`;

      await api.post('/api/recipients', {
        ...formData,
        phone_number: `+${phoneWithCountry}`,
      });

      toast({
        title: 'Success!',
        description: 'Recipient added successfully.',
      });

      router.push('/dashboard');
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add recipient',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 0) {
      // Format as (XXX) XXX-XXXX
      if (value.length <= 3) {
        value = `(${value}`;
      } else if (value.length <= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
      } else {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6, 10)}`;
      }
    }
    setFormData({ ...formData, phone_number: value });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.back()}
        >
          ← Back
        </Button>

        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">Add New Recipient</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter recipient's name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone_number}
                onChange={handlePhoneChange}
                placeholder="(555) 555-5555"
                maxLength={14}
                required
              />
              <p className="text-sm text-gray-600">
                U.S. phone numbers only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Daily Check-in Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.check_in_time}
                onChange={(e) => setFormData({ ...formData, check_in_time: e.target.value })}
                required
              />
              <p className="text-sm text-gray-600">
                Time is in {formData.timezone}
              </p>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add Recipient'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
} 