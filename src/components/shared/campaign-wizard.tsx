'use client'

import React, { useState, useEffect } from 'react'
import { Megaphone, MessageSquare, Mail, Bell, Loader2, Sparkles } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MarketingService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface CampaignWizardProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const templates = [
  { id: 't1', name: 'Standard Welcome Greeting', text: 'Hi {{name}}! Welcome to {{salon_name}}. Enjoy your new client gift code {{referral_code}} for ₹500 off!' },
  { id: 't2', name: 'Win-Back Promotion', text: 'Hey {{name}}, we miss you at {{salon_name}}! Treat yourself to a haircut with 15% off. Coupon code: FESTIVAL20.' },
  { id: 't3', name: 'Wallet Credit Alert', text: 'Hi {{name}}! ₹{{wallet_balance}} has been credited to your store wallet. Redeem it during checkout!' }
]

export function CampaignWizard({ isOpen, onClose, onSuccess }: CampaignWizardProps) {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [step, setStep] = useState(1)
  const [submitting, setSubmitting] = useState(false)

  const [segments, setSegments] = useState<any[]>([])

  // Form states
  const [name, setName] = useState('Weekend Flash Offer')
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'email'>('whatsapp')
  const [selectedSegmentId, setSelectedSegmentId] = useState('seg1')
  const [messageText, setMessageText] = useState(templates[0].text)
  const [scheduleTime, setScheduleTime] = useState('')

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      const loadSegments = async () => {
        const segList = await MarketingService.listSegments(activeTenantId)
        setSegments(segList)
      }
      loadSegments()
    }
  }, [isOpen])

  const selectTemplate = (text: string) => {
    setMessageText(text)
  }

  const handleCreate = async () => {
    if (!permissionHelpers.canCreate(role, 'marketing')) {
      error('Access Denied', 'Your role is not authorized to create marketing campaigns.')
      return
    }

    try {
      setSubmitting(true)
      const segmentObj = segments.find(s => s.id === selectedSegmentId)
      await MarketingService.createCampaign(
        activeTenantId,
        {
          name,
          channel,
          segment_id: selectedSegmentId,
          segment_name: segmentObj ? segmentObj.name : 'VIP Customers',
          recipients_count: segmentObj ? segmentObj.customer_count : 10,
          message_text: messageText,
          status: scheduleTime ? 'scheduled' : 'draft',
          schedule_time: scheduleTime || null
        },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Campaign Saved', 'Marketing campaign registered.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Creation failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg text-left">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" /> Campaign Builder Wizard
          </DialogTitle>
          <DialogDescription>Create targeted communications and promotions for your customers.</DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-3">
            <div className="space-y-1">
              <Label>Campaign Title</Label>
              <Input value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Channel Type</Label>
              <Select value={channel} onValueChange={(val: any) => setChannel(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp Business API</SelectItem>
                  <SelectItem value="sms">Transactional SMS (DND override)</SelectItem>
                  <SelectItem value="email">Rich HTML Email (AWS SES)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Recipient Segment</Label>
              <Select value={selectedSegmentId} onValueChange={setSelectedSegmentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {segments.map(seg => (
                    <SelectItem key={seg.id} value={seg.id}>{seg.name} ({seg.customer_count} users)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Pick Template Pre-fill</Label>
              <div className="grid grid-cols-1 gap-2">
                {templates.map(t => (
                  <button key={t.id} onClick={() => selectTemplate(t.text)} className="p-2 border rounded-lg text-xs text-left hover:bg-muted/30">
                    <div className="font-semibold">{t.name}</div>
                    <div className="truncate text-muted-foreground mt-0.5">{t.text}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label>Draft Message Content</Label>
              <Textarea rows={4} value={messageText} onChange={e => setMessageText(e.target.value)} />
              <p className="text-[10px] text-muted-foreground mt-1">Available variables: <code>{"{{name}}"}</code>, <code>{"{{salon_name}}"}</code>, <code>{"{{wallet_balance}}"}</code>, <code>{"{{referral_code}}"}</code></p>
            </div>
            <div className="space-y-1">
              <Label>Schedule Time (Optional)</Label>
              <Input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 1 ? (
            <>
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={() => setStep(2)}>Next</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button variant="gradient" onClick={handleCreate} disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Save Campaign
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
