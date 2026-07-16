'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Lock, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { authService } from '@/services/auth'
import Link from 'next/link'

const resetSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetValues = z.infer<typeof resetSchema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (values: ResetValues) => {
    try {
      setIsLoading(true)
      const { error: apiError } = await authService.updatePassword(values.password)
      
      if (apiError) {
        error('Update Failed', apiError.message || 'Could not reset password.')
        return
      }

      success('Password Updated', 'Your password has been successfully changed. Please log in.')
      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (e: any) {
      error('An error occurred', e.message || 'Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Choose New Password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your new password details below
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="password">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-9"
              disabled={isLoading}
              {...register('password')}
            />
          </div>
          {errors.password && (
            <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="pl-9"
              disabled={isLoading}
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-500 font-medium">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
            </>
          ) : (
            'Reset Password'
          )}
        </Button>

        <div className="text-center mt-2">
          <Link href="/login" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground hover:underline font-medium">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      </form>
    </div>
  )
}
