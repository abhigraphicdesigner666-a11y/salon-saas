'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Clock, IndianRupee, Edit, Trash2, ToggleLeft, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { cn, formatCurrency } from '@/lib/utils'
import { ServiceCatalogService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'
import { ServiceDetailsModal } from '@/components/shared/service-details-modal'
import type { Service, ServiceCategory } from '@/lib/types'

export default function ServicesPage() {
  const { tenant, role } = useAuth()
  const { error } = useToast()
  
  const [services, setServices] = useState<Service[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Fetch services and categories
  const fetchServices = async () => {
    try {
      setLoading(true)
      const sList = await ServiceCatalogService.list(activeTenantId)
      const cList = await ServiceCatalogService.listCategories(activeTenantId)
      setServices(sList)
      setCategories(cList)
    } catch (e: any) {
      error('Failed to load services catalog', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [activeTenantId])

  const filtered = services.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = activeCategory === 'all' || s.category_id === activeCategory
    return matchSearch && matchCat
  })

  const canAddService = permissionHelpers.canCreate(role, 'services')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services Catalog</h1>
          <p className="text-muted-foreground">{services.length} services across {categories.length} categories</p>
        </div>
        {canAddService && (
          <Button variant="gradient" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-2" /> Add Service</Button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Categories Sidebar */}
        <div className="w-full lg:w-64 shrink-0 space-y-2">
          <Card>
            <CardHeader className="pb-3 text-left"><CardTitle className="text-sm">Categories</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <button onClick={() => setActiveCategory('all')} className={cn('sidebar-item w-full', activeCategory === 'all' && 'sidebar-item-active')}>
                All Services <Badge variant="secondary" className="ml-auto">{services.length}</Badge>
              </button>
              {categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={cn('sidebar-item w-full', activeCategory === cat.id && 'sidebar-item-active')}>
                  <span>{cat.icon || '💇'}</span> {cat.name} <Badge variant="secondary" className="ml-auto">{cat.service_count || 0}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Services Grid */}
        <div className="flex-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search services..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(service => (
                <Card key={service.id} className="group hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedServiceId(service.id)}>
                  <CardContent className="p-5 text-left">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="secondary" className="text-xs">{service.category_name}</Badge>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <h3 className="font-semibold mb-1">{service.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{service.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{service.duration_minutes}min</span>
                        <span className="flex items-center gap-1 font-semibold"><IndianRupee className="h-3.5 w-3.5" />{formatCurrency(service.price)}</span>
                      </div>
                      {service.compare_price && (
                        <span className="text-xs line-through text-muted-foreground">{formatCurrency(service.compare_price)}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                      <span className="text-xs text-muted-foreground">GST {service.tax_percent}%</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{service.is_online_bookable ? 'Online' : 'Walk-in only'}</span>
                        <div className={cn('h-2 w-2 rounded-full', service.is_active ? 'bg-green-500' : 'bg-gray-400')} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reusable Service Configuration Modal */}
      <ServiceDetailsModal
        serviceId={selectedServiceId}
        isOpen={showAdd || !!selectedServiceId}
        onClose={() => { setSelectedServiceId(null); setShowAdd(false); }}
        onSuccess={fetchServices}
      />
    </motion.div>
  )
}
