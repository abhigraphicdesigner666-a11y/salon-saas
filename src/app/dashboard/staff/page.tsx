'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Star, Calendar, IndianRupee, Clock, Mail, Phone, Users, ShieldCheck, Timer, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { cn, formatCurrency, getInitials } from '@/lib/utils'
import { StaffService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'
import { StaffDetailsModal } from '@/components/shared/staff-details-modal'
import { AddStaffModal } from '@/components/shared/add-staff-modal'
import type { Staff } from '@/lib/types'

export default function StaffPage() {
  const { tenant, role } = useAuth()
  const { error } = useToast()
  
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Fetch staff list
  const fetchStaff = async () => {
    try {
      setLoading(true)
      const data = await StaffService.list(activeTenantId)
      setStaffList(data)
    } catch (e: any) {
      error('Failed to load employee list', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [activeTenantId])

  const maxRevenue = Math.max(...staffList.map(s => s.revenue_generated || 0), 1)
  const canAddStaff = permissionHelpers.canCreate(role, 'staff_management')

  // KPI Calculations
  const kpis = {
    total: staffList.length,
    active: staffList.filter(s => s.is_active).length,
    stylists: staffList.filter(s => s.role === 'stylist' || s.role === 'beautician').length,
    avgRating: (staffList.reduce((sum, s) => sum + (s.rating || 4.8), 0) / staffList.length || 4.8).toFixed(1),
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage employee rosters, attendance, and commission engine profiles</p>
        </div>
        {canAddStaff && (
          <Button variant="gradient" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Staff</Button>
        )}
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: kpis.total, icon: Users, color: 'text-foreground' },
          { label: 'Active Employee Files', value: kpis.active, icon: ShieldCheck, color: 'text-emerald-500' },
          { label: 'Stylists & Beauticians', value: kpis.stylists, icon: Timer, color: 'text-violet-500' },
          { label: 'Average Ratings', value: `${kpis.avgRating} ★`, icon: Star, color: 'text-amber-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <s.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Listings */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {staffList.map(member => (
            <Card key={member.id} className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5" onClick={() => setSelectedId(member.id)}>
              <CardContent className="p-5 text-left">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-12 w-12"><AvatarFallback>{getInitials(member.first_name, member.last_name)}</AvatarFallback></Avatar>
                  <div>
                    <div className="font-semibold">{member.first_name} {member.last_name || ''}</div>
                    <Badge variant="secondary" className="text-[10px] capitalize mt-0.5">{member.role}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> Rating</span>
                    <span className="font-medium">{member.rating || '4.8'}/5.0</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Appointments</span>
                    <span className="font-medium">{(member.total_appointments || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> Revenue</span>
                    <span className="font-medium">{formatCurrency(member.revenue_generated || 0)}</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                      <span>Performance</span>
                      <span>{Math.round((member.revenue_generated || 0) / maxRevenue * 100)}%</span>
                    </div>
                    <Progress value={(member.revenue_generated || 0) / maxRevenue * 100} className="h-1.5" />
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {member.specializations?.slice(0, 3).map(s => (
                      <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Reusable Staff Profile Detail drawer */}
      <StaffDetailsModal
        staffId={selectedId}
        isOpen={!!selectedId}
        onClose={() => setSelectedId(null)}
        onSuccess={fetchStaff}
      />

      <AddStaffModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSuccess={fetchStaff}
      />
    </motion.div>
  )
}
