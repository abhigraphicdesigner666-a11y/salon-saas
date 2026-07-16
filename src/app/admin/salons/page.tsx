'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Eye, Play, Edit2, ShieldAlert, ToggleLeft, ToggleRight, Check, X, Loader2, Plus, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { useToast } from '@/components/ui/toast'
import { SuperAdminService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'

export default function TenantManagementPage() {
  const router = useRouter()
  const { success, error } = useToast()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [tenants, setTenants] = useState<any[]>([])

  // Modal controls
  const [editTenant, setEditTenant] = useState<any>(null)
  const [limitsPlan, setLimitsPlan] = useState('Professional')
  const [limitsStaff, setLimitsStaff] = useState(10)
  const [limitsBranches, setLimitsBranches] = useState(3)

  // Feature Flags
  const [flagAI, setFlagAI] = useState(true)
  const [flagMarketing, setFlagMarketing] = useState(true)
  const [flagInventory, setFlagInventory] = useState(true)
  const [flagPortal, setFlagPortal] = useState(true)

  const [submitting, setSubmitting] = useState(false)

  const loadTenants = async () => {
    try {
      setLoading(true)
      const list = await SuperAdminService.listTenants()
      setTenants(list)
    } catch (e) {
      console.error('Failed to load salons list', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTenants()
  }, [])

  const handleEditClick = (tenant: any) => {
    setEditTenant(tenant)
    setLimitsPlan(tenant.plan)
    setLimitsStaff(tenant.limits?.staff || 10)
    setLimitsBranches(tenant.limits?.branches || 3)
    setFlagAI(tenant.flags?.ai ?? true)
    setFlagMarketing(tenant.flags?.marketing ?? true)
    setFlagInventory(tenant.flags?.inventory ?? true)
    setFlagPortal(tenant.flags?.portal ?? true)
  }

  const handleSaveLimits = async () => {
    try {
      setSubmitting(true)
      // Save subscription plans
      await SuperAdminService.updateSubscription(
        editTenant.id,
        limitsPlan,
        { staff: limitsStaff, branches: limitsBranches, appointments: 500, storage_gb: 5 },
        user?.id || 'admin',
        'Super Admin'
      )

      // Save feature flags
      await SuperAdminService.toggleFeatureFlag(editTenant.id, 'ai', flagAI, user?.id || 'admin', 'Super Admin')
      await SuperAdminService.toggleFeatureFlag(editTenant.id, 'marketing', flagMarketing, user?.id || 'admin', 'Super Admin')
      await SuperAdminService.toggleFeatureFlag(editTenant.id, 'inventory', flagInventory, user?.id || 'admin', 'Super Admin')
      await SuperAdminService.toggleFeatureFlag(editTenant.id, 'portal', flagPortal, user?.id || 'admin', 'Super Admin')

      success('Limits Updated', `Limits & Feature Flags configured for ${editTenant.name}.`)
      setEditTenant(null)
      loadTenants()
    } catch (e: any) {
      error('Failed to save settings', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (id: string, name: string) => {
    try {
      setLoading(true)
      await SuperAdminService.suspendTenant(id, user?.id || 'admin', 'Super Admin')
      success('Status Changed', `Updated account status for ${name}.`)
      loadTenants()
    } catch (e: any) {
      error('Failed to adjust status', e.message)
    } finally {
      setLoading(false)
    }
  }

  // Impersonate salon owner login session bypass
  const handleImpersonation = (tenantName: string) => {
    success('Impersonation Active', `Simulating session redirect as ${tenantName} Owner. Launching Dashboard...`)
    setTimeout(() => {
      router.push('/dashboard')
    }, 1500)
  }

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Tenants (Salons) Directory</h2>
          <p className="text-xs text-muted-foreground">Manage active workspace limits and toggle license configurations.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground">Loading workspace list...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tenants.map(tenant => (
            <Card key={tenant.id} className="border bg-card">
              <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-primary">{tenant.name}</h4>
                    <Badge variant={tenant.status === 'active' ? 'success' : 'destructive'} className="text-[9px] scale-90 capitalize">{tenant.status}</Badge>
                    <Badge variant="secondary" className="text-[9px] scale-90">{tenant.plan}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                    <span>Owner: <strong>{tenant.owner_email}</strong></span>
                    <span>Database size: <strong>{tenant.database_size_mb} MB</strong></span>
                    <span>Active Users: <strong>{tenant.active_users}</strong></span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex flex-wrap gap-2 pt-1 border-t">
                    <Badge variant="outline" className="text-[8px]">Staff Limit: {tenant.limits?.staff || 10}</Badge>
                    <Badge variant="outline" className="text-[8px]">Branches: {tenant.limits?.branches || 3}</Badge>
                    {tenant.flags?.ai && <Badge variant="outline" className="text-[8px] border-violet-500/20 text-violet-500">AI Active</Badge>}
                    {tenant.flags?.marketing && <Badge variant="outline" className="text-[8px] border-emerald-500/20 text-emerald-500">Marketing Active</Badge>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0 md:justify-end">
                  <Button size="sm" variant="outline" className="h-8" onClick={() => handleImpersonation(tenant.name)}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Impersonate
                  </Button>
                  <Button size="sm" variant="outline" className="h-8" onClick={() => handleEditClick(tenant)}>
                    <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Limits
                  </Button>
                  <Button size="sm" variant={tenant.status === 'active' ? 'destructive' : 'default'} className="h-8" onClick={() => handleToggleStatus(tenant.id, tenant.name)}>
                    <ToggleLeft className="h-3.5 w-3.5 mr-1" /> {tenant.status === 'active' ? 'Suspend' : 'Activate'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* EDIT LIMITS & FLAGS MODAL */}
      <Dialog open={!!editTenant} onOpenChange={(open) => !open && setEditTenant(null)}>
        <DialogContent className="max-w-md text-left text-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5"><Building2 className="h-5 w-5 text-primary" /> Tenant Limits Configuration</DialogTitle>
            <DialogDescription>Modify active quotas and toggle allowed feature flags for {editTenant?.name}.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Plan selection */}
            <div className="space-y-1">
              <Label>Active Subscription Plan</Label>
              <Select value={limitsPlan} onValueChange={setLimitsPlan}>
                <SelectTrigger className="h-8 bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                  <SelectItem value="Custom">Custom Plan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Quota inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Maximum Staff Limit</Label>
                <Input type="number" value={limitsStaff} onChange={e => setLimitsStaff(Number(e.target.value))} className="h-8 bg-card" />
              </div>
              <div className="space-y-1">
                <Label>Max Branch Branches</Label>
                <Input type="number" value={limitsBranches} onChange={e => setLimitsBranches(Number(e.target.value))} className="h-8 bg-card" />
              </div>
            </div>

            {/* Feature Flags checkboxes */}
            <div className="space-y-2 border-t pt-3">
              <Label className="text-muted-foreground uppercase font-bold text-[9px] block mb-1">Toggle Feature Modules</Label>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <Checkbox id="flag-ai" checked={flagAI} onCheckedChange={(checked: any) => setFlagAI(!!checked)} />
                  <Label htmlFor="flag-ai" className="cursor-pointer">AI Copilot</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="flag-mkt" checked={flagMarketing} onCheckedChange={(checked: any) => setFlagMarketing(!!checked)} />
                  <Label htmlFor="flag-mkt" className="cursor-pointer">Marketing Engine</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="flag-inv" checked={flagInventory} onCheckedChange={(checked: any) => setFlagInventory(!!checked)} />
                  <Label htmlFor="flag-inv" className="cursor-pointer">Inventory Catalog</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="flag-ptl" checked={flagPortal} onCheckedChange={(checked: any) => setFlagPortal(!!checked)} />
                  <Label htmlFor="flag-ptl" className="cursor-pointer">Customer Portal</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTenant(null)} disabled={submitting}>Cancel</Button>
            <Button variant="gradient" onClick={handleSaveLimits} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
