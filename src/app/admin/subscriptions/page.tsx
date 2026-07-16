'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SubscriptionsRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin?tab=billing')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <span className="text-xs text-muted-foreground">Redirecting to Billing Management...</span>
    </div>
  )
}
