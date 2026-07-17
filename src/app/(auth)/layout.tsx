'use client'

import React from 'react'
import { Logo } from '@/components/shared/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Gradients */}
      <div className="absolute inset-0 gradient-mesh opacity-50" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md px-4 py-12">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" showText={true} />
          <p className="text-sm text-muted-foreground mt-2 font-medium">Enterprise AI Salon Operations</p>
        </div>

        {/* Form wrapper */}
        <main className="w-full glass-card p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
