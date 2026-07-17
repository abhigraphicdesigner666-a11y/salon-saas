'use client'

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, User, ShieldCheck, Loader2, Save, Sparkles, Box, Info } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ServiceCatalogService } from '@/services/business-services'
import { StaffRepository } from '@/lib/repositories/repositories'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface ServiceDetailsModalProps {
  serviceId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ServiceDetailsModal({ serviceId, isOpen, onClose, onSuccess }: ServiceDetailsModalProps) {
  const { tenant, user, role } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [service, setService] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [staffList, setStaffList] = useState<any[]>([])

  // Edit states
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [duration, setDuration] = useState<number>(30)
  const [bufferTime, setBufferTime] = useState<number>(10)
  const [description, setDescription] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [requiredProducts, setRequiredProducts] = useState('')
  const [categories, setCategories] = useState<any[]>([])
  const [categoryId, setCategoryId] = useState('')

  const loadServiceDetails = async () => {
    try {
      setLoading(true)
      const cats = await ServiceCatalogService.listCategories(activeTenantId)
      setCategories(cats)

      if (serviceId) {
        // Edit Mode
        const list = await ServiceCatalogService.list(activeTenantId)
        const data = list.find(s => s.id === serviceId)
        if (data) {
          setService(data)
          setName(data.name)
          setPrice(data.price)
          setDuration(data.duration_minutes)
          setBufferTime(10) // default buffer
          setDescription(data.description || '')
          setIsOnline(data.is_online_bookable)
          setCategoryId(data.category_id)
          setRequiredProducts("Hair Serum, Styling Spray") // default consumables
          
          // Load staff lists
          const st = await StaffRepository.list(activeTenantId)
          setStaffList(st.filter(s => s.specializations?.includes(data.name)))
        }
      } else {
        // Creation Mode
        setService({ id: 'new', category_name: cats[0]?.name || '' })
        setName('')
        setPrice(0)
        setDuration(30)
        setBufferTime(10)
        setDescription('')
        setIsOnline(true)
        setCategoryId(cats[0]?.id || '')
        setRequiredProducts('')
        setStaffList([])
      }
    } catch (e) {
      console.error('Failed to load service specs', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadServiceDetails()
    }
  }, [isOpen, serviceId])

  // Save Service updates or create new
  const handleUpdate = async () => {
    if (!service) return
    if (!permissionHelpers.canUpdate(role, 'services')) {
      error('Access Denied', 'Your role is not authorized to edit services catalog.')
      return
    }
    try {
      setSubmitting(true)
      if (serviceId) {
        // Edit mode
        await ServiceCatalogService.update(
          service.id,
          activeTenantId,
          {
            name,
            price,
            duration_minutes: duration,
            description,
            is_online_bookable: isOnline,
            category_id: categoryId,
          },
          user?.id || 'anonymous',
          user ? `${user.first_name} ${user.last_name || ''}` : 'System'
        )
        success('Catalog Updated', `${name} successfully updated.`)
      } else {
        // Create mode
        await ServiceCatalogService.create(
          activeTenantId,
          {
            name,
            price,
            duration_minutes: duration,
            description,
            is_online_bookable: isOnline,
            category_id: categoryId,
            tax_percent: 18,
          },
          user?.id || 'anonymous',
          user ? `${user.first_name} ${user.last_name || ''}` : 'System'
        )
        success('Service Created', `${name} successfully added to catalog.`)
      }
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Failed to save service', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Retrieving catalog file...</span>
          </div>
        ) : service ? (
          <div className="flex flex-col text-left">
            <DialogHeader className="p-6 border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <DialogTitle className="text-xl">{serviceId ? (name || 'Edit Service') : 'Add New Service'}</DialogTitle>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold">Category:</span>
                    <Select value={categoryId} onValueChange={setCategoryId} disabled={submitting || !permissionHelpers.canUpdate(role, 'services')}>
                      <SelectTrigger className="h-6 text-[10px] w-[140px] px-2 py-0">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((c: any) => (
                          <SelectItem key={c.id} value={c.id} className="text-xs">
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="font-bold text-lg text-primary">{formatCurrency(price)}</div>
              </div>
            </DialogHeader>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="srv_name">Service Name</Label>
                  <Input id="srv_name" value={name} onChange={e => setName(e.target.value)} disabled={submitting || !permissionHelpers.canUpdate(role, 'services')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srv_price">Price (₹)</Label>
                  <Input id="srv_price" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} disabled={submitting || !permissionHelpers.canUpdate(role, 'services')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srv_duration">Duration (Minutes)</Label>
                  <Input id="srv_duration" type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} disabled={submitting || !permissionHelpers.canUpdate(role, 'services')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="srv_buffer">Buffer Time (Minutes)</Label>
                  <Input id="srv_buffer" type="number" value={bufferTime} onChange={e => setBufferTime(Number(e.target.value))} disabled={submitting || !permissionHelpers.canUpdate(role, 'services')} />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="srv_desc">Description</Label>
                  <Textarea id="srv_desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} disabled={submitting || !permissionHelpers.canUpdate(role, 'services')} />
                </div>
              </div>

              {/* Online visibility toggle */}
              <div className="flex items-center justify-between p-3.5 border rounded-xl bg-muted/20">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-500" />
                  <div>
                    <div className="text-sm font-semibold">Online Booking Visibility</div>
                    <div className="text-xs text-muted-foreground">Allows customers to book this service from client portals.</div>
                  </div>
                </div>
                <Switch
                  checked={isOnline}
                  onCheckedChange={setIsOnline}
                  disabled={submitting || !permissionHelpers.canUpdate(role, 'services')}
                />
              </div>

              {/* Required Products */}
              <div className="p-4 border rounded-2xl bg-muted/10">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase mb-2">
                  <Box className="h-4 w-4 text-primary" /> Consumable Products
                </div>
                <Input
                  placeholder="Hair coloring kits, shampoos..."
                  value={requiredProducts}
                  onChange={e => setRequiredProducts(e.target.value)}
                  disabled={submitting || !permissionHelpers.canUpdate(role, 'services')}
                />
              </div>

              {/* Qualified stylists lists */}
              <div className="border rounded-2xl p-4 bg-muted/20">
                <div className="text-xs font-bold text-muted-foreground uppercase mb-2">Qualified Stylists</div>
                <div className="flex flex-wrap gap-1.5">
                  {staffList.map((st: any) => (
                    <Badge key={st.id} variant="secondary" className="text-[10px]">
                      {st.first_name} {st.last_name || ''}
                    </Badge>
                  ))}
                  {staffList.length === 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3.5 w-3.5" /> No stylist certified for this service. Edit employee capabilities matrix.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {permissionHelpers.canUpdate(role, 'services') && (
              <DialogFooter className="p-6 border-t bg-muted/20">
                <Button variant="outline" onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button variant="gradient" onClick={handleUpdate} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  {serviceId ? 'Save Service Changes' : 'Create Service'}
                </Button>
              </DialogFooter>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
