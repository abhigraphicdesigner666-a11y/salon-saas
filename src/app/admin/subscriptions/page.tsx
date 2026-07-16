'use client'

import React, { useState } from 'react'
import { CreditCard, Landmark, Loader2, Play, Tag, RefreshCw, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

export default function SaaSPlanBillingPage() {
  const { success, error } = useToast()
  const [loading, setLoading] = useState(false)

  const plans = [
    { name: 'Starter Plan', price: 2999, billing: 'monthly', features: ['Max 3 Stylists', '1 Branch limit', 'No AI Copilot'] },
    { name: 'Professional Plan', price: 6999, billing: 'monthly', features: ['Max 10 Stylists', '3 Branch limit', 'Marketing and AI Active'] },
    { name: 'Enterprise Plan', price: 14999, billing: 'monthly', features: ['Unlimited Stylists', 'Unlimited Branches', 'Full Portal Branding'] }
  ]

  const saasInvoices = [
    { id: 'sinv-1', tenant_name: 'GlamStyle Salon & Spa', amount: 6999, status: 'paid', date: '2026-07-01' },
    { id: 'sinv-2', tenant_name: 'Vercel Hair Cutting Lab', amount: 2999, status: 'paid', date: '2026-07-15' },
    { id: 'sinv-3', tenant_name: 'Unpaid Suspended Salon', amount: 6999, status: 'payment_failed', date: '2026-07-10' }
  ]

  const handleRetryBilling = (invoiceId: string) => {
    success('Stripe Webhook Dispatched', `Retrying card billing payment for SaaS invoice ${invoiceId}...`)
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold tracking-tight">SaaS Subscription Plans & Stripe Billing</h2>
        <p className="text-xs text-muted-foreground">Adjust Stripe product plans and monitor SaaS customer subscription invoices.</p>
      </div>

      {/* Subscription Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {plans.map((p, idx) => (
          <Card key={idx} className="border bg-card">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-sm font-bold text-primary">{p.name}</CardTitle>
              <CardDescription className="text-xs">{formatCurrency(p.price)} / {p.billing}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <ul className="space-y-1.5 list-disc pl-4 text-muted-foreground">
                {p.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Outstanding SaaS Invoices */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-sm font-bold">Stripe SaaS Customer Invoices</CardTitle>
          <CardDescription className="text-xs">Monitor recent recurring subscription payments.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase">
                <tr>
                  <th className="p-3">Invoice ID</th>
                  <th className="p-3">Tenant/Salon</th>
                  <th className="p-3">Billing Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right font-bold">Price</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {saasInvoices.map((inv, idx) => (
                  <tr key={inv.id || idx}>
                    <td className="p-3 font-semibold text-primary">{inv.id}</td>
                    <td className="p-3">{inv.tenant_name}</td>
                    <td className="p-3 text-muted-foreground">{inv.date}</td>
                    <td className="p-3">
                      <Badge variant={inv.status === 'paid' ? 'success' : 'destructive'} className="text-[9px] scale-90">
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right font-bold">{formatCurrency(inv.amount)}</td>
                    <td className="p-3 text-right">
                      {inv.status !== 'paid' && (
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => handleRetryBilling(inv.id)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry Card
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
