import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewRecipientPage from '../app/dashboard/recipients/new/page';
import { api } from '../lib/api';

// Mock the API module
vi.mock('../lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('NewRecipientPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form', () => {
    render(<NewRecipientPage />);
    
    expect(screen.getByText('Add New Recipient')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /phone number/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /daily check-in time/i })).toBeInTheDocument();
  });

  it('should format phone number as user types', () => {
    render(<NewRecipientPage />);
    
    const phoneInput = screen.getByRole('textbox', { name: /phone number/i });
    fireEvent.change(phoneInput, { target: { value: '1234567890' } });
    
    expect(phoneInput).toHaveValue('(123) 456-7890');
  });

  it('should submit the form with correct data', async () => {
    const mockApiPost = vi.mocked(api.post);
    mockApiPost.mockResolvedValueOnce({});

    render(<NewRecipientPage />);
    
    // Fill out the form
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /phone number/i }), {
      target: { value: '1234567890' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: /daily check-in time/i }), {
      target: { value: '09:00' },
    });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /add recipient/i }));
    
    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith('/api/recipients', {
        name: 'John Doe',
        phone_number: '+11234567890',
        check_in_time: '09:00',
        timezone: expect.any(String),
      });
    });
  });

  it('should handle API errors', async () => {
    const mockApiPost = vi.mocked(api.post);
    mockApiPost.mockRejectedValueOnce(new Error('API Error'));

    render(<NewRecipientPage />);
    
    // Fill out and submit the form
    fireEvent.change(screen.getByRole('textbox', { name: /name/i }), {
      target: { value: 'John Doe' },
    });
    fireEvent.click(screen.getByRole('button', { name: /add recipient/i }));
    
    await waitFor(() => {
      expect(screen.getByText('Adding...')).toBeInTheDocument();
    });
  });
}); 