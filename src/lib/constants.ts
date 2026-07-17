import { Scissors, Calendar, Users, CreditCard, BarChart3, Settings, Package, Megaphone, Bot, ShoppingBag, Star, FileText, Building2, UserCog, Activity, Flag, BookOpen, Shield, Layers, Clock, Gift, ShieldAlert } from 'lucide-react'

export const APP_NAME = 'SalonAI'
export const APP_DESCRIPTION = 'AI-Powered Salon Management Platform'
export const APP_VERSION = '1.0.0'
export const APP_URL = 'https://salonai.app'

export const DEMO_MODE = true

export const DEMO_CREDENTIALS = {
  email: 'owner@glamstyle.in',
  password: 'demo123456',
}

export const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee' },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar' },
}

export const DEFAULT_PAGINATION = {
  page: 1,
  per_page: 10,
}

export const DASHBOARD_NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: BarChart3 },
  { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { label: 'Customers', href: '/dashboard/customers', icon: Users },
  { label: 'Services', href: '/dashboard/services', icon: Scissors },
  { label: 'Staff', href: '/dashboard/staff', icon: UserCog },
  { label: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { label: 'Inventory', href: '/dashboard/inventory', icon: ShoppingBag },
  { label: 'Marketing', href: '/dashboard/marketing', icon: Megaphone },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
  { label: 'AI Assistant', href: '/dashboard/ai-assistant', icon: Bot },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export const DASHBOARD_NAV_GROUPS = [
  {
    group: 'Dashboard',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: BarChart3, permission: 'dashboard' }
    ]
  },
  {
    group: 'Operations',
    items: [
      { label: 'Calendar', href: '/dashboard/appointments?view=calendar', icon: Calendar, permission: 'appointments' },
      { label: 'Appointments', href: '/dashboard/appointments', icon: Clock, permission: 'appointments' },
      { label: 'Customers', href: '/dashboard/customers', icon: Users, permission: 'customers' },
      { label: 'POS', href: '/dashboard/billing', icon: CreditCard, permission: 'billing' }
    ]
  },
  {
    group: 'Management',
    items: [
      { label: 'Staff', href: '/dashboard/staff', icon: UserCog, permission: 'staff_management' },
      { label: 'Services', href: '/dashboard/services', icon: Scissors, permission: 'services' },
      { label: 'Inventory', href: '/dashboard/inventory', icon: ShoppingBag, permission: 'inventory' }
    ]
  },
  {
    group: 'Growth',
    items: [
      { label: 'Marketing', href: '/dashboard/marketing', icon: Megaphone, permission: 'marketing' },
      { label: 'Memberships', href: '/dashboard/customers?tab=memberships', icon: Star, permission: 'customers' },
      { label: 'Loyalty', href: '/dashboard/customers?tab=loyalty', icon: Gift, permission: 'customers' }
    ]
  },
  {
    group: 'Insights',
    items: [
      { label: 'Growth & Strategy', href: '/dashboard/ai-assistant', icon: Bot, permission: 'dashboard' },
      { label: 'Reports', href: '/dashboard/reports', icon: FileText, permission: 'reports' }
    ]
  },
  {
    group: 'Administration',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, permission: 'settings' }
    ]
  }
]

export const ADMIN_NAV = [
  { label: 'Dashboard', href: '/admin', icon: BarChart3 },
  { label: 'Salons', href: '/admin/salons', icon: Building2 },
  { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Analytics', href: '/admin/analytics', icon: Activity },
  { label: 'Feature Flags', href: '/admin/feature-flags', icon: Flag },
  { label: 'CMS', href: '/admin/cms', icon: BookOpen },
  { label: 'Audit Logs', href: '/admin/audit', icon: Shield },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
]

export const PORTAL_NAV = [
  { label: 'Book Now', href: '/portal/book', icon: Calendar },
  { label: 'My Bookings', href: '/portal/appointments', icon: Layers },
  { label: 'Loyalty', href: '/portal/loyalty', icon: Star },
  { label: 'Profile', href: '/portal/profile', icon: Users },
]

export const MARKETING_NAV = [
  { label: 'Features', href: '/features' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Blog', href: '/blog' },
  { label: 'Contact', href: '/contact' },
]

export const APPOINTMENT_STATUSES = [
  { value: 'scheduled', label: 'Scheduled', color: 'blue' },
  { value: 'confirmed', label: 'Confirmed', color: 'emerald' },
  { value: 'in_progress', label: 'In Progress', color: 'amber' },
  { value: 'completed', label: 'Completed', color: 'green' },
  { value: 'cancelled', label: 'Cancelled', color: 'red' },
  { value: 'no_show', label: 'No Show', color: 'gray' },
] as const

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'split', label: 'Split Payment' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
] as const

export const CHART_COLORS = [
  '#7c3aed', '#a855f7', '#ec4899', '#f59e0b', '#14b8a6',
  '#3b82f6', '#ef4444', '#22c55e', '#f97316', '#6366f1',
]

export const USER_ROLES = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full platform access' },
  { value: 'salon_owner', label: 'Salon Owner', description: 'Full salon access' },
  { value: 'manager', label: 'Manager', description: 'Manage staff and operations' },
  { value: 'receptionist', label: 'Receptionist', description: 'Appointments and billing' },
  { value: 'stylist', label: 'Stylist', description: 'View own appointments' },
  { value: 'beautician', label: 'Beautician', description: 'View own appointments' },
  { value: 'accountant', label: 'Accountant', description: 'Billing and reports' },
  { value: 'staff', label: 'Staff', description: 'Basic access' },
] as const

export const SUBSCRIPTION_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price_monthly: 999,
    price_yearly: 9590,
    description: 'Perfect for small salons just getting started',
    features: [
      'Up to 3 staff members',
      '100 appointments/month',
      'Basic CRM',
      'Invoice generation',
      'Email support',
      'Basic reports',
    ],
    limits: { staff: 3, appointments: 100, branches: 1 },
  },
  {
    id: 'professional',
    name: 'Professional',
    price_monthly: 2499,
    price_yearly: 23990,
    description: 'For growing salons that need more power',
    popular: true,
    features: [
      'Up to 15 staff members',
      'Unlimited appointments',
      'Advanced CRM',
      'AI Insights',
      'Marketing automation',
      'Inventory management',
      'Custom reports',
      'Priority support',
      'Multi-branch (up to 3)',
      'Stripe & Razorpay',
    ],
    limits: { staff: 15, appointments: -1, branches: 3 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 4999,
    price_yearly: 47990,
    description: 'For large salon chains and franchises',
    features: [
      'Unlimited staff',
      'Unlimited appointments',
      'Full AI Suite',
      'Advanced marketing',
      'Inventory management',
      'Custom reports & analytics',
      'Dedicated support',
      'Unlimited branches',
      'API access',
      'White-label option',
      'Custom integrations',
      'SLA guarantee',
    ],
    limits: { staff: -1, appointments: -1, branches: -1 },
  },
] as const

export const ROLE_PERMISSIONS = {
  dashboard: { super_admin: true, salon_owner: true, manager: true, receptionist: true, stylist: false, beautician: false, accountant: true, staff: false },
  appointments: { super_admin: true, salon_owner: true, manager: true, receptionist: true, stylist: true, beautician: true, accountant: false, staff: false },
  customers: { super_admin: true, salon_owner: true, manager: true, receptionist: true, stylist: false, beautician: false, accountant: false, staff: false },
  services: { super_admin: true, salon_owner: true, manager: true, receptionist: false, stylist: false, beautician: false, accountant: false, staff: false },
  staff_management: { super_admin: true, salon_owner: true, manager: true, receptionist: false, stylist: false, beautician: false, accountant: false, staff: false },
  billing: { super_admin: true, salon_owner: true, manager: true, receptionist: true, stylist: false, beautician: false, accountant: true, staff: false },
  inventory: { super_admin: true, salon_owner: true, manager: true, receptionist: false, stylist: false, beautician: false, accountant: false, staff: false },
  marketing: { super_admin: true, salon_owner: true, manager: true, receptionist: false, stylist: false, beautician: false, accountant: false, staff: false },
  reports: { super_admin: true, salon_owner: true, manager: true, receptionist: false, stylist: false, beautician: false, accountant: true, staff: false },
  settings: { super_admin: true, salon_owner: true, manager: false, receptionist: false, stylist: false, beautician: false, accountant: false, staff: false },
} as const
