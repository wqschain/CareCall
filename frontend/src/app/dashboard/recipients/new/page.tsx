import { RecipientForm } from '@/components/recipient-form';

export default function NewRecipientPage() {
  return (
    <div className="container py-8">
      <h1 className="text-4xl font-bold tracking-tight mb-8">Add New Recipient</h1>
      <RecipientForm />
    </div>
  );
} 