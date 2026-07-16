'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/toast'
import { authService } from '@/services/auth'
import Link from 'next/link'

const signupSchema = z.object({
  // Step 1: Salon Onboarding
  salonName: z.string().min(2, { message: 'Salon name must be at least 2 characters' }),
  businessCategory: z.string().min(1, { message: 'Please select a business category' }),
  currency: z.string().min(1, { message: 'Please select a currency' }),
  country: z.string().min(1, { message: 'Please select a country' }),
  timezone: z.string().min(1, { message: 'Please select a timezone' }),
  
  // Step 2: Owner Settings
  ownerName: z.string().min(2, { message: 'Owner name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
})

type SignupValues = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const { success, error } = useToast()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, trigger, setValue, watch, formState: { errors } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      salonName: '',
      businessCategory: 'hair_skin',
      currency: 'INR',
      country: 'India',
      timezone: 'Asia/Kolkata',
      ownerName: '',
      email: '',
      password: '',
    }
  })

  const nextStep = async () => {
    const fieldsToValidate = ['salonName', 'businessCategory', 'currency', 'country', 'timezone'] as const
    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setStep(2)
    }
  }

  const prevStep = () => {
    setStep(1)
  }

  const onSubmit = async (values: SignupValues) => {
    try {
      setIsLoading(true)
      const { data, error: apiError } = await authService.signUp(values)

      if (apiError) {
        error('Sign Up Failed', apiError.message || 'Could not register salon. Please try again.')
        return
      }

      success('Registration Successful', 'Welcome! Your salon space is ready. Redirecting...')
      
      setTimeout(() => {
        router.push('/dashboard')
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
        <h1 className="text-xl font-bold flex items-center justify-center gap-1">
          <Sparkles className="h-5 w-5 text-violet-500" /> Start Your Free Trial
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Set up your salon and account in minutes</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div className={`h-1.5 w-16 rounded-full transition-all duration-300 ${step === 1 ? 'bg-primary' : 'bg-primary/30'}`} />
        <div className={`h-1.5 w-16 rounded-full transition-all duration-300 ${step === 2 ? 'bg-primary' : 'bg-muted'}`} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Salon Name */}
              <div className="space-y-2">
                <Label htmlFor="salonName">Salon Name</Label>
                <Input
                  id="salonName"
                  placeholder="e.g. Glamour Studio"
                  disabled={isLoading}
                  {...register('salonName')}
                />
                {errors.salonName && (
                  <p className="text-xs text-rose-500 font-medium">{errors.salonName.message}</p>
                )}
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="businessCategory">Business Category</Label>
                <Select
                  defaultValue={watch('businessCategory')}
                  onValueChange={(val) => setValue('businessCategory', val)}
                >
                  <SelectTrigger id="businessCategory">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hair_skin">Hair Care & Skin Treatment</SelectItem>
                    <SelectItem value="spa_massage">Spa & Wellness</SelectItem>
                    <SelectItem value="nail_makeup">Nail Art & Bridal Makeup</SelectItem>
                    <SelectItem value="mens_grooming">Men&apos;s Grooming</SelectItem>
                  </SelectContent>
                </Select>
                {errors.businessCategory && (
                  <p className="text-xs text-rose-500 font-medium">{errors.businessCategory.message}</p>
                )}
              </div>

              {/* Currency & Country */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select
                    defaultValue={watch('currency')}
                    onValueChange={(val) => setValue('currency', val)}
                  >
                    <SelectTrigger id="currency">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    defaultValue={watch('country')}
                    onValueChange={(val) => setValue('country', val)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="India">India</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Timezone */}
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  defaultValue={watch('timezone')}
                  onValueChange={(val) => setValue('timezone', val)}
                >
                  <SelectTrigger id="timezone">
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Step 1 Control */}
              <Button
                type="button"
                className="w-full mt-2"
                variant="gradient"
                onClick={nextStep}
              >
                Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Full Name</Label>
                <Input
                  id="ownerName"
                  placeholder="e.g. Priya Sharma"
                  disabled={isLoading}
                  {...register('ownerName')}
                />
                {errors.ownerName && (
                  <p className="text-xs text-rose-500 font-medium">{errors.ownerName.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="priya@example.com"
                  disabled={isLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  disabled={isLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-rose-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Controls */}
              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="w-2/5"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button
                  type="submit"
                  className="w-3/5"
                  variant="gradient"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...
                    </>
                  ) : (
                    <>
                      Create Salon <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <div className="text-center text-xs">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="text-primary hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  )
}
