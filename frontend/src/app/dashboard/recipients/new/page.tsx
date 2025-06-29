import { RecipientForm } from '@/components/recipient-form';

export default function NewRecipientPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container py-8">
        <div className="animate-in slide-in-from-top-4">
          <h1 className="text-5xl font-bold tracking-tight mb-8 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            Add New Recipient
          </h1>
          <RecipientForm />
        </div>
      </div>
    </div>
  );
} 