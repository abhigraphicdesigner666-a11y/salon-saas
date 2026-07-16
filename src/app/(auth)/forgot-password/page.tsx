'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { authService } from '@/services/auth'
import Link from 'next/link'

const forgotSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
})

type ForgotValues = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (values: ForgotValues) => {
    try {
      setIsLoading(true)
      const { error: apiError } = await authService.resetPasswordForEmail(values.email)
      
      if (apiError) {
        error('Request Failed', apiError.message || 'Could not send recovery link.')
        return
      }

      success('Email Dispatched', 'Check your inbox for a password reset link.')
      setIsSent(true)
    } catch (e: any) {
      error('An error occurred', e.message || 'Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Reset Password</h1>
        <p className="text-sm text-muted-foreground mt-1">
          We&apos;ll send you a link to reset your password
        </p>
      </div>

      {isSent ? (
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            A password recovery email has been sent. Please check your inbox and follow the instructions.
          </p>
          <Link href="/login" className="inline-flex items-center text-xs text-primary hover:underline font-semibold mt-2">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-9"
                disabled={isLoading}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          <div className="text-center mt-2">
            <Link href="/login" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground hover:underline font-medium">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Back to login
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
