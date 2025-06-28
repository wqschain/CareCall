import { Inter } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@auth0/nextjs-auth0/client'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'CareCall - AI-Powered Care Check-ins',
  description: 'Automated wellness check-ins for your loved ones',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  )
} 