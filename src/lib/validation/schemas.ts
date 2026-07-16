import * as z from 'zod'

export const customerSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().optional(),
  email: z.string().email('Invalid email address').or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  date_of_birth: z.string().optional(),
  anniversary: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  notes: z.string().optional(),
  medical_notes: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  referral_source: z.string().optional(),
})

export const serviceSchema = z.object({
  name: z.string().min(2, 'Service name must be at least 2 characters'),
  category_id: z.string().uuid('Please select a valid category'),
  description: z.string().optional(),
  duration_minutes: z.number().min(5, 'Duration must be at least 5 minutes'),
  price: z.number().min(0, 'Price must be a positive number'),
  compare_price: z.number().optional(),
  tax_percent: z.number().min(0).max(100).default(18),
  is_online_bookable: z.boolean().default(true),
  image_url: z.string().url().or(z.literal('')).optional(),
})

export const appointmentSchema = z.object({
  customer_id: z.string().uuid('Please select a customer'),
  staff_id: z.string().uuid('Please select a staff member'),
  start_time: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid start time' }),
  end_time: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid end time' }),
  services: z.array(z.object({
    service_id: z.string().uuid(),
    staff_id: z.string().uuid(),
    price: z.number(),
    duration_minutes: z.number(),
  })).min(1, 'Please select at least one service'),
  notes: z.string().optional(),
  source: z.enum(['walk_in', 'online', 'phone', 'app']).default('walk_in'),
})

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(3, 'SKU must be at least 3 characters'),
  barcode: z.string().optional(),
  category: z.string().min(1, 'Please specify a category'),
  brand: z.string().min(1, 'Please specify a brand'),
  cost_price: z.number().min(0, 'Cost price must be positive'),
  selling_price: z.number().min(0, 'Selling price must be positive'),
  tax_percent: z.number().min(0).max(100).default(18),
  stock_quantity: z.number().int().min(0, 'Stock cannot be negative'),
  min_stock_level: z.number().int().min(0, 'Minimum stock must be positive'),
  expiry_date: z.string().optional(),
  description: z.string().optional(),
})

export const membershipPlanSchema = z.object({
  name: z.string().min(2, 'Plan name must be at least 2 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.number().min(0, 'Price must be positive'),
  duration_days: z.number().int().min(1, 'Duration must be at least 1 day'),
  max_services: z.number().int().optional(),
  discount_percent: z.number().min(0).max(100).default(0),
  benefits: z.array(z.string()).default([]),
})

export const invoiceSchema = z.object({
  customer_id: z.string().uuid('Please select a customer'),
  appointment_id: z.string().uuid().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    unit_price: z.number(),
    discount: z.number().default(0),
    tax_percent: z.number().default(18),
    service_id: z.string().uuid().optional(),
    product_id: z.string().uuid().optional(),
  })).min(1, 'Invoice must contain at least one item'),
  notes: z.string().optional(),
  payment_method: z.enum(['cash', 'card', 'upi', 'wallet', 'split', 'bank_transfer']).optional(),
  gst_number: z.string().optional(),
})

export const campaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  type: z.enum(['sms', 'whatsapp', 'email', 'push']),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  target_segment: z.string().min(1, 'Please specify a target segment'),
  scheduled_at: z.string().optional(),
})

export const settingsSchema = z.object({
  name: z.string().min(2, 'Salon name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().default('India'),
  settings: z.object({
    currency: z.string().default('INR'),
    timezone: z.string().default('Asia/Kolkata'),
    date_format: z.string().default('DD/MM/YYYY'),
    gst_number: z.string().optional(),
    default_tax_percent: z.number().min(0).max(100).default(18),
    booking_advance_days: z.number().int().default(30),
    cancellation_hours: z.number().int().default(4),
    auto_confirm_bookings: z.boolean().default(false),
    send_reminders: z.boolean().default(true),
  })
})

export const staffSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().optional(),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['manager', 'receptionist', 'stylist', 'beautician', 'accountant', 'staff']),
  commission_percent: z.number().min(0).max(100).default(0),
  specializations: z.array(z.string()).default([]),
  bio: z.string().optional(),
})
