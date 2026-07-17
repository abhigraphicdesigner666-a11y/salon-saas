import { supabase, isDemoMode } from '@/lib/supabase/client'
import { generateId } from '@/lib/utils'
import type { Customer, Service, ServiceCategory, Staff, Appointment, Invoice, Product, MembershipPlan, Campaign, AuditLog, Notification, Tenant } from '@/lib/types'

// Helper to manage localStorage mock DBs
const getMockTable = <T>(key: string, initialData: T[]): T[] => {
  if (typeof window === 'undefined') return initialData
  const resetActive = localStorage.getItem('salon_ai_db_factory_reset_active') === 'true'
  
  // Exception: saas_plans and saas_settings must be preserved
  const isPreservedKey = key === 'saas_plans' || key === 'saas_settings'
  const finalInitial = (resetActive && !isPreservedKey) ? [] : initialData

  const stored = localStorage.getItem(`salon_ai_db_${key}`)
  if (!stored) {
    localStorage.setItem(`salon_ai_db_${key}`, JSON.stringify(finalInitial))
    return finalInitial
  }
  try {
    return JSON.parse(stored)
  } catch {
    return finalInitial
  }
}

const saveMockTable = <T>(key: string, data: T[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`salon_ai_db_${key}`, JSON.stringify(data))
  }
}

// Instantiate mock tables on load using mock data seeds
const getSeeds = (): any => {
  if (typeof window !== 'undefined' && localStorage.getItem('salon_ai_db_factory_reset_active') === 'true') {
    return {
      customers: [], services: [], serviceCategories: [], staff: [], appointments: [], invoices: [], products: [], memberships: [], campaigns: [], auditLogs: [], notifications: []
    }
  }
  if (typeof window === 'undefined') {
    return {
      customers: [], services: [], serviceCategories: [], staff: [], appointments: [], invoices: [], products: [], memberships: [], campaigns: [], auditLogs: [], notifications: []
    }
  }
  
  // Dynamic load from hook
  const defaultMock = {
    customers: [
      { id: 'c1', tenant_id: 'demo-tenant-001', first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@gmail.com', phone: '+91 98765 43210', gender: 'female', date_of_birth: '1992-03-15', loyalty_points: 2450, total_visits: 34, total_spent: 89500, is_active: true, created_at: new Date().toISOString() },
      { id: 'c2', tenant_id: 'demo-tenant-001', first_name: 'Anita', last_name: 'Desai', email: 'anita.desai@yahoo.com', phone: '+91 87654 32109', gender: 'female', date_of_birth: '1988-07-22', loyalty_points: 5200, total_visits: 56, total_spent: 234000, is_active: true, created_at: new Date().toISOString() },
      { id: 'c3', tenant_id: 'demo-tenant-001', first_name: 'Rahul', last_name: 'Mehta', email: 'rahul.m@gmail.com', phone: '+91 76543 21098', gender: 'male', date_of_birth: '1995-11-08', loyalty_points: 800, total_visits: 12, total_spent: 18600, is_active: true, created_at: new Date().toISOString() },
      { id: 'c4', tenant_id: 'demo-tenant-001', first_name: 'Sneha', last_name: 'Patel', email: 'sneha.patel@outlook.com', phone: '+91 65432 10987', gender: 'female', date_of_birth: '1990-01-30', loyalty_points: 3100, total_visits: 42, total_spent: 156000, is_active: true, created_at: new Date().toISOString() }
    ],
    services: [
      { id: 's1', tenant_id: 'demo-tenant-001', category_id: 'cat1', category_name: 'Hair Care', name: 'Haircut & Styling', description: 'Professional haircut with wash and blow dry', duration_minutes: 45, price: 800, compare_price: 1000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: new Date().toISOString() },
      { id: 's2', tenant_id: 'demo-tenant-001', category_id: 'cat1', category_name: 'Hair Care', name: 'Hair Coloring', description: 'Global or highlight coloring with premium products', duration_minutes: 120, price: 3500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: new Date().toISOString() },
      { id: 's3', tenant_id: 'demo-tenant-001', category_id: 'cat2', category_name: 'Skin Care', name: 'Gold Facial', description: 'Premium gold facial for radiant glow', duration_minutes: 75, price: 2500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: new Date().toISOString() }
    ],
    serviceCategories: [
      { id: 'cat1', tenant_id: 'demo-tenant-001', name: 'Hair Care', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
      { id: 'cat2', tenant_id: 'demo-tenant-001', name: 'Skin Care', sort_order: 2, is_active: true, created_at: new Date().toISOString() }
    ],
    staff: [
      { id: 'st1', tenant_id: 'demo-tenant-001', role: 'stylist', first_name: 'Neha', last_name: 'Verma', email: 'neha@glamstyle.in', phone: '+91 98765 11111', commission_percent: 30, specializations: ['Hair Coloring'], is_active: true, rating: 4.8, total_appointments: 124, revenue_generated: 285000, created_at: new Date().toISOString() },
      { id: 'st2', tenant_id: 'demo-tenant-001', role: 'beautician', first_name: 'Rekha', last_name: 'Iyer', email: 'rekha@glamstyle.in', phone: '+91 98765 22222', commission_percent: 25, specializations: ['Skin Care'], is_active: true, rating: 4.9, total_appointments: 98, revenue_generated: 320000, created_at: new Date().toISOString() }
    ],
    appointments: [],
    invoices: [],
    products: [
      { id: 'p1', tenant_id: 'demo-tenant-001', name: "L'Oréal Hair Serum", description: 'Smoothening serum 100ml', sku: 'LOR-SER-001', category: 'Hair Care', brand: "L'Oréal", cost_price: 350, selling_price: 599, tax_percent: 18, stock_quantity: 24, min_stock_level: 5, is_active: true, created_at: new Date().toISOString() }
    ],
    memberships: [
      { id: 'mp1', tenant_id: 'demo-tenant-001', name: 'Silver', description: 'Basic membership', price: 2999, duration_days: 90, max_services: 6, discount_percent: 10, benefits: ['10% off services'], is_active: true, created_at: new Date().toISOString() }
    ],
    campaigns: [],
    auditLogs: [],
    notifications: []
  }

  return defaultMock
}

const seeds = getSeeds()

// ==========================================
// REPOSITORIES
// ==========================================

export const CustomerRepository = {
  list: async (tenantId: string): Promise<Customer[]> => {
    if (isDemoMode) {
      return getMockTable<Customer>('customers', seeds.customers).filter(c => c.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('customers').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as Customer[]
  },
  getById: async (id: string): Promise<Customer | null> => {
    if (isDemoMode) {
      return getMockTable<Customer>('customers', seeds.customers).find(c => c.id === id) || null
    }
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Customer | null
  },
  create: async (customer: Partial<Customer>): Promise<Customer> => {
    const id = customer.id || generateId()
    const newCustomer = {
      ...customer,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Customer

    if (isDemoMode) {
      const list = getMockTable<Customer>('customers', seeds.customers)
      list.push(newCustomer)
      saveMockTable('customers', list)
      return newCustomer
    }

    const { data, error } = await supabase.from('customers').insert(newCustomer).select().single()
    if (error) throw error
    return data as Customer
  },
  update: async (id: string, updates: Partial<Customer>): Promise<Customer> => {
    if (isDemoMode) {
      const list = getMockTable<Customer>('customers', seeds.customers)
      const index = list.findIndex(c => c.id === id)
      if (index === -1) throw new Error('Customer not found')
      const updated = { ...list[index], ...updates, updated_at: new Date().toISOString() } as Customer
      list[index] = updated
      saveMockTable('customers', list)
      return updated
    }

    const { data, error } = await supabase.from('customers').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Customer
  },
  merge: async (mainId: string, duplicateId: string): Promise<void> => {
    if (isDemoMode) {
      // 1. Transfer appointments
      const apts = getMockTable<Appointment>('appointments', seeds.appointments)
      const updatedApts = apts.map(a => a.customer_id === duplicateId ? { ...a, customer_id: mainId } : a)
      saveMockTable('appointments', updatedApts)

      // 2. Transfer invoices
      const invs = getMockTable<Invoice>('invoices', seeds.invoices)
      const updatedInvs = invs.map(i => i.customer_id === duplicateId ? { ...i, customer_id: mainId } : i)
      saveMockTable('invoices', updatedInvs)

      // 3. Add loyalty points to main
      const customersList = getMockTable<Customer>('customers', seeds.customers)
      const mainIdx = customersList.findIndex(c => c.id === mainId)
      const dupIdx = customersList.findIndex(c => c.id === duplicateId)
      if (mainIdx !== -1 && dupIdx !== -1) {
        customersList[mainIdx].loyalty_points = (customersList[mainIdx].loyalty_points || 0) + (customersList[dupIdx].loyalty_points || 0)
        customersList[mainIdx].total_spent = (customersList[mainIdx].total_spent || 0) + (customersList[dupIdx].total_spent || 0)
        customersList[mainIdx].total_visits = (customersList[mainIdx].total_visits || 0) + (customersList[dupIdx].total_visits || 0)
      }

      // 4. Delete duplicate
      const filtered = customersList.filter(c => c.id !== duplicateId)
      saveMockTable('customers', filtered)
      return
    }

    // Supabase Mode Transaction simulation
    const { error: aptError } = await supabase.from('appointments').update({ customer_id: mainId }).eq('customer_id', duplicateId)
    if (aptError) throw aptError
    
    const { error: invError } = await supabase.from('invoices').update({ customer_id: mainId }).eq('customer_id', duplicateId)
    if (invError) throw invError

    // Sum loyalty points
    const { data: main } = await supabase.from('customers').select('*').eq('id', mainId).single()
    const { data: dup } = await supabase.from('customers').select('*').eq('id', duplicateId).single()
    if (main && dup) {
      await supabase.from('customers').update({
        loyalty_points: (main.loyalty_points || 0) + (dup.loyalty_points || 0),
        total_spent: (Number(main.total_spent) || 0) + (Number(dup.total_spent) || 0),
        total_visits: (main.total_visits || 0) + (dup.total_visits || 0)
      }).eq('id', mainId)
    }

    const { error: delError } = await supabase.from('customers').delete().eq('id', duplicateId)
    if (delError) throw delError
  },
  delete: async (id: string): Promise<void> => {
    if (isDemoMode) {
      const list = getMockTable<Customer>('customers', seeds.customers)
      const filtered = list.filter(c => c.id !== id)
      saveMockTable('customers', filtered)
      return
    }
    const { error } = await supabase.from('customers').delete().eq('id', id)
    if (error) throw error
  }
}

export const ServiceRepository = {
  listCategories: async (tenantId: string): Promise<ServiceCategory[]> => {
    if (isDemoMode) {
      return getMockTable<ServiceCategory>('serviceCategories', seeds.serviceCategories).filter(sc => sc.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('service_categories').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as ServiceCategory[]
  },
  list: async (tenantId: string): Promise<Service[]> => {
    if (isDemoMode) {
      return getMockTable<Service>('services', seeds.services).filter(s => s.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('services').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as Service[]
  },
  create: async (service: Partial<Service>): Promise<Service> => {
    const id = service.id || generateId()
    const newService = {
      ...service,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Service

    if (isDemoMode) {
      const list = getMockTable<Service>('services', seeds.services)
      list.push(newService)
      saveMockTable('services', list)
      return newService
    }
    const { data, error } = await supabase.from('services').insert(newService).select().single()
    if (error) throw error
    return data as Service
  },
  update: async (id: string, updates: Partial<Service>): Promise<Service> => {
    if (isDemoMode) {
      const list = getMockTable<Service>('services', seeds.services)
      const idx = list.findIndex(s => s.id === id)
      if (idx === -1) throw new Error('Service not found')
      const updated = { ...list[idx], ...updates, updated_at: new Date().toISOString() } as Service
      list[idx] = updated
      saveMockTable('services', list)
      return updated
    }
    const { data, error } = await supabase.from('services').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Service
  }
}

export const StaffRepository = {
  list: async (tenantId: string): Promise<Staff[]> => {
    if (isDemoMode) {
      return getMockTable<Staff>('staff', seeds.staff).filter(s => s.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as Staff[]
  },
  getById: async (id: string): Promise<Staff | null> => {
    if (isDemoMode) {
      return getMockTable<Staff>('staff', seeds.staff).find(s => s.id === id) || null
    }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Staff | null
  },
  update: async (id: string, updates: Partial<Staff>): Promise<Staff> => {
    if (isDemoMode) {
      const list = getMockTable<Staff>('staff', seeds.staff)
      const idx = list.findIndex(s => s.id === id)
      if (idx === -1) throw new Error('Staff not found')
      const updated = { ...list[idx], ...updates, updated_at: new Date().toISOString() } as Staff
      list[idx] = updated
      saveMockTable('staff', list)
      return updated
    }
    const { data, error } = await supabase.from('profiles').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Staff
  },
  listShifts: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('staffShifts', [
      { id: 'sh1', tenant_id: tenantId, staff_id: 'st1', day_of_week: 1, start_time: '09:00', end_time: '18:00', is_working: true },
      { id: 'sh2', tenant_id: tenantId, staff_id: 'st1', day_of_week: 2, start_time: '09:00', end_time: '18:00', is_working: true },
      { id: 'sh3', tenant_id: tenantId, staff_id: 'st2', day_of_week: 1, start_time: '10:00', end_time: '19:00', is_working: true },
    ])
  },
  saveShifts: async (shifts: any[]): Promise<void> => {
    saveMockTable('staffShifts', shifts)
  },
  listLeaves: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('staffLeaves', [
      { id: 'l1', tenant_id: tenantId, staff_id: 'st1', start_date: '2026-08-10', end_date: '2026-08-12', reason: 'Personal Leave', status: 'approved' }
    ])
  },
  createLeave: async (leave: any): Promise<void> => {
    const list = getMockTable<any>('staffLeaves', [])
    list.push({ id: generateId(), ...leave, created_at: new Date().toISOString() })
    saveMockTable('staffLeaves', list)
  },
  listAttendance: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('staffAttendance', [
      { id: 'at1', tenant_id: tenantId, staff_id: 'st1', date: new Date().toISOString().split('T')[0], clock_in: '08:55', clock_out: '18:05', status: 'present' }
    ])
  },
  logAttendance: async (record: any): Promise<void> => {
    const list = getMockTable<any>('staffAttendance', [])
    list.push({ id: generateId(), ...record, date: new Date().toISOString().split('T')[0] })
    saveMockTable('staffAttendance', list)
  }
}

export const AppointmentRepository = {
  list: async (tenantId: string): Promise<Appointment[]> => {
    if (isDemoMode) {
      return getMockTable<Appointment>('appointments', seeds.appointments).filter(a => a.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('appointments').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as Appointment[]
  },
  getById: async (id: string): Promise<Appointment | null> => {
    if (isDemoMode) {
      return getMockTable<Appointment>('appointments', seeds.appointments).find(a => a.id === id) || null
    }
    const { data, error } = await supabase.from('appointments').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Appointment | null
  },
  create: async (apt: Partial<Appointment>): Promise<Appointment> => {
    const id = apt.id || generateId()
    const newApt = {
      ...apt,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Appointment

    if (isDemoMode) {
      const list = getMockTable<Appointment>('appointments', seeds.appointments)
      list.push(newApt)
      saveMockTable('appointments', list)
      return newApt
    }
    const { data, error } = await supabase.from('appointments').insert(newApt).select().single()
    if (error) throw error
    return data as Appointment
  },
  update: async (id: string, updates: Partial<Appointment>): Promise<Appointment> => {
    if (isDemoMode) {
      const list = getMockTable<Appointment>('appointments', seeds.appointments)
      const idx = list.findIndex(a => a.id === id)
      if (idx === -1) throw new Error('Appointment not found')
      const updated = { ...list[idx], ...updates, updated_at: new Date().toISOString() } as Appointment
      list[idx] = updated
      saveMockTable('appointments', list)
      return updated
    }
    const { data, error } = await supabase.from('appointments').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Appointment
  },
  updateStatus: async (id: string, status: string): Promise<Appointment> => {
    if (isDemoMode) {
      const list = getMockTable<Appointment>('appointments', seeds.appointments)
      const idx = list.findIndex(a => a.id === id)
      if (idx === -1) throw new Error('Appointment not found')
      const updated = { ...list[idx], status, updated_at: new Date().toISOString() } as Appointment
      list[idx] = updated
      saveMockTable('appointments', list)
      return updated
    }
    const { data, error } = await supabase.from('appointments').update({ status, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Appointment
  },
  delete: async (id: string): Promise<void> => {
    if (isDemoMode) {
      const list = getMockTable<Appointment>('appointments', seeds.appointments)
      const filtered = list.filter(a => a.id !== id)
      saveMockTable('appointments', filtered)
      return
    }
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw error
  }
}

export const InvoiceRepository = {
  list: async (tenantId: string): Promise<Invoice[]> => {
    if (isDemoMode) {
      return getMockTable<Invoice>('invoices', seeds.invoices).filter(i => i.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('invoices').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as Invoice[]
  },
  getById: async (id: string): Promise<Invoice | null> => {
    if (isDemoMode) {
      return getMockTable<Invoice>('invoices', seeds.invoices).find(i => i.id === id) || null
    }
    const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Invoice | null
  },
  create: async (inv: Partial<Invoice>): Promise<Invoice> => {
    const id = inv.id || generateId()
    const newInv = {
      ...inv,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Invoice

    if (isDemoMode) {
      const list = getMockTable<Invoice>('invoices', seeds.invoices)
      list.push(newInv)
      saveMockTable('invoices', list)
      return newInv
    }
    const { data, error } = await supabase.from('invoices').insert(newInv).select().single()
    if (error) throw error
    return data as Invoice
  },
  updateStatus: async (id: string, status: string, notes?: string): Promise<Invoice> => {
    if (isDemoMode) {
      const list = getMockTable<Invoice>('invoices', seeds.invoices)
      const idx = list.findIndex(i => i.id === id)
      if (idx === -1) throw new Error('Invoice not found')
      const updated = { ...list[idx], status, notes: notes || list[idx].notes, updated_at: new Date().toISOString() } as Invoice
      list[idx] = updated
      saveMockTable('invoices', list)
      return updated
    }
    const { data, error } = await supabase.from('invoices').update({ status, notes, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Invoice
  }
}

export const ProductRepository = {
  list: async (tenantId: string): Promise<Product[]> => {
    if (isDemoMode) {
      return getMockTable<Product>('products', seeds.products).filter(p => p.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('products').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as Product[]
  },
  getById: async (id: string): Promise<Product | null> => {
    if (isDemoMode) {
      return getMockTable<Product>('products', seeds.products).find(p => p.id === id) || null
    }
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data as Product | null
  },
  create: async (prod: Partial<Product>): Promise<Product> => {
    const id = prod.id || generateId()
    const newP = {
      ...prod,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Product
    if (isDemoMode) {
      const list = getMockTable<Product>('products', seeds.products)
      list.push(newP)
      saveMockTable('products', list)
      return newP
    }
    const { data, error } = await supabase.from('products').insert(newP).select().single()
    if (error) throw error
    return data as Product
  },
  update: async (id: string, updates: Partial<Product>): Promise<Product> => {
    if (isDemoMode) {
      const list = getMockTable<Product>('products', seeds.products)
      const idx = list.findIndex(p => p.id === id)
      if (idx === -1) throw new Error('Product not found')
      const updated = { ...list[idx], ...updates, updated_at: new Date().toISOString() } as Product
      list[idx] = updated
      saveMockTable('products', list)
      return updated
    }
    const { data, error } = await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) throw error
    return data as Product
  },
  updateStock: async (id: string, change: number): Promise<void> => {
    if (isDemoMode) {
      const list = getMockTable<Product>('products', seeds.products)
      const idx = list.findIndex(p => p.id === id)
      if (idx !== -1) {
        list[idx].stock_quantity = Math.max((list[idx].stock_quantity || 0) + change, 0)
        saveMockTable('products', list)
      }
      return
    }
    await supabase.rpc('adjust_product_stock', { p_id: id, p_change: change })
  },
  listSuppliers: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('suppliers', [
      { id: 'sup1', tenant_id: tenantId, name: 'Loreal Professional India', contact_person: 'Amit Sharma', phone: '9876500001', email: 'amit@loreal.in', outstanding_balance: 15000, rating: 4.8 },
      { id: 'sup2', tenant_id: tenantId, name: 'Schwarzkopf Distributors', contact_person: 'Neha Roy', phone: '9876500002', email: 'neha@schwarzkopf.in', outstanding_balance: 0, rating: 4.5 }
    ])
  },
  createSupplier: async (sup: any): Promise<any> => {
    const list = getMockTable<any>('suppliers', [])
    const newS = { id: generateId(), ...sup, created_at: new Date().toISOString() }
    list.push(newS)
    saveMockTable('suppliers', list)
    return newS
  },
  listPurchaseOrders: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('purchaseOrders', [
      { id: 'po1', tenant_id: tenantId, supplier_name: 'Loreal Professional India', items: [{ name: 'Loreal Color Gel', quantity: 20, unit_cost: 350 }], total_cost: 7000, status: 'completed', expected_delivery: '2026-08-01' }
    ])
  },
  createPurchaseOrder: async (po: any): Promise<any> => {
    const list = getMockTable<any>('purchaseOrders', [])
    const newPo = { id: generateId(), ...po, created_at: new Date().toISOString() }
    list.push(newPo)
    saveMockTable('purchaseOrders', list)
    return newPo
  },
  updatePurchaseOrder: async (id: string, updates: any): Promise<any> => {
    const list = getMockTable<any>('purchaseOrders', [])
    const idx = list.findIndex(p => p.id === id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
      saveMockTable('purchaseOrders', list)
      return list[idx]
    }
  },
  listTransactions: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('inventoryTransactions', [
      { id: 'tx1', tenant_id: tenantId, product_name: 'Loreal Color Gel', change_quantity: 20, type: 'incoming', reason: 'Purchase Order Complete', created_at: '2026-07-01T10:00:00.000Z' }
    ])
  },
  logTransaction: async (tx: any): Promise<void> => {
    const list = getMockTable<any>('inventoryTransactions', [])
    list.push({ id: generateId(), ...tx, created_at: new Date().toISOString() })
    saveMockTable('inventoryTransactions', list)
  }
}

export const AuditRepository = {
  log: async (log: Partial<AuditLog>): Promise<void> => {
    const newLog = {
      id: generateId(),
      ...log,
      created_at: new Date().toISOString()
    } as AuditLog

    if (isDemoMode) {
      const list = getMockTable<AuditLog>('auditLogs', [])
      list.push(newLog)
      saveMockTable('auditLogs', list)
      return
    }
    await supabase.from('audit_logs').insert(newLog)
  },
  list: async (tenantId: string): Promise<AuditLog[]> => {
    if (isDemoMode) {
      return getMockTable<AuditLog>('auditLogs', []).filter(al => al.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('audit_logs').select('*').eq('tenant_id', tenantId).order('created_at', { ascending: false })
    if (error) throw error
    return data as AuditLog[]
  },
  listAll: async (): Promise<AuditLog[]> => {
    if (isDemoMode) {
      return getMockTable<AuditLog>('auditLogs', [
        { id: 'al1', tenant_id: 'system', user_id: 'admin', user_name: 'Super Admin', action: 'backup_complete', entity_type: 'platform', entity_id: 'db', old_values: {}, new_values: {}, ip_address: '127.0.0.1', created_at: '2026-07-16T15:00:00Z' },
        { id: 'al2', tenant_id: 'demo-tenant-001', user_id: 'st1', user_name: 'Neha Verma', action: 'create_appointment', entity_type: 'appointment', entity_id: 'apt1', old_values: {}, new_values: {}, ip_address: '10.148.225.41', created_at: '2026-07-16T18:32:00Z' }
      ])
    }
    const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false })
    if (error) throw error
    return data as AuditLog[]
  }
}

export const NotificationRepository = {
  send: async (notif: Partial<Notification>): Promise<void> => {
    const newN = {
      id: generateId(),
      is_read: false,
      created_at: new Date().toISOString(),
      ...notif
    } as Notification

    if (isDemoMode) {
      const list = getMockTable<Notification>('notifications', [])
      list.push(newN)
      saveMockTable('notifications', list)
      return
    }
    await supabase.from('notifications').insert(newN)
  },
  list: async (tenantId: string): Promise<Notification[]> => {
    if (isDemoMode) {
      return getMockTable<Notification>('notifications', []).filter(n => n.tenant_id === tenantId)
    }
    const { data, error } = await supabase.from('notifications').select('*').eq('tenant_id', tenantId)
    if (error) throw error
    return data as Notification[]
  }
}

export const CustomerValueRepository = {
  listMemberships: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('memberships', [
      { id: 'm1', tenant_id: tenantId, name: 'Gold Membership', price: 1500, discount_percent: 15, services_limit: 10, status: 'active' },
      { id: 'm2', tenant_id: tenantId, name: 'VIP Platinum', price: 3000, discount_percent: 25, services_limit: 99, status: 'active' }
    ])
  },

  listCustomerPackages: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('customerPackages', [
      { id: 'pkg1', tenant_id: tenantId, customer_id: 'c1', name: '10 Haircuts Package', total_sessions: 10, remaining_sessions: 8, status: 'active' },
      { id: 'pkg2', tenant_id: tenantId, customer_id: 'c2', name: '5 Glow Facials Package', total_sessions: 5, remaining_sessions: 5, status: 'active' }
    ])
  },

  updatePackageSessions: async (pkgId: string, change: number): Promise<void> => {
    const list = getMockTable<any>('customerPackages', [])
    const idx = list.findIndex(p => p.id === pkgId)
    if (idx !== -1) {
      list[idx].remaining_sessions = Math.max((list[idx].remaining_sessions || 0) + change, 0)
      if (list[idx].remaining_sessions === 0) list[idx].status = 'depleted'
      saveMockTable('customerPackages', list)
    }
  },

  listGiftCards: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('giftCards', [
      { id: 'gc1', tenant_id: tenantId, code: 'GIFT-VERCEL-100', initial_balance: 1000, current_balance: 1000, status: 'active', expiry_date: '2027-01-01' }
    ])
  },

  updateGiftCardBalance: async (code: string, change: number): Promise<void> => {
    const list = getMockTable<any>('giftCards', [])
    const idx = list.findIndex(g => g.code.toUpperCase() === code.toUpperCase())
    if (idx !== -1) {
      list[idx].current_balance = Math.max((list[idx].current_balance || 0) + change, 0)
      if (list[idx].current_balance === 0) list[idx].status = 'redeemed'
      saveMockTable('giftCards', list)
    }
  },

  listWalletTransactions: async (customerId: string, tenantId: string): Promise<any[]> => {
    return getMockTable<any>('walletTransactions', []).filter(t => t.customer_id === customerId && t.tenant_id === tenantId)
  },

  logWalletTransaction: async (tx: any): Promise<void> => {
    const list = getMockTable<any>('walletTransactions', [])
    list.push({ id: generateId(), ...tx, created_at: new Date().toISOString() })
    saveMockTable('walletTransactions', list)

    // Update customer wallet balance cache
    const cList = getMockTable<any>('customers', [])
    const cIdx = cList.findIndex((c: any) => c.id === tx.customer_id)
    if (cIdx !== -1) {
      cList[cIdx].wallet_balance = Math.max((cList[cIdx].wallet_balance || 0) + tx.change_amount, 0)
      saveMockTable('customers', cList)
    }
  }
}

export const MarketingRepository = {
  listCampaigns: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('campaigns', [
      { id: 'camp1', tenant_id: tenantId, name: 'Welcome Offer SMS', channel: 'sms', status: 'completed', recipients_count: 45, sent_count: 45, opened_count: 38, clicks_count: 12, revenue_generated: 12400, budget: 1500, created_at: '2026-07-01T10:00:00Z' },
      { id: 'camp2', tenant_id: tenantId, name: 'Festival Haircut Discount WhatsApp', channel: 'whatsapp', status: 'scheduled', recipients_count: 120, sent_count: 0, opened_count: 0, clicks_count: 0, revenue_generated: 0, budget: 3000, created_at: '2026-07-15T12:00:00Z' }
    ])
  },

  createCampaign: async (campaign: any): Promise<any> => {
    const list = getMockTable<any>('campaigns', [])
    const newCamp = { id: generateId(), ...campaign, created_at: new Date().toISOString() }
    list.push(newCamp)
    saveMockTable('campaigns', list)
    return newCamp
  },

  updateCampaign: async (id: string, updates: any): Promise<any> => {
    const list = getMockTable<any>('campaigns', [])
    const idx = list.findIndex(c => c.id === id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
      saveMockTable('campaigns', list)
      return list[idx]
    }
  },

  listSegments: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('segments', [
      { id: 'seg1', tenant_id: tenantId, name: 'VIP Customers', description: 'Clients with lifetime spend exceeding ₹100,000', query_rules: { min_spent: 100000 }, customer_count: 3 },
      { id: 'seg2', tenant_id: tenantId, name: 'Inactive 30 Days', description: 'Clients with no visits in the past 30 days', query_rules: { max_days_since_visit: 30 }, customer_count: 8 },
      { id: 'seg3', tenant_id: tenantId, name: 'Birthday This Month', description: 'Clients born in the current calendar month', query_rules: { birthday_month: true }, customer_count: 5 }
    ])
  },

  createSegment: async (segment: any): Promise<any> => {
    const list = getMockTable<any>('segments', [])
    const newSeg = { id: generateId(), ...segment, created_at: new Date().toISOString() }
    list.push(newSeg)
    saveMockTable('segments', list)
    return newSeg
  },

  listCoupons: async (tenantId: string): Promise<any[]> => {
    return getMockTable<any>('coupons', [
      { id: 'coup1', tenant_id: tenantId, code: 'WELCOME10', discount_percent: 10, expiry_date: '2027-01-01', active: true, uses_count: 12 },
      { id: 'coup2', tenant_id: tenantId, code: 'FESTIVAL20', discount_percent: 20, expiry_date: '2026-10-31', active: true, uses_count: 4 }
    ])
  },

  createCoupon: async (coupon: any): Promise<any> => {
    const list = getMockTable<any>('coupons', [])
    const newCoup = { id: generateId(), ...coupon, created_at: new Date().toISOString(), uses_count: 0 }
    list.push(newCoup)
    saveMockTable('coupons', list)
    return newCoup
  },

  updateCoupon: async (id: string, updates: any): Promise<any> => {
    const list = getMockTable<any>('coupons', [])
    const idx = list.findIndex(c => c.id === id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
      saveMockTable('coupons', list)
      return list[idx]
    }
  }
}

export const SuperAdminRepository = {
  listTenants: async (): Promise<any[]> => {
    return getMockTable<any>('tenants', [
      {
        id: 'demo-tenant-001',
        name: 'GlamStyle Salon & Spa',
        owner_name: 'Aditya Sen',
        owner_email: 'owner@glamstyle.in',
        plan: 'Professional',
        status: 'active',
        created_at: '2026-05-01T10:00:00Z',
        subscription_renewal: '2026-08-01',
        mrr_revenue: 12000,
        staff_count: 8,
        customer_count: 142,
        database_size_mb: 24,
        storage_used_gb: 1.2,
        last_login: '2026-07-16T18:30:00Z',
        health_score: 96,
        limits: { staff: 10, branches: 3, appointments: 500, storage_gb: 5 },
        flags: { ai: true, marketing: true, inventory: true, portal: true }
      },
      {
        id: 'demo-tenant-002',
        name: 'Vercel Hair Cutting Lab',
        owner_name: 'Guillermo R.',
        owner_email: 'cut@vercel.com',
        plan: 'Starter',
        status: 'active',
        created_at: '2026-06-15T12:00:00Z',
        subscription_renewal: '2026-07-28',
        mrr_revenue: 4000,
        staff_count: 3,
        customer_count: 45,
        database_size_mb: 8,
        storage_used_gb: 0.4,
        last_login: '2026-07-15T14:22:00Z',
        health_score: 88,
        limits: { staff: 3, branches: 1, appointments: 150, storage_gb: 2 },
        flags: { ai: false, marketing: false, inventory: true, portal: true }
      },
      {
        id: 'demo-tenant-003',
        name: 'Unpaid Suspended Salon',
        owner_name: 'Rohan Mehta',
        owner_email: 'badpay@gmail.com',
        plan: 'Professional',
        status: 'suspended',
        created_at: '2026-04-10T11:00:00Z',
        subscription_renewal: '2026-05-10',
        mrr_revenue: 12000,
        staff_count: 6,
        customer_count: 98,
        database_size_mb: 18,
        storage_used_gb: 2.1,
        last_login: '2026-06-12T09:15:00Z',
        health_score: 42,
        limits: { staff: 10, branches: 3, appointments: 500, storage_gb: 5 },
        flags: { ai: true, marketing: true, inventory: true, portal: true }
      },
      {
        id: 'demo-tenant-004',
        name: 'Elite Groomers Club',
        owner_name: 'Vikram Singh',
        owner_email: 'vikram@elitegroomers.in',
        plan: 'Enterprise',
        status: 'active',
        created_at: '2026-01-20T08:00:00Z',
        subscription_renewal: '2027-01-20',
        mrr_revenue: 35000,
        staff_count: 24,
        customer_count: 680,
        database_size_mb: 112,
        storage_used_gb: 4.8,
        last_login: '2026-07-16T20:10:00Z',
        health_score: 99,
        limits: { staff: 50, branches: 10, appointments: 2500, storage_gb: 15 },
        flags: { ai: true, marketing: true, inventory: true, portal: true }
      },
      {
        id: 'demo-tenant-005',
        name: 'Grace & Glow Beauty Co',
        owner_name: 'Meera Nair',
        owner_email: 'meera@graceandglow.com',
        plan: 'Free',
        status: 'active',
        created_at: '2026-07-02T15:00:00Z',
        subscription_renewal: '2026-08-02',
        mrr_revenue: 0,
        staff_count: 2,
        customer_count: 14,
        database_size_mb: 2,
        storage_used_gb: 0.1,
        last_login: '2026-07-16T11:45:00Z',
        health_score: 74,
        limits: { staff: 2, branches: 1, appointments: 50, storage_gb: 1 },
        flags: { ai: false, marketing: false, inventory: false, portal: true }
      }
    ])
  },

  createTenant: async (tenant: any): Promise<any> => {
    const list = getMockTable<any>('tenants', [])
    const newTenant = {
      id: generateId(),
      status: 'active',
      active_users: 1,
      database_size_mb: 1,
      storage_used_gb: 0.1,
      health_score: 100,
      subscription_renewal: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      created_at: new Date().toISOString(),
      ...tenant
    }
    list.push(newTenant)
    saveMockTable('tenants', list)
    return newTenant
  },

  updateTenant: async (id: string, updates: any): Promise<any> => {
    const list = getMockTable<any>('tenants', [])
    const idx = list.findIndex(t => t.id === id)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
      saveMockTable('tenants', list)
      return list[idx]
    }
  },

  listPlans: async (): Promise<any[]> => {
    return getMockTable<any>('saas_plans', [
      { id: 'p-starter', name: 'Starter Plan', price_monthly: 2999, price_yearly: 29990, trial_days: 14, staff_limit: 3, customer_limit: 150, storage_limit_gb: 2, status: 'active' },
      { id: 'p-professional', name: 'Professional Plan', price_monthly: 6999, price_yearly: 69990, trial_days: 14, staff_limit: 10, customer_limit: 500, storage_limit_gb: 5, status: 'active' },
      { id: 'p-enterprise', name: 'Enterprise Plan', price_monthly: 14999, price_yearly: 149990, trial_days: 30, staff_limit: 50, customer_limit: 2500, storage_limit_gb: 15, status: 'active' }
    ])
  },

  savePlans: async (plans: any[]): Promise<void> => {
    saveMockTable('saas_plans', plans)
  },

  listCoupons: async (): Promise<any[]> => {
    return getMockTable<any>('saas_coupons', [
      { id: 'c-welcome', code: 'WELCOME10', discount_percent: 10, expiry_date: '2027-01-01', active: true, usage_limit: 100, uses_count: 12, scope: 'global', tenant_id: null },
      { id: 'c-festival', code: 'FESTIVAL20', discount_percent: 20, expiry_date: '2026-10-31', active: true, usage_limit: 50, uses_count: 4, scope: 'tenant', tenant_id: 'demo-tenant-001' }
    ])
  },

  saveCoupons: async (coupons: any[]): Promise<void> => {
    saveMockTable('saas_coupons', coupons)
  },

  getGlobalSettings: async (): Promise<any> => {
    const list = getMockTable<any>('saas_settings', [
      {
        id: 'global-config',
        name: 'SalonOS SaaS Platform',
        logo: '',
        currency: 'INR',
        language: 'English',
        tax_rate: '18',
        gstin: '27AAAAA1111A1Z1',
        maintenance_mode: false,
        smtp_host: 'smtp.salonos.io',
        smtp_port: '587',
        smtp_user: 'platform-alerts@salonos.io',
        sms_gateway: 'twilio',
        sms_api_key: 'SK-TWILIO-MOCK-123456',
        whatsapp_sender: '+919999999999',
        system_email_template: 'Hi {{name}}, your subscription renewal is due on {{date}}.',
        system_sms_template: 'Payment failed for invoice {{invoice}}. Please update details.',
        system_whatsapp_template: 'Thank you for choosing SalonOS! Welcome on board.'
      }
    ])
    return list[0]
  },

  saveGlobalSettings: async (settings: any): Promise<void> => {
    saveMockTable('saas_settings', [settings])
  },

  listExpenses: async (): Promise<any[]> => {
    return getMockTable<any>('saas_expenses', [
      {
        id: 'exp-default-1',
        hosting_provider: 'Vercel',
        hosting_cost: 15000,
        supabase_cost: 8000,
        database_cost: 5000,
        storage_cost: 2000,
        email_provider_cost: 3500,
        sms_provider_cost: 14000,
        payment_gateway_fees: 8500,
        developer_cost: 25000,
        marketing_cost: 12000,
        misc_cost: 1000,
        tax: 18,
        notes: 'Standard monthly infrastructure overheads.',
        month: '7',
        year: '2026'
      }
    ])
  },

  saveExpenses: async (expenses: any[]): Promise<void> => {
    saveMockTable('saas_expenses', expenses)
  },

  factoryResetSaaS: async (): Promise<void> => {
    if (typeof window === 'undefined') return
    localStorage.setItem('salon_ai_db_factory_reset_active', 'true')
    
    const collectionsToClear = [
      'tenants',
      'customers',
      'services',
      'serviceCategories',
      'staff',
      'appointments',
      'invoices',
      'products',
      'memberships',
      'campaigns',
      'auditLogs',
      'notifications',
      'saas_coupons',
      'drawer_logs',
      'saas_expenses'
    ]

    collectionsToClear.forEach(col => {
      localStorage.setItem(`salon_ai_db_${col}`, JSON.stringify([]))
    })
  }
}

export const SettingsRepository = {
  getSettings: async (tenantId: string): Promise<any> => {
    const list = getMockTable<any>('settings', [
      {
        id: 'default-settings',
        tenant_id: tenantId,
        name: 'GlamStyle Salon & Spa',
        logo: '',
        phone: '+91 98765 43210',
        email: 'contact@glamstyle.in',
        address: '12, Link Road, Bandra West, Mumbai, MH - 400050',
        gstin: '27AAAAA1111A1Z1',
        rate: '18',
        currency: 'INR',
        receipt_header: 'GLAMSTYLE SALON & SPA',
        receipt_footer: 'Thank you for your visit! Returns/refunds within 7 days.',
        theme: 'dark',
        business_hours: [
          { day: 'Monday', open: '09:00', close: '20:00', closed: false },
          { day: 'Tuesday', open: '09:00', close: '20:00', closed: false },
          { day: 'Wednesday', open: '09:00', close: '20:00', closed: false },
          { day: 'Thursday', open: '09:00', close: '20:00', closed: false },
          { day: 'Friday', open: '09:00', close: '21:00', closed: false },
          { day: 'Saturday', open: '08:00', close: '21:00', closed: false },
          { day: 'Sunday', open: '08:00', close: '20:00', closed: false },
        ]
      }
    ])
    return list.find(s => s.tenant_id === tenantId) || list[0]
  },

  saveSettings: async (tenantId: string, updates: any): Promise<any> => {
    const list = getMockTable<any>('settings', [])
    const idx = list.findIndex(s => s.tenant_id === tenantId)
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updated_at: new Date().toISOString() }
      saveMockTable('settings', list)
      return list[idx]
    } else {
      const newSettings = { id: generateId(), tenant_id: tenantId, ...updates, created_at: new Date().toISOString() }
      list.push(newSettings)
      saveMockTable('settings', list)
      return newSettings
    }
  },

  resetTable: async (tenantId: string, section: string): Promise<void> => {
    if (typeof window === 'undefined') return
    
    if (section === 'transactions') {
      localStorage.removeItem('salon_ai_db_invoices')
      localStorage.removeItem('salon_ai_drawer_logs')
      localStorage.setItem('salon_ai_drawer_opening', '5000')
      localStorage.setItem('salon_ai_drawer_open', 'false')
      saveMockTable('invoices', [])
    } else if (section === 'appointments') {
      localStorage.removeItem('salon_ai_db_appointments')
      saveMockTable('appointments', [])
    } else if (section === 'customers') {
      localStorage.removeItem('salon_ai_db_customers')
      saveMockTable('customers', [
        { id: 'c1', tenant_id: tenantId, first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@gmail.com', phone: '+91 98765 43210', loyalty_points: 2450, total_visits: 34, total_spent: 89500, is_active: true, created_at: new Date().toISOString() },
        { id: 'c2', tenant_id: tenantId, first_name: 'Anita', last_name: 'Desai', email: 'anita.desai@yahoo.com', phone: '+91 87654 32109', loyalty_points: 5200, total_visits: 56, total_spent: 234000, is_active: true, created_at: new Date().toISOString() }
      ])
    } else if (section === 'inventory') {
      localStorage.removeItem('salon_ai_db_products')
      localStorage.removeItem('salon_ai_db_purchaseOrders')
      localStorage.removeItem('salon_ai_db_inventoryTransactions')
      saveMockTable('products', [
        { id: 'p1', tenant_id: tenantId, name: "L'Oréal Hair Serum", description: 'Smoothening serum 100ml', sku: 'LOR-SER-001', category: 'Hair Care', brand: "L'Oréal", cost_price: 350, selling_price: 599, tax_percent: 18, stock_quantity: 24, min_stock_level: 5, is_active: true, created_at: new Date().toISOString() }
      ])
    } else if (section === 'memberships') {
      localStorage.removeItem('salon_ai_db_memberships')
      localStorage.removeItem('salon_ai_db_customerPackages')
      localStorage.removeItem('salon_ai_db_giftCards')
      saveMockTable('memberships', [
        { id: 'm1', tenant_id: tenantId, name: 'Gold Membership', price: 1500, discount_percent: 15, services_limit: 10, status: 'active' }
      ])
    } else if (section === 'marketing') {
      localStorage.removeItem('salon_ai_db_campaigns')
      localStorage.removeItem('salon_ai_db_segments')
      localStorage.removeItem('salon_ai_db_coupons')
      saveMockTable('campaigns', [])
    } else if (section === 'demo') {
      localStorage.clear()
    }
  }
}



