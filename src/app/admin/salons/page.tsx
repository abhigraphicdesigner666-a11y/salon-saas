'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function SalonsRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin?tab=tenants')
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
      <span className="text-xs text-muted-foreground">Redirecting to Tenants Directory...</span>
    </div>
  )
}
