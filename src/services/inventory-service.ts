import { ProductRepository } from '@/lib/repositories/repositories'
import type { Product } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

export const InventoryService = {
  listProducts: async (tenantId: string): Promise<Product[]> => {
    return await ProductRepository.list(tenantId)
  },

  createProduct: async (tenantId: string, productData: any, userId: string, userName: string): Promise<Product> => {
    const product = await ProductRepository.create({
      tenant_id: tenantId,
      ...productData,
      is_active: true,
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create',
      'product',
      product.id,
      null,
      { name: product.name, sku: product.sku }
    )

    return product
  },

  updateProduct: async (id: string, tenantId: string, updates: any, userId: string, userName: string): Promise<Product> => {
    const original = await ProductRepository.getById(id)
    const updated = await ProductRepository.update(id, updates)

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'update_product',
      'product',
      id,
      { name: original?.name },
      updates
    )

    return updated
  },

  adjustStock: async (productId: string, tenantId: string, adjustData: { change: number; reason: string }, userId: string, userName: string): Promise<void> => {
    const p = await ProductRepository.getById(productId)
    if (!p) throw new Error('Product not found')

    await ProductRepository.updateStock(productId, adjustData.change)
    await ProductRepository.logTransaction({
      tenant_id: tenantId,
      product_name: p.name,
      change_quantity: adjustData.change,
      type: adjustData.change > 0 ? 'incoming' : 'outgoing',
      reason: `Manual Adjustment: ${adjustData.reason}`
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'adjust_stock',
      'product',
      productId,
      { original_qty: p.stock_quantity },
      { change: adjustData.change, reason: adjustData.reason }
    )

    const updatedQty = Math.max((p.stock_quantity || 0) + adjustData.change, 0)
    if (updatedQty <= (p.reorder_level || 5)) {
      await NotificationService.send(
        tenantId,
        'Low Stock Alert',
        `Product ${p.name} has fallen below threshold. Current stock: ${updatedQty}.`,
        'warning',
        '/dashboard/inventory'
      )
    }
  },

  listSuppliers: async (tenantId: string): Promise<any[]> => {
    return await ProductRepository.listSuppliers(tenantId)
  },

  createSupplier: async (tenantId: string, data: any, userId: string, userName: string): Promise<any> => {
    const s = await ProductRepository.createSupplier({ tenant_id: tenantId, ...data })
    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_supplier',
      'supplier',
      s.id,
      null,
      { name: s.name }
    )
    return s
  },

  listPurchaseOrders: async (tenantId: string): Promise<any[]> => {
    return await ProductRepository.listPurchaseOrders(tenantId)
  },

  createPurchaseOrder: async (tenantId: string, data: any, userId: string, userName: string): Promise<any> => {
    const po = await ProductRepository.createPurchaseOrder({
      tenant_id: tenantId,
      ...data,
      status: 'sent'
    })

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_purchase_order',
      'purchase_order',
      po.id,
      null,
      { total_cost: po.total_cost }
    )

    await NotificationService.send(
      tenantId,
      'Purchase Order Created',
      `PO for ${po.supplier_name} sent. Total cost: ${formatCurrency(po.total_cost)}.`,
      'info',
      '/dashboard/inventory'
    )

    return po
  },

  receivePurchaseOrder: async (poId: string, tenantId: string, grnData: any, userId: string, userName: string): Promise<any> => {
    const po = (await ProductRepository.listPurchaseOrders(tenantId)).find(p => p.id === poId)
    if (!po) throw new Error('Purchase order not found')

    await ProductRepository.updatePurchaseOrder(poId, { status: 'completed' })

    for (const item of po.items) {
      const prods = await ProductRepository.list(tenantId)
      const matchingProduct = prods.find(p => p.name.toLowerCase() === item.name.toLowerCase())
      
      if (matchingProduct) {
        await ProductRepository.updateStock(matchingProduct.id, item.quantity)
        await ProductRepository.logTransaction({
          tenant_id: tenantId,
          product_name: matchingProduct.name,
          change_quantity: item.quantity,
          type: 'incoming',
          reason: `Goods Received Note (PO #${poId.slice(-4)})`
        })
      }
    }

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'receive_purchase_order',
      'purchase_order',
      poId,
      { status: 'sent' },
      { status: 'completed', received_items: po.items }
    )

    await NotificationService.send(
      tenantId,
      'Goods Received (GRN)',
      `Purchase order completed and items successfully restocked.`,
      'success',
      '/dashboard/inventory'
    )
  }
}
