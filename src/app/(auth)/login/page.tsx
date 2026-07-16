'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Eye, EyeOff, Mail, Lock, Loader2, Key } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { authService } from '@/services/auth'
import Link from 'next/link'

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  rememberMe: z.boolean().optional(),
})

type LoginValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { success, error } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: true,
    }
  })

  const onSubmit = async (values: LoginValues) => {
    try {
      setIsLoading(true)
      const { data, error: apiError } = await authService.signIn({
        email: values.email,
        password: values.password,
        rememberMe: values.rememberMe,
      })

      if (apiError) {
        error('Sign In Failed', apiError.message || 'Invalid email or password.')
        return
      }

      success('Sign In Successful', 'Redirecting you to the platform...')
      
      // Redirect based on role in JWT metadata
      const role = data?.user?.app_metadata?.role || 'staff'
      setTimeout(() => {
        if (role === 'super_admin') {
          router.push('/admin')
        } else if (role === 'customer') {
          router.push('/portal')
        } else {
          router.push('/dashboard')
        }
      }, 1000)
    } catch (e: any) {
      error('An error occurred', e.message || 'Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Pre-fill demo profiles
  const fillDemo = (role: 'owner' | 'admin' | 'customer') => {
    if (role === 'owner') {
      setValue('email', 'owner@glamstyle.in')
      setValue('password', 'demo123456')
    } else if (role === 'admin') {
      setValue('email', 'admin@salonai.app')
      setValue('password', 'demo123456')
    } else {
      setValue('email', 'customer@gmail.com')
      setValue('password', 'demo123456')
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-xl font-bold">Welcome Back</h1>
        <p className="text-sm text-muted-foreground mt-1">Sign in to manage your salon operations</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email */}
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

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline font-medium"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="pl-9 pr-9"
              disabled={isLoading}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
            disabled={isLoading}
            {...register('rememberMe')}
          />
          <Label htmlFor="rememberMe" className="text-xs cursor-pointer select-none">
            Remember me for 7 days
          </Label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          className="w-full"
          variant="gradient"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      <div className="text-center text-xs">
        <span className="text-muted-foreground">Don&apos;t have an account? </span>
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Sign up now
        </Link>
      </div>

      {/* Demo Credentials Section */}
      <div className="border-t pt-4">
        <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1 justify-center">
          <Key className="h-3 w-3" /> Quick Demo Fill
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] py-1 h-7"
            onClick={() => fillDemo('owner')}
            disabled={isLoading}
          >
            Salon Owner
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] py-1 h-7"
            onClick={() => fillDemo('admin')}
            disabled={isLoading}
          >
            SaaS Admin
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-[10px] py-1 h-7"
            onClick={() => fillDemo('customer')}
            disabled={isLoading}
          >
            Customer
          </Button>
        </div>
      </div>
    </div>
  )
}
