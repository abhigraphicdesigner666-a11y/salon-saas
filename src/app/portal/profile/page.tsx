'use client'

import React, { useState, useEffect } from 'react'
import { User, Phone, Mail, Award, Lock, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { CustomerRepository } from '@/lib/repositories/repositories'

export default function ClientProfilePage() {
  const { success, error } = useToast()
  const activeTenantId = 'demo-tenant-001'
  const activeCustomerId = 'c1' // Priya Sharma

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Profile states
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [allergies, setAllergies] = useState('Nickel allergies, sensitive scalp')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const cust = await CustomerRepository.getById(activeCustomerId)
        if (cust) {
          setFirstName(cust.first_name)
          setLastName(cust.last_name || '')
          setPhone(cust.phone)
          setEmail(cust.email || '')
          setNotes(cust.notes || '')
        }
      } catch (e) {
        console.error('Failed to load profile details', e)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleSave = async () => {
    try {
      setSubmitting(true)
      await CustomerRepository.update(activeCustomerId, {
        first_name: firstName,
        last_name: lastName,
        phone,
        email,
        notes
      })
      success('Saved', 'Profile information successfully updated.')
    } catch (e: any) {
      error('Failed to save profile', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs text-muted-foreground">Loading profile...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-bold">My Profile</h2>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Personal Information</CardTitle>
          <CardDescription className="text-xs">Update your personal contact details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>First Name</Label>
              <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-8 text-xs bg-card" />
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-8 text-xs bg-card" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Phone Number</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} className="h-8 text-xs bg-card" />
          </div>

          <div className="space-y-1">
            <Label>Email Address</Label>
            <Input value={email} onChange={e => setEmail(e.target.value)} className="h-8 text-xs bg-card" />
          </div>

          <div className="space-y-1">
            <Label>Allergies / Scalp Sensitivity</Label>
            <Input value={allergies} onChange={e => setAllergies(e.target.value)} className="h-8 text-xs bg-card" />
          </div>

          <div className="space-y-1">
            <Label>Special Preferences / Service Notes</Label>
            <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} className="text-xs bg-card" />
          </div>

          <Button className="w-full h-9 text-xs" variant="gradient" disabled={submitting} onClick={handleSave}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save Profile Changes
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
