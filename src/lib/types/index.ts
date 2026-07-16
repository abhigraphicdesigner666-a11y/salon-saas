// ==================== ENUMS ====================

export type UserRole = 'super_admin' | 'salon_owner' | 'manager' | 'receptionist' | 'stylist' | 'beautician' | 'accountant' | 'staff'

export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'wallet' | 'split' | 'bank_transfer'

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'partial'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partial'

export type MembershipStatus = 'active' | 'expired' | 'frozen' | 'cancelled'

export type CampaignType = 'sms' | 'whatsapp' | 'email' | 'push'

export type CampaignStatus = 'draft' | 'scheduled' | 'sent' | 'failed'

export type TenantPlan = 'free_trial' | 'starter' | 'professional' | 'enterprise'

export type TenantStatus = 'active' | 'suspended' | 'cancelled' | 'trial'

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say'

// ==================== CORE ENTITIES ====================

export interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  country: string
  logo_url?: string
  plan: TenantPlan
  status: TenantStatus
  settings: TenantSettings
  stripe_customer_id?: string
  razorpay_customer_id?: string
  trial_ends_at?: string
  created_at: string
  updated_at: string
}

export interface TenantSettings {
  currency: string
  timezone: string
  date_format: string
  gst_number?: string
  default_tax_percent: number
  booking_advance_days: number
  cancellation_hours: number
  auto_confirm_bookings: boolean
  send_reminders: boolean
  business_hours: BusinessHours[]
}

export interface BusinessHours {
  day: number
  is_open: boolean
  open_time: string
  close_time: string
  break_start?: string
  break_end?: string
}

export interface User {
  id: string
  tenant_id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone: string
  avatar_url?: string
  is_active: boolean
  permissions: Record<string, boolean>
  created_at: string
  updated_at: string
}

// ==================== CUSTOMERS ====================

export interface Customer {
  id: string
  tenant_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  gender?: Gender
  date_of_birth?: string
  anniversary?: string
  address?: string
  city?: string
  notes?: string
  medical_notes?: string
  allergies: string[]
  preferences: CustomerPreferences
  referral_source?: string
  loyalty_points: number
  total_visits: number
  total_spent: number
  last_visit_at?: string
  profile_image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CustomerPreferences {
  favorite_services?: string[]
  preferred_staff?: string[]
  communication: 'sms' | 'whatsapp' | 'email' | 'all'
  preferred_time?: 'morning' | 'afternoon' | 'evening'
}

// ==================== SERVICES ====================

export interface ServiceCategory {
  id: string
  tenant_id: string
  name: string
  description?: string
  icon?: string
  sort_order: number
  is_active: boolean
  service_count?: number
  created_at: string
}

export interface Service {
  id: string
  tenant_id: string
  category_id: string
  category_name?: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  compare_price?: number
  tax_percent: number
  is_active: boolean
  is_online_bookable: boolean
  image_url?: string
  created_at: string
  updated_at: string
}

// ==================== STAFF ====================

export interface Staff {
  id: string
  tenant_id: string
  role: UserRole
  first_name: string
  last_name: string
  email: string
  phone: string
  avatar_url?: string
  commission_percent: number
  specializations: string[]
  bio?: string
  is_active: boolean
  rating: number
  total_appointments: number
  revenue_generated: number
  created_at: string
  updated_at: string
}

export interface StaffSchedule {
  id: string
  staff_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_working: boolean
}

export interface StaffLeave {
  id: string
  tenant_id: string
  staff_id: string
  staff_name: string
  start_date: string
  end_date: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  approved_by?: string
  created_at: string
}

// ==================== APPOINTMENTS ====================

export interface Appointment {
  id: string
  tenant_id: string
  customer_id: string
  customer_name: string
  customer_phone?: string
  customer_avatar?: string
  staff_id: string
  staff_name: string
  staff_avatar?: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  services: AppointmentService[]
  notes?: string
  total_amount: number
  discount_amount: number
  tax_amount: number
  final_amount: number
  cancellation_reason?: string
  source: 'walk_in' | 'online' | 'phone' | 'app'
  created_at: string
  updated_at: string
}

export interface AppointmentService {
  id: string
  appointment_id: string
  service_id: string
  service_name: string
  staff_id: string
  staff_name: string
  price: number
  discount: number
  duration_minutes: number
}

// ==================== BILLING ====================

export interface Invoice {
  id: string
  tenant_id: string
  invoice_number: string
  customer_id: string
  customer_name: string
  customer_phone?: string
  appointment_id?: string
  items: InvoiceItem[]
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  status: InvoiceStatus
  payment_method?: PaymentMethod
  due_date: string
  notes?: string
  gst_number?: string
  created_at: string
  updated_at: string
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  description: string
  quantity: number
  unit_price: number
  discount: number
  tax_percent: number
  total: number
  service_id?: string
  product_id?: string
}

export interface Payment {
  id: string
  tenant_id: string
  invoice_id: string
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  transaction_id?: string
  gateway: 'stripe' | 'razorpay' | 'cash' | 'manual'
  received_by: string
  created_at: string
}

// ==================== INVENTORY ====================

export interface Product {
  id: string
  tenant_id: string
  name: string
  description?: string
  sku: string
  barcode?: string
  category: string
  brand: string
  cost_price: number
  selling_price: number
  tax_percent: number
  stock_quantity: number
  min_stock_level: number
  expiry_date?: string
  image_url?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface InventoryTransaction {
  id: string
  tenant_id: string
  product_id: string
  product_name: string
  type: 'purchase' | 'sale' | 'adjustment' | 'transfer' | 'consumption'
  quantity: number
  unit_cost: number
  notes?: string
  created_by: string
  created_at: string
}

// ==================== MEMBERSHIPS & LOYALTY ====================

export interface MembershipPlan {
  id: string
  tenant_id: string
  name: string
  description: string
  price: number
  duration_days: number
  max_services: number
  discount_percent: number
  benefits: string[]
  is_active: boolean
  created_at: string
}

export interface CustomerMembership {
  id: string
  tenant_id: string
  customer_id: string
  customer_name: string
  plan_id: string
  plan_name: string
  start_date: string
  end_date: string
  status: MembershipStatus
  services_used: number
  max_services: number
  created_at: string
}

export interface LoyaltyTransaction {
  id: string
  tenant_id: string
  customer_id: string
  customer_name: string
  points: number
  type: 'earned' | 'redeemed' | 'expired' | 'bonus'
  description: string
  created_at: string
}

// ==================== MARKETING ====================

export interface Campaign {
  id: string
  tenant_id: string
  name: string
  type: CampaignType
  status: CampaignStatus
  subject: string
  content: string
  target_segment: string
  scheduled_at?: string
  sent_at?: string
  total_recipients: number
  total_delivered: number
  total_opened: number
  total_clicked: number
  created_by: string
  created_at: string
}

// ==================== REVIEWS ====================

export interface Review {
  id: string
  tenant_id: string
  customer_id: string
  customer_name: string
  customer_avatar?: string
  appointment_id?: string
  rating: number
  comment: string
  reply?: string
  replied_at?: string
  is_published: boolean
  created_at: string
}

// ==================== EXPENSES ====================

export interface Expense {
  id: string
  tenant_id: string
  category: string
  description: string
  amount: number
  date: string
  vendor?: string
  receipt_url?: string
  created_by: string
  created_at: string
}

// ==================== NOTIFICATIONS ====================

export interface Notification {
  id: string
  tenant_id: string
  user_id?: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'payment' | 'marketing'
  is_read: boolean
  action_url?: string
  created_at: string
}

// ==================== AUDIT ====================

export interface AuditLog {
  id: string
  tenant_id: string
  user_id: string
  user_name: string
  action: string
  entity_type: string
  entity_id: string
  old_values?: Record<string, unknown>
  new_values?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// ==================== AI ====================

export type AIInsightType = 'revenue_forecast' | 'churn_prediction' | 'inventory_alert' | 'marketing_suggestion' | 'performance_analysis' | 'scheduling_optimization'

export interface AIInsight {
  id: string
  tenant_id: string
  type: AIInsightType
  title: string
  description: string
  data: Record<string, unknown>
  priority: 'low' | 'medium' | 'high' | 'critical'
  is_read: boolean
  is_dismissed: boolean
  created_at: string
  expires_at?: string
}

export interface AIChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  actions?: AIAction[]
}

export interface AIAction {
  label: string
  type: 'report' | 'campaign' | 'schedule' | 'navigate'
  data?: Record<string, unknown>
}

// ==================== SUBSCRIPTIONS ====================

export interface Subscription {
  id: string
  tenant_id: string
  plan: TenantPlan
  status: 'active' | 'past_due' | 'cancelled' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at?: string
  stripe_subscription_id?: string
  razorpay_subscription_id?: string
  amount: number
  currency: string
  created_at: string
  updated_at: string
}

// ==================== DASHBOARD ====================

export interface DashboardStats {
  today_revenue: number
  today_appointments: number
  active_customers: number
  pending_payments: number
  revenue_change: number
  appointments_change: number
  customers_change: number
  in_progress_count: number
  no_show_count: number
  pending_invoice_count: number
}

export interface RevenueDataPoint {
  month: string
  revenue: number
  appointments: number
  customers: number
}

// ==================== API RESPONSE ====================

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface PaginationParams {
  page: number
  per_page: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  search?: string
  filters?: Record<string, string>
}
