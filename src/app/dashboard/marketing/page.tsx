'use client'

import React, { useState, useEffect } from 'react'
import { Megaphone, Users, Award, Tag, Sparkles, MessageSquare, Play, Calendar, CheckCircle, Clock, Trash2, Plus, ArrowUpRight, TrendingUp, DollarSign } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { CampaignWizard } from '@/components/shared/campaign-wizard'
import { CouponDetailsModal } from '@/components/shared/coupon-details-modal'
import { MarketingService } from '@/services/business-services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

export default function MarketingPage() {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [loading, setLoading] = useState(true)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [segments, setSegments] = useState<any[]>([])
  const [coupons, setCoupons] = useState<any[]>([])

  // Modal controls
  const [showWizard, setShowWizard] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)

  const loadMarketingData = async () => {
    try {
      setLoading(true)
      const camps = await MarketingService.listCampaigns(activeTenantId)
      setCampaigns(camps)

      const segs = await MarketingService.listSegments(activeTenantId)
      setSegments(segs)

      const coups = await MarketingService.listCoupons(activeTenantId)
      setCoupons(coups)
    } catch (e) {
      console.error('Failed to load marketing dashboard', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMarketingData()
  }, [])

  const handleSendCampaign = async (campId: string) => {
    try {
      await MarketingService.sendCampaign(
        campId,
        activeTenantId,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Campaign Dispatched', 'Broadcast analytics simulated.')
      loadMarketingData()
    } catch (e: any) {
      error('Send failed', e.message)
    }
  }

  // Compute stats
  const totalCampaigns = campaigns.length
  const totalSent = campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue_generated || 0), 0)
  const averageOpen = totalSent > 0 ? Math.round((campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0) / totalSent) * 100) : 78

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketing Automation"
        description="Target client segments with automated campaign flows, coupons, and referral tools."
      >
        {permissionHelpers.canCreate(role, 'marketing') && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowCouponModal(true)}>
              <Tag className="h-4 w-4 mr-1.5" /> Create Coupon
            </Button>
            <Button size="sm" variant="gradient" onClick={() => setShowWizard(true)}>
              <Plus className="h-4 w-4 mr-1.5" /> Create Campaign
            </Button>
          </div>
        )}
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-left">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Total Campaigns</p>
              <h3 className="text-2xl font-bold mt-1">{totalCampaigns}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-500"><Megaphone className="h-5 w-5" /></div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Messages Sent</p>
              <h3 className="text-2xl font-bold mt-1">{totalSent}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500"><MessageSquare className="h-5 w-5" /></div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Average Open Rate</p>
              <h3 className="text-2xl font-bold mt-1">{averageOpen}%</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500"><TrendingUp className="h-5 w-5" /></div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase font-semibold">Campaign Revenue</p>
              <h3 className="text-2xl font-bold mt-1">{formatCurrency(totalRevenue)}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500"><DollarSign className="h-5 w-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
          <TabsTrigger value="campaigns" className="tabs-trigger border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">Campaigns</TabsTrigger>
          <TabsTrigger value="segments" className="tabs-trigger border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">Segments</TabsTrigger>
          <TabsTrigger value="coupons" className="tabs-trigger border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">Promo Coupons</TabsTrigger>
          <TabsTrigger value="templates" className="tabs-trigger border-b-2 border-transparent data-[state=active]:border-primary rounded-none px-1 pb-3">Templates</TabsTrigger>
        </TabsList>

        {/* Tab 1: Campaigns List */}
        <TabsContent value="campaigns" className="pt-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map(camp => (
              <Card key={camp.id} className="border bg-card">
                <CardContent className="p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm">{camp.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="capitalize text-[10px]">{camp.channel}</Badge>
                        <span className="text-[10px] text-muted-foreground">Audience: {camp.segment_name}</span>
                      </div>
                    </div>
                    <StatusBadge status={camp.status} />
                  </div>

                  {camp.status === 'completed' ? (
                    <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center text-xs">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Delivered</span>
                        <strong>{camp.sent_count}</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Opened</span>
                        <strong>{camp.opened_count} ({Math.round((camp.opened_count / camp.sent_count) * 100)}%)</strong>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">ROI Revenue</span>
                        <strong className="text-emerald-500">{formatCurrency(camp.revenue_generated)}</strong>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center border-t pt-3 text-xs">
                      <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Scheduled Broadcast</span>
                      <Button size="sm" onClick={() => handleSendCampaign(camp.id)}>
                        <Play className="h-3.5 w-3.5 mr-1" /> Send Now
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Segments Directory */}
        <TabsContent value="segments" className="pt-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {segments.map(seg => (
              <Card key={seg.id} className="border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm flex items-center gap-1.5"><Users className="h-4 w-4 text-violet-500" /> {seg.name}</h4>
                    <Badge variant="info">{seg.customer_count} Members</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{seg.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 3: Coupons */}
        <TabsContent value="coupons" className="pt-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coupons.map(coup => (
              <Card key={coup.id} className="border bg-card">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-mono bg-amber-500/10 text-amber-500 font-bold px-2 py-1 rounded text-sm">{coup.code}</span>
                    <Badge variant={coup.active ? 'success' : 'secondary'}>{coup.active ? 'Active' : 'Expired'}</Badge>
                  </div>
                  <div className="text-xs space-y-1.5 pt-1.5 border-t">
                    <div className="flex justify-between"><span>Discount:</span><strong>{coup.discount_percent}% OFF</strong></div>
                    <div className="flex justify-between"><span>Total Uses:</span><strong>{coup.uses_count}</strong></div>
                    <div className="flex justify-between"><span>Expiry Date:</span><span>{formatDate(coup.expiry_date)}</span></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 4: Templates */}
        <TabsContent value="templates" className="pt-4 text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'Standard Welcome Greeting', channel: 'whatsapp', text: 'Hi {{name}}! Welcome to {{salon_name}}. Enjoy your new client gift code {{referral_code}} for ₹500 off!' },
              { name: 'Win-Back Promotion', channel: 'sms', text: 'Hey {{name}}, we miss you at {{salon_name}}! Treat yourself to a haircut with 15% off. Coupon code: FESTIVAL20.' },
              { name: 'Appointment Reminder', channel: 'whatsapp', text: 'Hi {{name}}! Just a reminder of your upcoming slot on {{appointment_time}} with stylist {{staff_name}}. See you soon!' }
            ].map((t, idx) => (
              <Card key={idx} className="border bg-card">
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-xs">{t.name}</h4>
                    <Badge variant="outline" className="text-[9px] uppercase">{t.channel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border font-mono whitespace-pre-wrap">{t.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Wizard Modals */}
      <CampaignWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={loadMarketingData}
      />
      <CouponDetailsModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
        onSuccess={loadMarketingData}
      />
    </div>
  )
}
