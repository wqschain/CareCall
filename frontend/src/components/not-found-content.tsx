"use client"

import Link from 'next/link'

export function NotFoundContent() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 space-y-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <p className="text-gray-600">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link 
          href="/" 
          className="inline-block px-6 py-3 text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
} 