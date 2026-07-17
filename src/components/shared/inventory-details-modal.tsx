'use client'

import React, { useState, useEffect } from 'react'
import { Box, IndianRupee, Tag, ShieldCheck, Trash2, Edit, AlertCircle, Calendar, RefreshCw, Loader2, Save, X, Edit2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ProductRepository } from '@/lib/repositories/repositories'
import { InventoryService } from '@/services/business-services'
import { formatCurrency } from '@/lib/utils'
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
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editSku, setEditSku] = useState('')
  const [editCostPrice, setEditCostPrice] = useState<number>(0)
  const [editSellingPrice, setEditSellingPrice] = useState<number>(0)
  const [editMinStock, setEditMinStock] = useState<number>(5)

  // Adjustment state
  const [showAdjust, setShowAdjust] = useState(false)
  const [adjustQty, setAdjustQty] = useState<number>(1)
  const [adjustType, setAdjustType] = useState<'increase' | 'decrease'>('decrease')
  const [adjustReason, setAdjustReason] = useState('damaged')

  const loadProduct = async () => {
    if (!productId) return
    try {
      setLoading(true)
      const data: any = await ProductRepository.getById(productId)
      if (data) {
        setProduct(data)
        setEditName(data.name)
        setEditSku(data.sku)
        setEditCostPrice(data.cost_price || data.price * 0.6 || 0)
        setEditSellingPrice(data.selling_price || data.price || 0)
        setEditMinStock(data.min_stock_level || data.reorder_level || 5)
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
    setIsEditing(false)
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

  // Update product specs
  const handleUpdateProduct = async () => {
    if (!product) return
    if (!permissionHelpers.canUpdate(role, 'inventory')) {
      error('Access Denied', 'Your role is not authorized to edit product details.')
      return
    }

    try {
      setSubmitting(true)
      await InventoryService.updateProduct(
        product.id,
        activeTenantId,
        {
          name: editName.trim(),
          sku: editSku.trim(),
          cost_price: Number(editCostPrice) || 0,
          selling_price: Number(editSellingPrice) || 0,
          price: Number(editSellingPrice) || 0,
          min_stock_level: Number(editMinStock) || 0
        },
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Product Updated', `${editName} successfully updated.`)
      setIsEditing(false)
      loadProduct()
      onSuccess()
    } catch (e: any) {
      error('Failed to update product', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const isLowStock = product && product.stock_quantity <= (editMinStock || 5)

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
              <div className="flex-1 mr-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Product Name</Label>
                      <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 text-xs bg-card" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">SKU Code</Label>
                      <Input value={editSku} onChange={e => setEditSku(e.target.value)} className="h-8 text-xs bg-card" />
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="text-lg font-bold">{product.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px]">SKU: {product.sku}</Badge>
                      {isLowStock && <Badge variant="destructive" className="text-[10px]">Low Stock</Badge>}
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex flex-col items-end gap-2 shrink-0">
                {isEditing ? null : (
                  <strong className="text-lg text-primary">
                    {formatCurrency(product.selling_price || product.price || 0)}
                  </strong>
                )}
                {permissionHelpers.canUpdate(role, 'inventory') && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="h-7 text-[10px] px-2">
                    {isEditing ? <><X className="h-3.5 w-3.5 mr-1" /> Cancel</> : <><Edit2 className="h-3.5 w-3.5 mr-1" /> Edit Specs</>}
                  </Button>
                )}
              </div>
            </div>

            {/* Details and stats */}
            <div className="p-6 space-y-5">
              {isEditing ? (
                <div className="grid grid-cols-3 gap-4 border rounded-2xl p-4 bg-muted/10">
                  <div className="space-y-1">
                    <Label className="text-xs">Cost Price (₹)</Label>
                    <Input type="number" value={editCostPrice} onChange={e => setEditCostPrice(Number(e.target.value))} className="h-8 text-xs bg-card" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Retail Price (₹)</Label>
                    <Input type="number" value={editSellingPrice} onChange={e => setEditSellingPrice(Number(e.target.value))} className="h-8 text-xs bg-card" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Reorder Level</Label>
                    <Input type="number" value={editMinStock} onChange={e => setEditMinStock(Number(e.target.value))} className="h-8 text-xs bg-card" />
                  </div>
                  <div className="col-span-3 flex justify-end gap-2 pt-2 border-t mt-1">
                    <Button variant="gradient" size="sm" onClick={handleUpdateProduct} disabled={submitting}>
                      {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                      Save Specs Updates
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-card shadow-none border-none">
                    <CardContent className="p-3 text-center">
                      <Box className="h-4 w-4 mx-auto text-violet-500 mb-1" />
                      <div className="text-lg font-bold">{product.stock_quantity || 0}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-semibold">Stock Quantity</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card shadow-none border-none">
                    <CardContent className="p-3 text-center">
                      <IndianRupee className="h-4 w-4 mx-auto text-emerald-500 mb-1" />
                      <div className="text-lg font-bold">{formatCurrency(product.cost_price || 0)}</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-semibold">Cost Price</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-card shadow-none border-none">
                    <CardContent className="p-3 text-center">
                      <Tag className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                      <div className="text-lg font-bold">18%</div>
                      <div className="text-[9px] text-muted-foreground uppercase font-semibold">GST Rate</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Adjustments Actions panel */}
              {!isEditing && permissionHelpers.canUpdate(role, 'inventory') && (
                <div className="border rounded-2xl p-4 bg-muted/10 space-y-3">
                  <div className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <RefreshCw className="h-3.5 w-3.5 text-primary" /> Stock Adjustments Log
                  </div>
                  
                  {showAdjust ? (
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Adjustment Action</Label>
                        <Select value={adjustType} onValueChange={(val: any) => setAdjustType(val)}>
                          <SelectTrigger className="bg-card h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="increase">Receive / Order New / Restock (+)</SelectItem>
                            <SelectItem value="decrease">Write-off / Damaged / Waste (-)</SelectItem>
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
                            <SelectItem value="order_new">Ordered New Stock / Restocked</SelectItem>
                            <SelectItem value="replaced_damaged">Replaced Damaged Product</SelectItem>
                            <SelectItem value="damaged">Damaged Products</SelectItem>
                            <SelectItem value="service_use">Used for service treatment</SelectItem>
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
                    <Button variant="outline" size="sm" onClick={() => setShowAdjust(true)} className="text-xs">
                      Record Stock Adjustment
                    </Button>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="p-6 border-t bg-muted/20">
              <Button variant="outline" onClick={onClose} disabled={submitting} className="text-xs">
                Dismiss Specifications
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
