'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { auth, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = auth.getToken();
        if (!token) {
          setIsLoading(false);
          if (!pathname?.startsWith('/login')) {
            router.push('/login');
          }
          return;
        }

        const userData = await auth.getCurrentUser();
        setUser(userData);

        if (pathname === '/login') {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        if (!pathname?.startsWith('/login')) {
          router.push('/login');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [pathname, router]);

  const logout = () => {
    auth.logout();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        {children}
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
} 