"use client"

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

export function HomeContent() {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      {/* Hero Section */}
      <div className="container flex flex-col items-center justify-center min-h-[70vh] py-12 space-y-8 animate-fade-in">
        <div className="space-y-6 text-center flex flex-col items-center">
          <div className="relative flex flex-row items-center justify-center">
            {/* Phone image at top left of title */}
            <div className="hidden sm:block absolute -left-28 -top-12 z-10">
              <Image
                src="/assets/care-callphone.png"
                alt="Phone ringing"
                width={90}
                height={90}
                className="rounded-xl animate-fade-in-up animate-glow-pulse"
                style={{ filter: 'drop-shadow(0 0 12px #60a5fa) drop-shadow(0 0 8px #60a5fa)', background: 'transparent' }}
                priority
              />
            </div>
            <h1 className="text-6xl font-extrabold tracking-tighter sm:text-8xl bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x relative">
              CareCall
            </h1>
          </div>
          <p className="max-w-[600px] text-lg text-muted-foreground sm:text-xl animate-fade-in-delay">
            AI-powered wellness check-ins for your loved ones. Automated calls with natural conversation and instant alerts.
          </p>
        </div>
        <div className="space-x-4 animate-fade-in-delay2">
          <Link href="/login">
            <Button size="lg" className="transition-transform duration-200 hover:scale-105 shadow-lg">Get Started</Button>
          </Link>
          <Link href="https://github.com/wqschain/carecall" target="_blank">
            <Button variant="outline" size="lg" className="transition-transform duration-200 hover:scale-105">View on GitHub</Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="container grid gap-8 py-12 sm:grid-cols-3 animate-fade-in-up">
        <div className="rounded-xl bg-card shadow-lg p-6 text-center transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl border border-border">
          <h3 className="text-2xl font-bold mb-2">Natural Conversations</h3>
          <p className="text-muted-foreground">
            AI-powered calls that feel warm and personal, adapting to each recipient. Every check-in is unique and caring.
          </p>
        </div>
        <div className="rounded-xl bg-card shadow-lg p-6 text-center transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl border border-border">
          <h3 className="text-2xl font-bold mb-2">Smart Monitoring</h3>
          <p className="text-muted-foreground">
            Automated analysis of responses to detect concerns or emergencies. Stay informed with real-time insights.
          </p>
        </div>
        <div className="rounded-xl bg-card shadow-lg p-6 text-center transition-transform duration-200 hover:-translate-y-2 hover:shadow-2xl border border-border">
          <h3 className="text-2xl font-bold mb-2">Instant Alerts</h3>
          <p className="text-muted-foreground">
            Real-time notifications via SMS and email when attention is needed. Never miss a moment that matters.
          </p>
        </div>
      </div>

      {/* Section Divider */}
      <div className="w-full h-12 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 opacity-30 blur-sm animate-gradient-x" />

      {/* Footer */}
      <footer className="w-full py-8 bg-background flex flex-col items-center border-t border-border animate-fade-in-up">
        <div className="text-lg font-semibold mb-2">CareCall</div>
        <div className="text-muted-foreground text-sm mb-2">AI-powered care, made personal.</div>
        <div className="flex space-x-4">
          <Link href="/login" className="hover:underline">Get Started</Link>
          <Link href="https://github.com/wqschain/carecall" target="_blank" className="hover:underline">GitHub</Link>
        </div>
        <div className="text-xs text-muted-foreground mt-4">&copy; {new Date().getFullYear()} CareCall. All rights reserved.</div>
      </footer>

      {/* Animations (Tailwind custom classes) */}
      <style jsx global>{`
        .animate-fade-in { animation: fadeIn 1s ease; }
        .animate-fade-in-delay { animation: fadeIn 1.5s ease; }
        .animate-fade-in-delay2 { animation: fadeIn 2s ease; }
        .animate-fade-in-up { animation: fadeInUp 1.2s ease; }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradientX 4s ease-in-out infinite;
        }
        .animate-glow-pulse {
          animation: glowPulse 2s infinite alternate;
        }
        @keyframes glowPulse {
          0% {
            filter: drop-shadow(0 0 8px #60a5fa) drop-shadow(0 0 4px #60a5fa);
          }
          100% {
            filter: drop-shadow(0 0 24px #60a5fa) drop-shadow(0 0 16px #60a5fa);
          }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
        @keyframes gradientX {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  )
} 