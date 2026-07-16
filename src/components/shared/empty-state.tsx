'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { LucideIcon, HelpCircle } from 'lucide-react'

interface EmptyStateProps {
  title: string
  description?: string
  icon?: LucideIcon
  actionLabel?: string
  onActionClick?: () => void
}

export function EmptyState({
  title,
  description,
  icon: Icon = HelpCircle,
  actionLabel,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed rounded-2xl bg-card min-h-[300px]">
      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      )}
      {actionLabel && onActionClick && (
        <Button variant="outline" size="sm" onClick={onActionClick} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
