import { InvoiceRepository, CustomerRepository, ProductRepository } from '@/lib/repositories/repositories'
import type { Invoice } from '@/lib/types'
import { generateId } from '@/lib/utils'
import { AuditService } from './audit-service'
import { NotificationService } from './notification-service'

export const BillingService = {
  listInvoices: async (tenantId: string): Promise<Invoice[]> => {
    return await InvoiceRepository.list(tenantId)
  },

  createInvoice: async (tenantId: string, invoiceData: any, userId: string, userName: string): Promise<Invoice> => {
    let subtotal = 0
    let discountAmount = 0
    let taxAmount = 0

    const itemsWithTotals = invoiceData.items.map((item: any) => {
      const lineSubtotal = item.quantity * item.unit_price
      const lineDiscount = item.discount || 0
      const lineTaxable = lineSubtotal - lineDiscount
      const lineTax = lineTaxable * ((item.tax_percent || 18) / 100)
      const lineTotal = lineTaxable + lineTax

      subtotal += lineSubtotal
      discountAmount += lineDiscount
      taxAmount += lineTax

      return {
        ...item,
        id: item.id || generateId(),
        total: lineTotal,
      }
    })

    const finalAmount = subtotal - discountAmount + taxAmount

    const newInvoice = await InvoiceRepository.create({
      tenant_id: tenantId,
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      customer_id: invoiceData.customer_id,
      customer_name: invoiceData.customer_name || 'Walk-in Client',
      appointment_id: invoiceData.appointment_id,
      items: itemsWithTotals,
      subtotal,
      discount_amount: discountAmount,
      tax_amount: taxAmount,
      total_amount: finalAmount,
      status: invoiceData.status || 'paid',
      payment_method: invoiceData.payment_method || 'cash',
      due_date: new Date().toISOString(),
      notes: invoiceData.notes || '',
      gst_number: invoiceData.gst_number || '',
    } as any)

    for (const item of itemsWithTotals) {
      if (item.type === 'product' && item.id) {
        await ProductRepository.updateStock(item.id, -item.quantity)
      }
    }

    if (invoiceData.customer_id) {
      const customer = await CustomerRepository.getById(invoiceData.customer_id)
      if (customer) {
        const visits = (customer.total_visits || 0) + 1
        const spent = Number(customer.total_spent || 0) + finalAmount
        const earnedPoints = Math.floor(finalAmount * 0.05)
        const points = (customer.loyalty_points || 0) + earnedPoints

        await CustomerRepository.update(invoiceData.customer_id, {
          total_visits: visits,
          total_spent: spent,
          loyalty_points: points,
        })

        await NotificationService.send(
          tenantId,
          'Loyalty Points Added',
          `Credited +${earnedPoints} loyalty points to ${customer.first_name}.`,
          'success'
        )
      }
    }

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'create_invoice',
      'invoice',
      newInvoice.id,
      null,
      { amount: finalAmount, invoice_number: newInvoice.invoice_number }
    )

    await NotificationService.send(
      tenantId,
      'POS Payment Processed',
      `Invoice ${newInvoice.invoice_number} generated successfully. Total: ₹${finalAmount.toLocaleString('en-IN')}.`,
      'payment',
      '/dashboard/billing'
    )

    return newInvoice
  },

  refundInvoice: async (invoiceId: string, tenantId: string, refundData: { reason: string; amount: number }, userId: string, userName: string): Promise<Invoice> => {
    const invoice = await InvoiceRepository.getById(invoiceId)
    if (!invoice) throw new Error('Invoice file not found.')

    const updated = await InvoiceRepository.updateStatus(invoiceId, 'refunded', `Refund: ${refundData.reason}`)

    for (const item of invoice.items) {
      if (item.type === 'product' && item.id) {
        await ProductRepository.updateStock(item.id, item.quantity)
      }
    }

    if (invoice.customer_id) {
      const customer = await CustomerRepository.getById(invoice.customer_id)
      if (customer) {
        const pointsReversed = Math.floor(invoice.total_amount * 0.05)
        const newPoints = Math.max((customer.loyalty_points || 0) - pointsReversed, 0)
        await CustomerRepository.update(invoice.customer_id, {
          loyalty_points: newPoints
        })

        await NotificationService.send(
          tenantId,
          'Loyalty Points Reversed',
          `Deducted -${pointsReversed} loyalty points from ${customer.first_name} due to refund.`,
          'warning'
        )
      }
    }

    await AuditService.log(
      tenantId,
      userId,
      userName,
      'refund_invoice',
      'invoice',
      invoiceId,
      { status: 'paid', amount: invoice.total_amount },
      { status: 'refunded', refund_amount: refundData.amount, reason: refundData.reason }
    )

    await NotificationService.send(
      tenantId,
      'Refund Processed',
      `Refund issued for invoice ${invoice.invoice_number}. Reason: ${refundData.reason}.`,
      'warning',
      '/dashboard/billing'
    )

    return updated
  }
}
