'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  actionLabel?: string
  onActionClick?: () => void
  actionIcon?: React.ComponentType<any>
  children?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  actionLabel,
  onActionClick,
  actionIcon: ActionIcon = Plus,
  children,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children ? (
        <div className="flex items-center gap-2">{children}</div>
      ) : actionLabel && onActionClick ? (
        <Button variant="gradient" onClick={onActionClick} className="shadow-lg shadow-primary/20">
          <ActionIcon className="h-4 w-4 mr-2" /> {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
