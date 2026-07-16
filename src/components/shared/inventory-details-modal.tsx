'use client'

import React, { useState, useEffect } from 'react'
import { Box, IndianRupee, Tag, ShieldCheck, Trash2, Edit, AlertCircle, Calendar, RefreshCw, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProductRepository } from '@/lib/repositories/repositories'
import { InventoryService } from '@/services/business-services'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'

interface InventoryDetailsModalProps {
  productId: string | null
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function InventoryDetailsModal({ productId, isOpen, onClose, onSuccess }: InventoryDetailsModalProps) {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  const activeTenantId = tenant?.id || 'demo-tenant-001'

  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Adjustment state
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustQty, setAdjustQty] = useState<number>(1)
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('decrease')
  const [adjustReason, setAdjustReason] = useState('damaged')

  const loadProduct = async () => {
    if (!productId) return
    try {
      setLoading(true)
      const data = await ProductRepository.getById(productId)
      if (data) {
        setProduct(data)
      }
    } catch (e) {
      console.error('Failed to load product details', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && productId) {
      loadProduct()
    }
    setShowAdjust(false)
  }, [isOpen, productId])

  // Save manual stock adjustment
  const handleAdjustmentSubmit = async () => {
    if (!product) return
    if (!permissionHelpers.canUpdate(role, 'inventory')) {
      error('Access Denied', 'Only inventory managers and owners can log adjustments.')
      return
    }

    try {
      setSubmitting(true)
      const change = adjustType === 'increase' ? adjustQty : -adjustQty
      await InventoryService.adjustStock(
        product.id,
        activeTenantId,
        { change, reason: adjustReason },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Stock Adjusted', 'Adjustment successfully logged.')
      onClose()
      onSuccess()
    } catch (e: any) {
      error('Adjustment failed', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isLowStock = product && product.stock_quantity <= (product.reorder_level || 5)

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto p-0 text-left">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <span className="text-xs text-muted-foreground">Retrieving product logs...</span>
          </div>
        ) : product ? (
          <div className="flex flex-col">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-start bg-muted/10">
              <div>
                <h2 className="text-lg font-bold">{product.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px]">SKU: {product.sku}</Badge>
                  {isLowStock && <Badge variant="destructive" className="text-[10px]">Low Stock</Badge>}
                </div>
              </div>
              <strong className="text-lg text-primary">{formatCurrency(product.price)}</strong>
            </div>

            {/* Details and stats */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><Box className="h-4 w-4 mx-auto text-violet-500 mb-1" /><div className="text-lg font-bold">{product.stock_quantity || 0}</div><div className="text-[9px] text-muted-foreground uppercase font-semibold">Stock Quantity</div></CardContent></Card>
                <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><IndianRupee className="h-4 w-4 mx-auto text-emerald-500 mb-1" /><div className="text-lg font-bold">{formatCurrency((product.cost_price || product.price * 0.6))}</div><div className="text-[9px] text-muted-foreground uppercase font-semibold">Cost Price</div></CardContent></Card>
                <Card className="bg-card shadow-none border-none"><CardContent className="p-3 text-center"><Tag className="h-4 w-4 mx-auto text-amber-500 mb-1" /><div className="text-lg font-bold">18%</div><div className="text-[9px] text-muted-foreground uppercase font-semibold">GST Rate</div></CardContent></Card>
              </div>

              {/* Adjustments Actions panel */}
              {permissionHelpers.canUpdate(role, 'inventory') && (
                <div className="border rounded-2xl p-4 bg-muted/10 space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" /> Stock Adjustment Logs
                  </div>
                  
                  {showAdjust ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Adjustment Action</Label>
                        <Select value={adjustType} onValueChange={(val: any) => setAdjustType(val)}>
                          <SelectTrigger className="bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="increase">Receive / Restock (+)</SelectItem>
                            <SelectItem value="decrease">Write-off / Waste (-)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantity</Label>
                        <Input type="number" className="h-8 text-xs bg-card" value={adjustQty} onChange={e => setAdjustQty(Number(e.target.value))} />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Reason for adjustment</Label>
                        <Select value={adjustReason} onValueChange={setAdjustReason}>
                          <SelectTrigger className="bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="damaged">Damaged Products</SelectItem>
                            <SelectItem value="expired">Expired Batches</SelectItem>
                            <SelectItem value="lost">Lost / Misplaced</SelectItem>
                            <SelectItem value="correction">Audit correction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 flex justify-end gap-2 pt-2 border-t mt-1">
                        <Button variant="ghost" size="sm" onClick={() => setShowAdjust(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="gradient" size="sm" onClick={handleAdjustmentSubmit} disabled={submitting}>
                          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                          Log Adjustment
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setShowAdjust(true)}>
                      Record Stock Adjustment
                    </Button>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={onClose} disabled={submitting}>
                Dismiss Specifications
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
