import { Scissors, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
}

export function Logo({ size = 'md', showText = true, className }: LogoProps) {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-lg', container: 'h-8 w-8' },
    md: { icon: 'h-6 w-6', text: 'text-xl', container: 'h-10 w-10' },
    lg: { icon: 'h-8 w-8', text: 'text-2xl', container: 'h-12 w-12' },
  }

  const s = sizes[size]

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('relative flex items-center justify-center rounded-xl gradient-primary shadow-lg', s.container)}>
        <Scissors className={cn('text-white', s.icon)} />
        <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-amber-400" />
      </div>
      {showText && (
        <span className={cn('font-bold tracking-tight', s.text)}>
          <span className="gradient-text">Salon</span>
          <span className="text-foreground">AI</span>
        </span>
      )}
    </div>
  )
}
