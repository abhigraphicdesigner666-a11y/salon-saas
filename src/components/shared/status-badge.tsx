'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { getStatusColor } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const formatted = status.replace('_', ' ')
  const capitalize = formatted.charAt(0).toUpperCase() + formatted.slice(1)

  return (
    <Badge className={cn('text-[11px] font-medium px-2 py-0.5 shadow-none border-none shrink-0', getStatusColor(status))}>
      {capitalize}
    </Badge>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
