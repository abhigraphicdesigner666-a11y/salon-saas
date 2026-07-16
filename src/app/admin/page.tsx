'use client'

import React, { useState, useEffect } from 'react'
import { BarChart3, Building2, CreditCard, Shield, Users, Landmark, TrendingUp, AlertTriangle, Play, Loader2, ArrowUpRight, ShieldAlert, CheckCircle, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SuperAdminService } from '@/services/business-services'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<any[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const list = await SuperAdminService.listTenants()
        setTenants(list)
      } catch (e) {
        console.error('Failed to load super admin data', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const activeCount = tenants.filter(t => t.status === 'active').length
  const suspendedCount = tenants.filter(t => t.status === 'suspended').length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs text-muted-foreground">Aggregating SaaS records...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Global SaaS Overview</h2>
        <p className="text-xs text-muted-foreground">Monitoring dashboard for subscription revenues, tenant databases, and system loads.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Salons</span>
            <h3 className="text-2xl font-bold mt-1">{tenants.length}</h3>
            <div className="text-[9px] text-emerald-500 mt-1">Active: {activeCount} | Suspended: {suspendedCount}</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Monthly Recurring Revenue (MRR)</span>
            <h3 className="text-2xl font-bold mt-1">{formatCurrency(485000)}</h3>
            <div className="text-[9px] text-emerald-500 mt-1 flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> +8.4% this month</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Database Storage Size</span>
            <h3 className="text-2xl font-bold mt-1">50 MB</h3>
            <div className="text-[9px] text-muted-foreground mt-1">Total database allocation limit: 10 GB</div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">API Requests Today</span>
            <h3 className="text-2xl font-bold mt-1">124,500</h3>
            <div className="text-[9px] text-muted-foreground mt-1">Failed Jobs: 0 | Health check: OK</div>
          </CardContent>
        </Card>
      </div>

      {/* Svg graphs for MRR and API trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold">MRR Growth Trend</CardTitle>
            <CardDescription>Visual summary of recurring revenues.</CardDescription>
          </CardHeader>
          <CardContent className="h-56 flex flex-col justify-end">
            <div className="w-full h-36 relative">
              <svg viewBox="0 0 500 200" className="w-full h-full">
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,180 Q100,140 200,110 T400,60 T500,40 L500,200 L0,200 Z" fill="url(#mrrGrad)" />
                <path d="M0,180 Q100,140 200,110 T400,60 T500,40" fill="none" stroke="#7c3aed" strokeWidth="3" />
              </svg>
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-2 font-bold">
              <span>May 2026</span>
              <span>Jun 2026</span>
              <span>Jul 2026</span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm font-bold">API Load Performance</CardTitle>
            <CardDescription>Total daily requests and server health.</CardDescription>
          </CardHeader>
          <CardContent className="h-56 flex flex-col justify-end">
            <div className="w-full h-36 relative">
              <svg viewBox="0 0 500 200" className="w-full h-full">
                <g fill="#22c55e" opacity="0.8">
                  <rect x="50" y="80" width="35" height="120" rx="3" />
                  <rect x="150" y="50" width="35" height="150" rx="3" />
                  <rect x="250" y="110" width="35" height="90" rx="3" />
                  <rect x="350" y="30" width="35" height="170" rx="3" />
                  <rect x="450" y="60" width="35" height="140" rx="3" />
                </g>
              </svg>
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground mt-2 font-bold">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick shortcuts */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <Link href="/admin/salons">
            <div className="p-3 border rounded-2xl bg-card hover:bg-muted/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <Building2 className="h-5 w-5 text-violet-500" />
              <span className="text-[10px] font-bold">Manage Tenants</span>
            </div>
          </Link>
          <Link href="/admin/subscriptions">
            <div className="p-3 border rounded-2xl bg-card hover:bg-muted/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              <span className="text-[10px] font-bold">Subscriptions Plans</span>
            </div>
          </Link>
          <Link href="/admin/audit">
            <div className="p-3 border rounded-2xl bg-card hover:bg-muted/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <Shield className="h-5 w-5 text-amber-500" />
              <span className="text-[10px] font-bold">Audit Logs</span>
            </div>
          </Link>
          <Link href="/dashboard">
            <div className="p-3 border rounded-2xl bg-card hover:bg-muted/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors">
              <ArrowUpRight className="h-5 w-5 text-blue-500" />
              <span className="text-[10px] font-bold">Launch Owner Portal</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
