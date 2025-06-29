import { describe, it, expect, vi, beforeEach } from 'vitest';
import { auth } from '../lib/auth';

describe('Auth Module', () => {
  beforeEach(() => {
    // Clear cookies before each test
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  });

  it('should handle email verification flow', async () => {
    // Mock fetch for sending verification code
    global.fetch = vi.fn()
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Verification code sent' })
      }))
      // Mock verify code response
      .mockImplementationOnce(() => Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'test_token',
          token_type: 'Bearer',
          user: {
            id: '1',
            email: 'test@example.com',
            name: 'Test User'
          }
        })
      }));

    // Test sending verification code
    await expect(auth.sendVerificationCode('test@example.com'))
      .resolves.not.toThrow();

    // Test verifying code
    const response = await auth.verifyCode('test@example.com', '1234');
    expect(response.access_token).toBe('test_token');
    expect(response.user.email).toBe('test@example.com');

    // Verify token was stored in cookie
    expect(document.cookie).toContain('auth-token=test_token');
  });

  it('should handle authentication errors', async () => {
    global.fetch = vi.fn().mockImplementation(() => Promise.resolve({
      ok: false,
      json: () => Promise.resolve({
        detail: 'Invalid verification code'
      })
    }));

    await expect(auth.verifyCode('test@example.com', 'wrong_code'))
      .rejects.toThrow('Invalid verification code');
  });

  it('should handle token management', () => {
    // Set a test token
    document.cookie = 'auth-token=test_token; path=/';

    // Test getting token
    expect(auth.getToken()).toBe('test_token');

    // Test logout
    auth.logout();
    expect(auth.getToken()).toBeNull();
  });
}); 