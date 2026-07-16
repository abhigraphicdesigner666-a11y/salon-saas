'use client'

import { TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useEffect, useState } from 'react'

interface StatCardProps {
  title: string
  value: number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  prefix?: string
  suffix?: string
  isCurrency?: boolean
  color?: 'violet' | 'pink' | 'teal' | 'amber' | 'blue' | 'green'
}

const colorMap = {
  violet: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20',
  pink: 'from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20',
  teal: 'from-teal-500/10 to-emerald-500/10 dark:from-teal-500/20 dark:to-emerald-500/20',
  amber: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
  blue: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
  green: 'from-green-500/10 to-emerald-500/10 dark:from-green-500/20 dark:to-emerald-500/20',
}

const iconColorMap = {
  violet: 'text-violet-600 dark:text-violet-400',
  pink: 'text-pink-600 dark:text-pink-400',
  teal: 'text-teal-600 dark:text-teal-400',
  amber: 'text-amber-600 dark:text-amber-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
}

export function StatCard({ title, value, change, changeLabel, icon: Icon, prefix, suffix, isCurrency, color = 'violet' }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const increment = value / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [value])

  const formattedValue = isCurrency ? formatCurrency(displayValue) : `${prefix || ''}${displayValue.toLocaleString('en-IN')}${suffix || ''}`

  return (
    <div className={cn('stat-card bg-gradient-to-br border border-border', colorMap[color])}>
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{formattedValue}</p>
          {typeof change === 'number' && (
            <div className="flex items-center gap-1.5">
              {change >= 0 ? (
                <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              )}
              <span className={cn('text-xs font-medium', change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && <span className="text-xs text-muted-foreground">{changeLabel}</span>}
            </div>
          )}
        </div>
        <div className={cn('rounded-xl p-2.5 bg-background/60', iconColorMap[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}
