'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Filter, Box, IndianRupee, Truck, FileText, AlertTriangle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatCurrency } from '@/lib/utils'
import { InventoryService } from '@/services/business-services'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { permissionHelpers } from '@/lib/auth/permissions'
import { InventoryDetailsModal } from '@/components/shared/inventory-details-modal'
import { POReceiptModal } from '@/components/shared/po-receipt-modal'
import type { Product } from '@/lib/types'

export default function InventoryPage() {
  const { tenant, role, user } = useAuth()
  const { success, error } = useToast()
  
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filters & Search
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  // Selected entities for modals
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [selectedPoId, setSelectedPoId] = useState<string | null>(null)

  // Forms
  const [showAddProduct, setShowAddProduct] = useState(false)
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showAddPO, setShowAddPO] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  const activeTenantId = tenant?.id || 'demo-tenant-001'

  // Fetch Inventory Datasets
  const fetchAllInventoryData = async () => {
    try {
      setLoading(true)
      const p = await InventoryService.listProducts(activeTenantId)
      const s = await InventoryService.listSuppliers(activeTenantId)
      const po = await InventoryService.listPurchaseOrders(activeTenantId)
      
      setProducts(p)
      setSuppliers(s)
      setPurchaseOrders(po)
    } catch (e: any) {
      error('Failed to load inventory data', e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllInventoryData()
  }, [activeTenantId])

  // Create Product Submit
  const [productForm, setProductForm] = useState({ name: '', price: 0, cost_price: 0, sku: '', stock_quantity: 10, reorder_level: 5 })
  const handleAddProduct = async () => {
    if (!permissionHelpers.canCreate(role, 'inventory')) {
      error('Access Denied', 'Your role is not authorized to add products.')
      return
    }
    try {
      setSubmitting(true)
      await InventoryService.createProduct(
        activeTenantId,
        productForm,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Product Published', `${productForm.name} added successfully.`)
      setShowAddProduct(false)
      setProductForm({ name: '', price: 0, cost_price: 0, sku: '', stock_quantity: 10, reorder_level: 5 })
      fetchAllInventoryData()
    } catch (e: any) {
      error('Failed to create product', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Create Supplier Submit
  const [supplierForm, setSupplierForm] = useState({ name: '', contact_person: '', phone: '', email: '' })
  const handleAddSupplier = async () => {
    try {
      setSubmitting(true)
      await InventoryService.createSupplier(
        activeTenantId,
        supplierForm,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('Supplier Created', `${supplierForm.name} onboarded.`)
      setShowAddSupplier(false)
      setSupplierForm({ name: '', contact_person: '', phone: '', email: '' })
      fetchAllInventoryData()
    } catch (e: any) {
      error('Failed to create supplier', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Create PO Submit
  const [poForm, setPoForm] = useState({ supplier_name: '', total_cost: 0, expected_delivery: '' })
  const handleAddPO = async () => {
    try {
      setSubmitting(true)
      // Simulate ordering Loreal Color Gel
      const poPayload = {
        ...poForm,
        items: [{ name: 'Loreal Color Gel', quantity: 20, unit_cost: 350 }]
      }
      await InventoryService.createPurchaseOrder(
        activeTenantId,
        poPayload,
        user?.id || 'anonymous',
        user ? `${user.first_name} ${user.last_name || ''}` : 'System'
      )
      success('PO Completed', 'Purchase order successfully sent to supplier.')
      setShowAddPO(false)
      setPoForm({ supplier_name: '', total_cost: 0, expected_delivery: '' })
      fetchAllInventoryData()
    } catch (e: any) {
      error('Failed to create PO', e.message)
    } finally {
      setSubmitting(false)
    }
  }

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase())
    return matchesSearch
  })

  // KPI Calculations
  const totalValue = products.reduce((sum, p) => sum + ((p.cost_price || p.selling_price * 0.6) * p.stock_quantity), 0)
  const lowStockCount = products.filter(p => p.stock_quantity <= (p.min_stock_level || 5)).length
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory & Procurement</h1>
          <p className="text-muted-foreground">Manage product catalog, suppliers files, POs, and manual adjustments</p>
        </div>
        <div className="flex gap-2">
          {permissionHelpers.canCreate(role, 'inventory') && (
            <Button variant="gradient" onClick={() => setShowAddProduct(true)}><Plus className="h-4 w-4 mr-2" /> Add Product</Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: products.length, icon: Box, color: 'text-foreground' },
          { label: 'Inventory Valuation', value: formatCurrency(totalValue), icon: IndianRupee, color: 'text-emerald-500' },
          { label: 'Low Stock Alerts', value: lowStockCount, icon: AlertTriangle, color: 'text-amber-500' },
          { label: 'Out of Stock', value: outOfStockCount, icon: AlertTriangle, color: 'text-rose-500' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="text-left">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={cn('text-xl font-bold mt-1', s.color)}>{s.value}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <s.icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="w-full sm:w-[450px]">
          <TabsTrigger value="catalog" className="flex-1">Product Catalog</TabsTrigger>
          <TabsTrigger value="suppliers" className="flex-1">Suppliers ({suppliers.length})</TabsTrigger>
          <TabsTrigger value="procurement" className="flex-1">POs & GRN</TabsTrigger>
        </TabsList>

        {/* TABS 1: Catalog */}
        <TabsContent value="catalog" className="space-y-4 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search catalog..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>

          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead className="hidden sm:table-cell text-left">SKU</TableHead>
                        <TableHead className="text-left">Available Stock</TableHead>
                        <TableHead className="hidden md:table-cell text-left">Cost Price</TableHead>
                        <TableHead className="text-left">Retail Price</TableHead>
                        <TableHead className="text-left">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs font-medium">
                            No catalog items found matching your search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredProducts.map(p => {
                          const isLow = p.stock_quantity <= (p.reorder_level || 5)
                          return (
                            <TableRow key={p.id} className="cursor-pointer" onClick={() => setSelectedProductId(p.id)}>
                              <TableCell className="font-semibold text-sm text-left">{p.name}</TableCell>
                              <TableCell className="hidden sm:table-cell text-sm text-left">{p.sku}</TableCell>
                              <TableCell className="text-sm font-bold text-left">{p.stock_quantity} units</TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-left">{formatCurrency(p.cost_price || p.price * 0.6)}</TableCell>
                              <TableCell className="text-sm text-left">{formatCurrency(p.price)}</TableCell>
                              <TableCell className="text-left">
                                <Badge variant={isLow ? 'destructive' : 'success'} className="text-[10px]">
                                  {isLow ? 'Low Stock' : 'Good'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABS 2: Suppliers */}
        <TabsContent value="suppliers" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold">Onboarded Supplies Suppliers</h2>
            <Button variant="outline" size="sm" onClick={() => setShowAddSupplier(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Add Supplier</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier Company</TableHead>
                      <TableHead className="hidden sm:table-cell text-left">Contact Person</TableHead>
                      <TableHead className="text-left">Phone</TableHead>
                      <TableHead className="hidden md:table-cell text-left">Email</TableHead>
                      <TableHead className="text-left">Outstanding Dues</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs font-medium">
                          No supplier records onboarded yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      suppliers.map(s => (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold text-sm text-left">{s.name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-left">{s.contact_person}</TableCell>
                          <TableCell className="text-sm text-left">{s.phone}</TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-left">{s.email}</TableCell>
                          <TableCell className="text-sm font-semibold text-left">{formatCurrency(s.outstanding_balance || 0)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TABS 3: POs & GRN */}
        <TabsContent value="procurement" className="space-y-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold">Procurement Sheets History</h2>
            <Button variant="outline" size="sm" onClick={() => setShowAddPO(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Create PO</Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO ID</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="hidden sm:table-cell text-left">Expected Delivery</TableHead>
                      <TableHead className="text-left">Total Cost</TableHead>
                      <TableHead className="text-left">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-xs font-medium">
                          No procurement purchase orders logged.
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseOrders.map(po => (
                        <TableRow key={po.id} className="cursor-pointer" onClick={() => setSelectedPoId(po.id)}>
                          <TableCell className="font-semibold text-sm text-left">PO-{po.id.slice(-4)}</TableCell>
                          <TableCell className="text-sm text-left">{po.supplier_name}</TableCell>
                          <TableCell className="hidden sm:table-cell text-sm text-left">{po.expected_delivery}</TableCell>
                          <TableCell className="text-sm font-semibold text-left">{formatCurrency(po.total_cost)}</TableCell>
                          <TableCell className="text-left">
                            <Badge variant={po.status === 'completed' ? 'success' : 'warning'} className="capitalize text-[10px]">
                              {po.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Product adjustment specifications drawer */}
      <InventoryDetailsModal
        productId={selectedProductId}
        isOpen={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onSuccess={fetchAllInventoryData}
      />

      {/* Goods Received PO Restock trigger */}
      <POReceiptModal
        poId={selectedPoId}
        isOpen={!!selectedPoId}
        onClose={() => setSelectedPoId(null)}
        onSuccess={fetchAllInventoryData}
      />

      {/* Add Product Modal */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Product to Catalog</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="col-span-2 space-y-2">
              <Label>Product Name</Label>
              <Input placeholder="Loreal Color Gel" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>SKU Code</Label>
              <Input placeholder="LOR-CG-01" value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Stock Quantity</Label>
              <Input type="number" value={productForm.stock_quantity} onChange={e => setProductForm({ ...productForm, stock_quantity: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Cost Price (₹)</Label>
              <Input type="number" value={productForm.cost_price} onChange={e => setProductForm({ ...productForm, cost_price: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Retail Price (₹)</Label>
              <Input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddProduct(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleAddProduct} disabled={submitting}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Modal */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="col-span-2 space-y-2">
              <Label>Supplier Company</Label>
              <Input placeholder="Loreal India Professional" value={supplierForm.name} onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contact Person</Label>
              <Input placeholder="Amit Sharma" value={supplierForm.contact_person} onChange={e => setSupplierForm({ ...supplierForm, contact_person: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input placeholder="9876500001" value={supplierForm.phone} onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Email</Label>
              <Input type="email" placeholder="amit@loreal.in" value={supplierForm.email} onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSupplier(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleAddSupplier} disabled={submitting}>Onboard Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add PO Modal */}
      <Dialog open={showAddPO} onOpenChange={setShowAddPO}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-4 pb-4">
            <div className="col-span-2 space-y-2">
              <Label>Select Supplier</Label>
              <Select value={poForm.supplier_name} onValueChange={val => setPoForm({ ...poForm, supplier_name: val })}>
                <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Total Est Cost (₹)</Label>
              <Input type="number" value={poForm.total_cost} onChange={e => setPoForm({ ...poForm, total_cost: Number(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Expected Delivery</Label>
              <Input type="date" value={poForm.expected_delivery} onChange={e => setPoForm({ ...poForm, expected_delivery: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPO(false)}>Cancel</Button>
            <Button variant="gradient" onClick={handleAddPO} disabled={submitting}>Send PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
