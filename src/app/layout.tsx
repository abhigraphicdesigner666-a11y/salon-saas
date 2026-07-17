import type { Metadata, Viewport } from 'next'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/lib/auth/auth-context'
import { ToastProvider } from '@/components/ui/toast'
import './globals.css'

const inter = { variable: 'font-sans' }

export const metadata: Metadata = {
  title: { default: 'SalonAI — AI-Powered Salon Management Platform', template: '%s | SalonAI' },
  description: 'Transform your salon business with AI-powered appointment scheduling, CRM, billing, inventory management, and marketing automation. Trusted by 50,000+ salons.',
  keywords: ['salon management', 'salon software', 'appointment booking', 'salon CRM', 'beauty salon', 'spa management', 'AI salon', 'salon billing'],
  authors: [{ name: 'SalonAI' }],
  openGraph: { title: 'SalonAI — AI-Powered Salon Management', description: 'The smartest way to manage your salon business', type: 'website' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

