import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock window.location
Object.defineProperty(window, 'location', {
  value: {
    href: '/',
  },
  writable: true,
});

// Setup fetch mock
global.fetch = vi.fn(); 