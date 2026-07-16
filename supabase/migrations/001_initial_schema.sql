-- ============================================================================
-- AI SALON MANAGEMENT SAAS - INITIAL DATABASE SCHEMA
-- Version: 1.0.0
-- Description: Complete multi-tenant PostgreSQL schema with RLS policies,
--              indexes, and seed data for an AI-powered salon management platform.
-- ============================================================================

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
CREATE TYPE user_role AS ENUM (
  'super_admin', 'salon_owner', 'manager', 'receptionist',
  'stylist', 'beautician', 'accountant', 'staff'
);

CREATE TYPE appointment_status AS ENUM (
  'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);

CREATE TYPE payment_method AS ENUM (
  'cash', 'card', 'upi', 'wallet', 'split', 'bank_transfer'
);

CREATE TYPE payment_status AS ENUM (
  'pending', 'completed', 'failed', 'refunded', 'partial'
);

CREATE TYPE invoice_status AS ENUM (
  'draft', 'sent', 'paid', 'overdue', 'cancelled', 'partial'
);

CREATE TYPE membership_status AS ENUM (
  'active', 'expired', 'frozen', 'cancelled'
);

CREATE TYPE campaign_type AS ENUM (
  'sms', 'whatsapp', 'email', 'push'
);

CREATE TYPE campaign_status AS ENUM (
  'draft', 'scheduled', 'sent', 'failed'
);

CREATE TYPE tenant_plan AS ENUM (
  'free_trial', 'starter', 'professional', 'enterprise'
);

CREATE TYPE tenant_status AS ENUM (
  'active', 'suspended', 'cancelled', 'trial'
);

CREATE TYPE subscription_status AS ENUM (
  'active', 'past_due', 'cancelled', 'trialing'
);

CREATE TYPE gender_type AS ENUM (
  'male', 'female', 'other', 'prefer_not_to_say'
);

-- ============================================================================
-- TABLE 1: TENANTS
-- ============================================================================
CREATE TABLE tenants (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                  VARCHAR(255) NOT NULL,
  slug                  VARCHAR(100) NOT NULL UNIQUE,
  email                 VARCHAR(255) NOT NULL,
  phone                 VARCHAR(20),
  address               TEXT,
  city                  VARCHAR(100),
  state                 VARCHAR(100),
  country               VARCHAR(100) DEFAULT 'India',
  logo_url              TEXT,
  plan                  tenant_plan NOT NULL DEFAULT 'free_trial',
  status                tenant_status NOT NULL DEFAULT 'trial',
  settings              JSONB DEFAULT '{
    "currency": "INR",
    "timezone": "Asia/Kolkata",
    "date_format": "DD/MM/YYYY",
    "time_format": "12h",
    "booking_advance_days": 30,
    "cancellation_hours": 4,
    "auto_confirm_bookings": false,
    "sms_notifications": true,
    "whatsapp_notifications": true,
    "loyalty_enabled": true,
    "points_per_100": 5,
    "gst_number": null,
    "gst_percent": 18
  }'::jsonb,
  subscription_id       UUID,
  stripe_customer_id    VARCHAR(255),
  razorpay_customer_id  VARCHAR(255),
  trial_ends_at         TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 2: PROFILES (linked to Supabase auth.users)
-- ============================================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role            user_role NOT NULL DEFAULT 'staff',
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100),
  email           VARCHAR(255),
  phone           VARCHAR(20),
  avatar_url      TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  permissions     JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 3: CUSTOMERS
-- ============================================================================
CREATE TABLE customers (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100),
  email             VARCHAR(255),
  phone             VARCHAR(20) NOT NULL,
  gender            gender_type,
  date_of_birth     DATE,
  anniversary       DATE,
  address           TEXT,
  city              VARCHAR(100),
  notes             TEXT,
  medical_notes     TEXT,
  allergies         TEXT[] DEFAULT '{}',
  preferences       JSONB DEFAULT '{}'::jsonb,
  referral_source   VARCHAR(100),
  loyalty_points    INTEGER NOT NULL DEFAULT 0,
  total_visits      INTEGER NOT NULL DEFAULT 0,
  total_spent       DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  last_visit_at     TIMESTAMPTZ,
  profile_image_url TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 4: SERVICE CATEGORIES
-- ============================================================================
CREATE TABLE service_categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  icon        VARCHAR(50),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 5: SERVICES
-- ============================================================================
CREATE TABLE services (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id         UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
  name                VARCHAR(200) NOT NULL,
  description         TEXT,
  duration_minutes    INTEGER NOT NULL DEFAULT 30,
  price               DECIMAL(10, 2) NOT NULL,
  compare_price       DECIMAL(10, 2),
  tax_percent         DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  is_active           BOOLEAN NOT NULL DEFAULT TRUE,
  is_online_bookable  BOOLEAN NOT NULL DEFAULT TRUE,
  image_url           TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 6: STAFF SERVICES (many-to-many with commission)
-- ============================================================================
CREATE TABLE staff_services (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id          UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  commission_percent  DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(staff_id, service_id)
);

-- ============================================================================
-- TABLE 7: STAFF SCHEDULES
-- ============================================================================
CREATE TABLE staff_schedules (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time  TIME NOT NULL DEFAULT '09:00',
  end_time    TIME NOT NULL DEFAULT '19:00',
  is_working  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(staff_id, day_of_week)
);

-- ============================================================================
-- TABLE 8: STAFF LEAVES
-- ============================================================================
CREATE TABLE staff_leaves (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  staff_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL,
  reason      TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 9: APPOINTMENTS
-- ============================================================================
CREATE TABLE appointments (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  staff_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  start_time            TIMESTAMPTZ NOT NULL,
  end_time              TIMESTAMPTZ NOT NULL,
  status                appointment_status NOT NULL DEFAULT 'scheduled',
  notes                 TEXT,
  total_amount          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_amount       DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_amount            DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  final_amount          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  cancellation_reason   TEXT,
  cancelled_by          UUID REFERENCES profiles(id),
  source                VARCHAR(20) NOT NULL DEFAULT 'walk_in' CHECK (source IN ('walk_in', 'online', 'phone', 'app')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 10: APPOINTMENT SERVICES
-- ============================================================================
CREATE TABLE appointment_services (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  appointment_id    UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id        UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  staff_id          UUID REFERENCES profiles(id) ON DELETE SET NULL,
  price             DECIMAL(10, 2) NOT NULL,
  discount          DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  duration_minutes  INTEGER NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 11: INVOICES
-- ============================================================================
CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number    VARCHAR(50) NOT NULL,
  customer_id       UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES appointments(id) ON DELETE SET NULL,
  subtotal          DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  discount_amount   DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  tax_amount        DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_amount      DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status            invoice_status NOT NULL DEFAULT 'draft',
  due_date          DATE,
  notes             TEXT,
  gst_number        VARCHAR(20),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, invoice_number)
);

-- ============================================================================
-- TABLE 12: INVOICE ITEMS
-- ============================================================================
CREATE TABLE invoice_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id    UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description   VARCHAR(255) NOT NULL,
  quantity      INTEGER NOT NULL DEFAULT 1,
  unit_price    DECIMAL(10, 2) NOT NULL,
  discount      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_percent   DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  total         DECIMAL(10, 2) NOT NULL,
  service_id    UUID REFERENCES services(id) ON DELETE SET NULL,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 13: PAYMENTS
-- ============================================================================
CREATE TABLE payments (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id        UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount            DECIMAL(12, 2) NOT NULL,
  payment_method    payment_method NOT NULL DEFAULT 'cash',
  status            payment_status NOT NULL DEFAULT 'pending',
  transaction_id    VARCHAR(255),
  gateway           VARCHAR(50) CHECK (gateway IN ('stripe', 'razorpay', 'cash', 'manual')),
  gateway_response  JSONB DEFAULT '{}'::jsonb,
  received_by       UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 14: PRODUCTS
-- ============================================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  sku             VARCHAR(50),
  barcode         VARCHAR(50),
  category        VARCHAR(100),
  brand           VARCHAR(100),
  cost_price      DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  selling_price   DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_percent     DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
  stock_quantity  INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 5,
  expiry_date     DATE,
  image_url       TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 15: INVENTORY TRANSACTIONS
-- ============================================================================
CREATE TABLE inventory_transactions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type          VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'sale', 'adjustment', 'transfer', 'consumption')),
  quantity      INTEGER NOT NULL,
  unit_cost     DECIMAL(10, 2),
  reference_id  UUID,
  notes         TEXT,
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 16: SUPPLIERS
-- ============================================================================
CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name            VARCHAR(200) NOT NULL,
  email           VARCHAR(255),
  phone           VARCHAR(20),
  address         TEXT,
  gst_number      VARCHAR(20),
  contact_person  VARCHAR(200),
  payment_terms   VARCHAR(100),
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 17: PURCHASE ORDERS
-- ============================================================================
CREATE TABLE purchase_orders (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  supplier_id   UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  order_number  VARCHAR(50) NOT NULL,
  total_amount  DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  status        VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'ordered', 'received', 'cancelled')),
  notes         TEXT,
  ordered_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  received_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 18: MEMBERSHIP PLANS
-- ============================================================================
CREATE TABLE membership_plans (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              VARCHAR(100) NOT NULL,
  description       TEXT,
  price             DECIMAL(10, 2) NOT NULL,
  duration_days     INTEGER NOT NULL DEFAULT 365,
  max_services      INTEGER,
  discount_percent  DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  benefits          JSONB DEFAULT '[]'::jsonb,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 19: CUSTOMER MEMBERSHIPS
-- ============================================================================
CREATE TABLE customer_memberships (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  plan_id         UUID NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  start_date      DATE NOT NULL,
  end_date        DATE NOT NULL,
  status          membership_status NOT NULL DEFAULT 'active',
  services_used   INTEGER NOT NULL DEFAULT 0,
  frozen_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 20: LOYALTY TRANSACTIONS
-- ============================================================================
CREATE TABLE loyalty_transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  points          INTEGER NOT NULL,
  type            VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'bonus')),
  reference_type  VARCHAR(50),
  reference_id    UUID,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 21: CAMPAIGNS
-- ============================================================================
CREATE TABLE campaigns (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name              VARCHAR(200) NOT NULL,
  type              campaign_type NOT NULL DEFAULT 'sms',
  status            campaign_status NOT NULL DEFAULT 'draft',
  subject           VARCHAR(255),
  content           TEXT,
  target_segment    JSONB DEFAULT '{}'::jsonb,
  scheduled_at      TIMESTAMPTZ,
  sent_at           TIMESTAMPTZ,
  total_recipients  INTEGER NOT NULL DEFAULT 0,
  total_delivered   INTEGER NOT NULL DEFAULT 0,
  total_opened      INTEGER NOT NULL DEFAULT 0,
  total_clicked     INTEGER NOT NULL DEFAULT 0,
  created_by        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 22: REVIEWS
-- ============================================================================
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  rating          INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment         TEXT,
  reply           TEXT,
  replied_at      TIMESTAMPTZ,
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 23: EXPENSES
-- ============================================================================
CREATE TABLE expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category      VARCHAR(100) NOT NULL,
  description   TEXT,
  amount        DECIMAL(12, 2) NOT NULL,
  date          DATE NOT NULL DEFAULT CURRENT_DATE,
  vendor        VARCHAR(200),
  receipt_url   TEXT,
  approved_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 24: NOTIFICATIONS
-- ============================================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title       VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  type        VARCHAR(50) NOT NULL DEFAULT 'info',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 25: AUDIT LOGS
-- ============================================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 26: AI INSIGHTS
-- ============================================================================
CREATE TABLE ai_insights (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type        VARCHAR(50) NOT NULL CHECK (type IN (
    'revenue_forecast', 'churn_prediction', 'inventory_alert',
    'marketing_suggestion', 'performance_analysis', 'scheduling_optimization'
  )),
  title       VARCHAR(255) NOT NULL,
  description TEXT,
  data        JSONB DEFAULT '{}'::jsonb,
  priority    VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  is_dismissed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ
);

-- ============================================================================
-- TABLE 27: SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE subscriptions (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan                      tenant_plan NOT NULL DEFAULT 'free_trial',
  status                    subscription_status NOT NULL DEFAULT 'trialing',
  current_period_start      TIMESTAMPTZ,
  current_period_end        TIMESTAMPTZ,
  cancel_at                 TIMESTAMPTZ,
  stripe_subscription_id    VARCHAR(255),
  razorpay_subscription_id  VARCHAR(255),
  amount                    DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  currency                  VARCHAR(3) NOT NULL DEFAULT 'INR',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 28: BRANCHES
-- ============================================================================
CREATE TABLE branches (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  city        VARCHAR(100),
  phone       VARCHAR(20),
  manager_id  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 29: GIFT CARDS
-- ============================================================================
CREATE TABLE gift_cards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code            VARCHAR(20) NOT NULL UNIQUE,
  initial_amount  DECIMAL(10, 2) NOT NULL,
  balance         DECIMAL(10, 2) NOT NULL,
  customer_id     UUID REFERENCES customers(id) ON DELETE SET NULL,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- TABLE 30: CONSENT FORMS
-- ============================================================================
CREATE TABLE consent_forms (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id   UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  form_type     VARCHAR(100) NOT NULL,
  content       JSONB NOT NULL DEFAULT '{}'::jsonb,
  signed_at     TIMESTAMPTZ,
  signature_url TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Tenant isolation indexes (on every table with tenant_id)
CREATE INDEX idx_profiles_tenant              ON profiles(tenant_id);
CREATE INDEX idx_customers_tenant             ON customers(tenant_id);
CREATE INDEX idx_service_categories_tenant    ON service_categories(tenant_id);
CREATE INDEX idx_services_tenant              ON services(tenant_id);
CREATE INDEX idx_staff_schedules_tenant       ON staff_schedules(tenant_id);
CREATE INDEX idx_staff_leaves_tenant          ON staff_leaves(tenant_id);
CREATE INDEX idx_appointments_tenant          ON appointments(tenant_id);
CREATE INDEX idx_invoices_tenant              ON invoices(tenant_id);
CREATE INDEX idx_payments_tenant              ON payments(tenant_id);
CREATE INDEX idx_products_tenant              ON products(tenant_id);
CREATE INDEX idx_inventory_transactions_tenant ON inventory_transactions(tenant_id);
CREATE INDEX idx_suppliers_tenant             ON suppliers(tenant_id);
CREATE INDEX idx_purchase_orders_tenant       ON purchase_orders(tenant_id);
CREATE INDEX idx_membership_plans_tenant      ON membership_plans(tenant_id);
CREATE INDEX idx_customer_memberships_tenant  ON customer_memberships(tenant_id);
CREATE INDEX idx_loyalty_transactions_tenant  ON loyalty_transactions(tenant_id);
CREATE INDEX idx_campaigns_tenant             ON campaigns(tenant_id);
CREATE INDEX idx_reviews_tenant               ON reviews(tenant_id);
CREATE INDEX idx_expenses_tenant              ON expenses(tenant_id);
CREATE INDEX idx_notifications_tenant         ON notifications(tenant_id);
CREATE INDEX idx_audit_logs_tenant            ON audit_logs(tenant_id);
CREATE INDEX idx_ai_insights_tenant           ON ai_insights(tenant_id);
CREATE INDEX idx_subscriptions_tenant         ON subscriptions(tenant_id);
CREATE INDEX idx_branches_tenant              ON branches(tenant_id);
CREATE INDEX idx_gift_cards_tenant            ON gift_cards(tenant_id);
CREATE INDEX idx_consent_forms_tenant         ON consent_forms(tenant_id);

-- Composite and frequently queried indexes
CREATE INDEX idx_customers_tenant_email       ON customers(tenant_id, email);
CREATE INDEX idx_customers_tenant_phone       ON customers(tenant_id, phone);
CREATE INDEX idx_customers_tenant_active      ON customers(tenant_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_appointments_tenant_start    ON appointments(tenant_id, start_time);
CREATE INDEX idx_appointments_tenant_status   ON appointments(tenant_id, status);
CREATE INDEX idx_appointments_customer        ON appointments(customer_id);
CREATE INDEX idx_appointments_staff           ON appointments(staff_id);
CREATE INDEX idx_appointments_start_time      ON appointments(start_time DESC);

CREATE INDEX idx_services_category            ON services(category_id);
CREATE INDEX idx_services_tenant_active       ON services(tenant_id, is_active) WHERE is_active = TRUE;

CREATE INDEX idx_invoices_customer            ON invoices(customer_id);
CREATE INDEX idx_invoices_status              ON invoices(tenant_id, status);

CREATE INDEX idx_payments_invoice             ON payments(invoice_id);
CREATE INDEX idx_payments_status              ON payments(tenant_id, status);

CREATE INDEX idx_products_tenant_sku          ON products(tenant_id, sku);
CREATE INDEX idx_products_tenant_active       ON products(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_low_stock           ON products(tenant_id, stock_quantity) WHERE stock_quantity <= min_stock_level;

CREATE INDEX idx_notifications_user_unread    ON notifications(user_id, is_read) WHERE is_read = FALSE;

CREATE INDEX idx_audit_logs_entity            ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_created           ON audit_logs(created_at DESC);

CREATE INDEX idx_ai_insights_unread           ON ai_insights(tenant_id, is_read) WHERE is_read = FALSE AND is_dismissed = FALSE;

CREATE INDEX idx_reviews_tenant_published     ON reviews(tenant_id, is_published) WHERE is_published = TRUE;

CREATE INDEX idx_staff_services_staff         ON staff_services(staff_id);
CREATE INDEX idx_staff_services_service       ON staff_services(service_id);

CREATE INDEX idx_customer_memberships_customer ON customer_memberships(customer_id);
CREATE INDEX idx_customer_memberships_active  ON customer_memberships(tenant_id, status) WHERE status = 'active';

CREATE INDEX idx_loyalty_transactions_customer ON loyalty_transactions(customer_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Helper function: get the tenant_id from the JWT
CREATE OR REPLACE FUNCTION get_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Helper function: check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Enable RLS on every table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenants
CREATE POLICY tenants_select ON tenants FOR SELECT USING (
  is_super_admin() OR id = get_tenant_id()
);
CREATE POLICY tenants_insert ON tenants FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY tenants_update ON tenants FOR UPDATE USING (
  is_super_admin() OR id = get_tenant_id()
);
CREATE POLICY tenants_delete ON tenants FOR DELETE USING (is_super_admin());

-- Generic tenant-isolation policies macro
-- We create policies for each table that has tenant_id

-- Profiles
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY profiles_delete ON profiles FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Customers
CREATE POLICY customers_select ON customers FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY customers_insert ON customers FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY customers_update ON customers FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY customers_delete ON customers FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Service Categories
CREATE POLICY service_categories_select ON service_categories FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY service_categories_insert ON service_categories FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY service_categories_update ON service_categories FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY service_categories_delete ON service_categories FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Services
CREATE POLICY services_select ON services FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY services_insert ON services FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY services_update ON services FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY services_delete ON services FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Staff Services (uses join through staff -> profile -> tenant)
CREATE POLICY staff_services_select ON staff_services FOR SELECT USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = staff_services.staff_id AND profiles.tenant_id = get_tenant_id()
  )
);
CREATE POLICY staff_services_insert ON staff_services FOR INSERT WITH CHECK (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = staff_services.staff_id AND profiles.tenant_id = get_tenant_id()
  )
);
CREATE POLICY staff_services_update ON staff_services FOR UPDATE USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = staff_services.staff_id AND profiles.tenant_id = get_tenant_id()
  )
);
CREATE POLICY staff_services_delete ON staff_services FOR DELETE USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM profiles WHERE profiles.id = staff_services.staff_id AND profiles.tenant_id = get_tenant_id()
  )
);

-- Staff Schedules
CREATE POLICY staff_schedules_select ON staff_schedules FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY staff_schedules_insert ON staff_schedules FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY staff_schedules_update ON staff_schedules FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY staff_schedules_delete ON staff_schedules FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Staff Leaves
CREATE POLICY staff_leaves_select ON staff_leaves FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY staff_leaves_insert ON staff_leaves FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY staff_leaves_update ON staff_leaves FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY staff_leaves_delete ON staff_leaves FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Appointments
CREATE POLICY appointments_select ON appointments FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY appointments_insert ON appointments FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY appointments_update ON appointments FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY appointments_delete ON appointments FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Appointment Services (via appointment -> tenant)
CREATE POLICY appointment_services_select ON appointment_services FOR SELECT USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM appointments WHERE appointments.id = appointment_services.appointment_id AND appointments.tenant_id = get_tenant_id()
  )
);
CREATE POLICY appointment_services_insert ON appointment_services FOR INSERT WITH CHECK (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM appointments WHERE appointments.id = appointment_services.appointment_id AND appointments.tenant_id = get_tenant_id()
  )
);
CREATE POLICY appointment_services_update ON appointment_services FOR UPDATE USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM appointments WHERE appointments.id = appointment_services.appointment_id AND appointments.tenant_id = get_tenant_id()
  )
);
CREATE POLICY appointment_services_delete ON appointment_services FOR DELETE USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM appointments WHERE appointments.id = appointment_services.appointment_id AND appointments.tenant_id = get_tenant_id()
  )
);

-- Invoices
CREATE POLICY invoices_select ON invoices FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY invoices_insert ON invoices FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY invoices_update ON invoices FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY invoices_delete ON invoices FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Invoice Items (via invoice -> tenant)
CREATE POLICY invoice_items_select ON invoice_items FOR SELECT USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.tenant_id = get_tenant_id()
  )
);
CREATE POLICY invoice_items_insert ON invoice_items FOR INSERT WITH CHECK (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.tenant_id = get_tenant_id()
  )
);
CREATE POLICY invoice_items_update ON invoice_items FOR UPDATE USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.tenant_id = get_tenant_id()
  )
);
CREATE POLICY invoice_items_delete ON invoice_items FOR DELETE USING (
  is_super_admin() OR EXISTS (
    SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.tenant_id = get_tenant_id()
  )
);

-- Payments
CREATE POLICY payments_select ON payments FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY payments_insert ON payments FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY payments_update ON payments FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY payments_delete ON payments FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Products
CREATE POLICY products_select ON products FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY products_insert ON products FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY products_update ON products FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY products_delete ON products FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Inventory Transactions
CREATE POLICY inventory_transactions_select ON inventory_transactions FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY inventory_transactions_insert ON inventory_transactions FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Suppliers
CREATE POLICY suppliers_select ON suppliers FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY suppliers_insert ON suppliers FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY suppliers_update ON suppliers FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY suppliers_delete ON suppliers FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Purchase Orders
CREATE POLICY purchase_orders_select ON purchase_orders FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY purchase_orders_insert ON purchase_orders FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY purchase_orders_update ON purchase_orders FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY purchase_orders_delete ON purchase_orders FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Membership Plans
CREATE POLICY membership_plans_select ON membership_plans FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY membership_plans_insert ON membership_plans FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY membership_plans_update ON membership_plans FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY membership_plans_delete ON membership_plans FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Customer Memberships
CREATE POLICY customer_memberships_select ON customer_memberships FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY customer_memberships_insert ON customer_memberships FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY customer_memberships_update ON customer_memberships FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY customer_memberships_delete ON customer_memberships FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Loyalty Transactions
CREATE POLICY loyalty_transactions_select ON loyalty_transactions FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY loyalty_transactions_insert ON loyalty_transactions FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Campaigns
CREATE POLICY campaigns_select ON campaigns FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY campaigns_insert ON campaigns FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY campaigns_update ON campaigns FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY campaigns_delete ON campaigns FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Reviews
CREATE POLICY reviews_select ON reviews FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY reviews_update ON reviews FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY reviews_delete ON reviews FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Expenses
CREATE POLICY expenses_select ON expenses FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY expenses_insert ON expenses FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY expenses_update ON expenses FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY expenses_delete ON expenses FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Notifications
CREATE POLICY notifications_select ON notifications FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY notifications_update ON notifications FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY notifications_delete ON notifications FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Audit Logs (insert + select only, no update/delete)
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- AI Insights
CREATE POLICY ai_insights_select ON ai_insights FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY ai_insights_insert ON ai_insights FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY ai_insights_update ON ai_insights FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Subscriptions
CREATE POLICY subscriptions_select ON subscriptions FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY subscriptions_insert ON subscriptions FOR INSERT WITH CHECK (is_super_admin());
CREATE POLICY subscriptions_update ON subscriptions FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Branches
CREATE POLICY branches_select ON branches FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY branches_insert ON branches FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY branches_update ON branches FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY branches_delete ON branches FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Gift Cards
CREATE POLICY gift_cards_select ON gift_cards FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY gift_cards_insert ON gift_cards FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY gift_cards_update ON gift_cards FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY gift_cards_delete ON gift_cards FOR DELETE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- Consent Forms
CREATE POLICY consent_forms_select ON consent_forms FOR SELECT USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY consent_forms_insert ON consent_forms FOR INSERT WITH CHECK (
  is_super_admin() OR tenant_id = get_tenant_id()
);
CREATE POLICY consent_forms_update ON consent_forms FOR UPDATE USING (
  is_super_admin() OR tenant_id = get_tenant_id()
);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Demo Tenant
INSERT INTO tenants (id, name, slug, email, phone, address, city, state, country, plan, status, trial_ends_at)
VALUES (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'GlamStyle Salon & Spa',
  'glamstyle-mumbai',
  'hello@glamstyle.in',
  '+919876543210',
  '42, Linking Road, Bandra West',
  'Mumbai',
  'Maharashtra',
  'India',
  'professional',
  'active',
  NOW() + INTERVAL '30 days'
);

-- Demo Subscription
INSERT INTO subscriptions (id, tenant_id, plan, status, current_period_start, current_period_end, amount, currency)
VALUES (
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'professional',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  2499.00,
  'INR'
);

-- Update tenant subscription_id
UPDATE tenants SET subscription_id = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22'
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- Branch
INSERT INTO branches (id, tenant_id, name, address, city, phone, is_active)
VALUES (
  'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380c33',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'GlamStyle - Bandra',
  '42, Linking Road, Bandra West',
  'Mumbai',
  '+919876543210',
  TRUE
);

-- ============================================================================
-- STAFF PROFILES (using fixed UUIDs for FK references)
-- Note: In production, these reference auth.users. For seeding, we insert directly.
-- ============================================================================
-- We need to create auth.users entries first (Supabase handles this, but for seed data we use direct UUIDs)

INSERT INTO profiles (id, tenant_id, role, first_name, last_name, email, phone, is_active) VALUES
  ('d3eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'salon_owner', 'Priya', 'Sharma', 'priya@glamstyle.in', '+919876543210', TRUE),
  ('d3eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'manager', 'Rahul', 'Verma', 'rahul@glamstyle.in', '+919876543211', TRUE),
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'stylist', 'Anjali', 'Patel', 'anjali@glamstyle.in', '+919876543212', TRUE),
  ('d3eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'beautician', 'Neha', 'Gupta', 'neha@glamstyle.in', '+919876543213', TRUE),
  ('d3eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'stylist', 'Vikram', 'Singh', 'vikram@glamstyle.in', '+919876543214', TRUE),
  ('d3eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'receptionist', 'Meera', 'Joshi', 'meera@glamstyle.in', '+919876543215', TRUE);

-- ============================================================================
-- CUSTOMERS (20 realistic Indian customers)
-- ============================================================================
INSERT INTO customers (id, tenant_id, first_name, last_name, email, phone, gender, date_of_birth, loyalty_points, total_visits, total_spent, referral_source, is_active) VALUES
  ('e4eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ananya', 'Deshmukh', 'ananya.d@gmail.com', '+919812345601', 'female', '1992-03-15', 450, 12, 28500.00, 'instagram', TRUE),
  ('e4eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ritu', 'Kapoor', 'ritu.k@gmail.com', '+919812345602', 'female', '1988-07-22', 820, 24, 62000.00, 'walk_in', TRUE),
  ('e4eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Arjun', 'Mehta', 'arjun.m@gmail.com', '+919812345603', 'male', '1990-11-08', 180, 6, 9800.00, 'google', TRUE),
  ('e4eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sneha', 'Iyer', 'sneha.i@gmail.com', '+919812345604', 'female', '1995-01-30', 350, 15, 42000.00, 'referral', TRUE),
  ('e4eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Karan', 'Malhotra', 'karan.m@gmail.com', '+919812345605', 'male', '1987-05-12', 90, 3, 4200.00, 'google', TRUE),
  ('e4eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Pooja', 'Nair', 'pooja.n@gmail.com', '+919812345606', 'female', '1993-09-25', 680, 20, 55000.00, 'facebook', TRUE),
  ('e4eebc99-0007-4ef8-bb6d-6bb9bd380007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Aditya', 'Rao', 'aditya.r@gmail.com', '+919812345607', 'male', '1991-12-03', 220, 8, 15600.00, 'walk_in', TRUE),
  ('e4eebc99-0008-4ef8-bb6d-6bb9bd380008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Divya', 'Kulkarni', 'divya.k@gmail.com', '+919812345608', 'female', '1996-04-18', 160, 5, 12500.00, 'instagram', TRUE),
  ('e4eebc99-0009-4ef8-bb6d-6bb9bd380009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rohit', 'Saxena', 'rohit.s@gmail.com', '+919812345609', 'male', '1985-08-07', 40, 2, 3200.00, 'google', TRUE),
  ('e4eebc99-0010-4ef8-bb6d-6bb9bd380010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Megha', 'Chatterjee', 'megha.c@gmail.com', '+919812345610', 'female', '1994-02-28', 540, 18, 48000.00, 'referral', TRUE),
  ('e4eebc99-0011-4ef8-bb6d-6bb9bd380011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Siddharth', 'Agarwal', 'sid.a@gmail.com', '+919812345611', 'male', '1989-06-14', 300, 10, 18500.00, 'walk_in', TRUE),
  ('e4eebc99-0012-4ef8-bb6d-6bb9bd380012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Ishita', 'Banerjee', 'ishita.b@gmail.com', '+919812345612', 'female', '1997-10-09', 120, 4, 8900.00, 'instagram', TRUE),
  ('e4eebc99-0013-4ef8-bb6d-6bb9bd380013', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Varun', 'Choudhary', 'varun.c@gmail.com', '+919812345613', 'male', '1992-01-21', 75, 3, 5200.00, 'google', TRUE),
  ('e4eebc99-0014-4ef8-bb6d-6bb9bd380014', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Tanvi', 'Reddy', 'tanvi.r@gmail.com', '+919812345614', 'female', '1990-07-03', 920, 28, 78000.00, 'referral', TRUE),
  ('e4eebc99-0015-4ef8-bb6d-6bb9bd380015', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nikhil', 'Jain', 'nikhil.j@gmail.com', '+919812345615', 'male', '1988-11-17', 200, 7, 12800.00, 'walk_in', TRUE),
  ('e4eebc99-0016-4ef8-bb6d-6bb9bd380016', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Swati', 'Pandey', 'swati.p@gmail.com', '+919812345616', 'female', '1995-05-29', 410, 14, 35000.00, 'facebook', TRUE),
  ('e4eebc99-0017-4ef8-bb6d-6bb9bd380017', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Amit', 'Thakur', 'amit.t@gmail.com', '+919812345617', 'male', '1986-09-12', 60, 2, 3800.00, 'google', TRUE),
  ('e4eebc99-0018-4ef8-bb6d-6bb9bd380018', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kavita', 'Mishra', 'kavita.m@gmail.com', '+919812345618', 'female', '1993-03-06', 580, 19, 51000.00, 'walk_in', TRUE),
  ('e4eebc99-0019-4ef8-bb6d-6bb9bd380019', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Deepak', 'Kumar', 'deepak.k@gmail.com', '+919812345619', 'male', '1991-08-24', 150, 5, 8500.00, 'referral', TRUE),
  ('e4eebc99-0020-4ef8-bb6d-6bb9bd380020', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nisha', 'Bhatt', 'nisha.b@gmail.com', '+919812345620', 'female', '1994-12-11', 730, 22, 59000.00, 'instagram', TRUE);

-- ============================================================================
-- SERVICE CATEGORIES (8 categories)
-- ============================================================================
INSERT INTO service_categories (id, tenant_id, name, description, icon, sort_order) VALUES
  ('f5eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Haircut & Styling', 'Professional hair cutting and styling services', 'scissors', 1),
  ('f5eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hair Coloring', 'Hair color, highlights, and treatments', 'palette', 2),
  ('f5eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Skin Care', 'Facials, cleanups, and skin treatments', 'sparkles', 3),
  ('f5eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nail Art', 'Manicure, pedicure, and nail art services', 'hand', 4),
  ('f5eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Spa & Massage', 'Relaxing spa treatments and massages', 'leaf', 5),
  ('f5eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Makeup', 'Bridal, party, and everyday makeup', 'heart', 6),
  ('f5eebc99-0007-4ef8-bb6d-6bb9bd380007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Hair Treatments', 'Keratin, smoothening, and hair spa', 'zap', 7),
  ('f5eebc99-0008-4ef8-bb6d-6bb9bd380008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Grooming (Men)', 'Beard, shave, and men''s grooming', 'user', 8);

-- ============================================================================
-- SERVICES (25+ services across categories)
-- ============================================================================
INSERT INTO services (id, tenant_id, category_id, name, description, duration_minutes, price, compare_price, tax_percent, is_active, is_online_bookable) VALUES
  -- Haircut & Styling
  ('a6eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0001-4ef8-bb6d-6bb9bd380001', 'Women''s Haircut', 'Professional haircut with wash and blow dry', 45, 800.00, 1000.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0001-4ef8-bb6d-6bb9bd380001', 'Men''s Haircut', 'Trendy men''s haircut with styling', 30, 500.00, NULL, 18.00, TRUE, TRUE),
  ('a6eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0001-4ef8-bb6d-6bb9bd380001', 'Blow Dry & Styling', 'Professional blow dry with styling', 30, 600.00, NULL, 18.00, TRUE, TRUE),
  ('a6eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0001-4ef8-bb6d-6bb9bd380001', 'Kids'' Haircut', 'Gentle haircut for children under 12', 20, 350.00, NULL, 18.00, TRUE, TRUE),

  -- Hair Coloring
  ('a6eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0002-4ef8-bb6d-6bb9bd380002', 'Global Hair Color', 'Full head single-tone color application', 90, 2500.00, 3000.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0002-4ef8-bb6d-6bb9bd380002', 'Highlights', 'Partial or full head highlights', 120, 3500.00, 4500.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0007-4ef8-bb6d-6bb9bd380007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0002-4ef8-bb6d-6bb9bd380002', 'Balayage', 'Hand-painted balayage color technique', 150, 5000.00, 6500.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0008-4ef8-bb6d-6bb9bd380008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0002-4ef8-bb6d-6bb9bd380002', 'Root Touch Up', 'Color touch up for roots', 45, 1200.00, NULL, 18.00, TRUE, TRUE),

  -- Skin Care
  ('a6eebc99-0009-4ef8-bb6d-6bb9bd380009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0003-4ef8-bb6d-6bb9bd380003', 'Classic Facial', 'Deep cleansing facial with massage', 60, 1500.00, 1800.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0010-4ef8-bb6d-6bb9bd380010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0003-4ef8-bb6d-6bb9bd380003', 'Gold Facial', 'Luxury gold-infused facial treatment', 75, 2500.00, 3200.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0011-4ef8-bb6d-6bb9bd380011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0003-4ef8-bb6d-6bb9bd380003', 'Cleanup', 'Quick skin cleanup and exfoliation', 30, 800.00, NULL, 18.00, TRUE, TRUE),
  ('a6eebc99-0012-4ef8-bb6d-6bb9bd380012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0003-4ef8-bb6d-6bb9bd380003', 'De-Tan Treatment', 'Full body or face de-tan treatment', 45, 1200.00, NULL, 18.00, TRUE, TRUE),

  -- Nail Art
  ('a6eebc99-0013-4ef8-bb6d-6bb9bd380013', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0004-4ef8-bb6d-6bb9bd380004', 'Classic Manicure', 'Nail shaping, cuticle care, and polish', 30, 600.00, NULL, 18.00, TRUE, TRUE),
  ('a6eebc99-0014-4ef8-bb6d-6bb9bd380014', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0004-4ef8-bb6d-6bb9bd380004', 'Gel Manicure', 'Long-lasting gel polish manicure', 45, 1200.00, 1500.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0015-4ef8-bb6d-6bb9bd380015', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0004-4ef8-bb6d-6bb9bd380004', 'Spa Pedicure', 'Relaxing pedicure with foot massage', 45, 900.00, NULL, 18.00, TRUE, TRUE),

  -- Spa & Massage
  ('a6eebc99-0016-4ef8-bb6d-6bb9bd380016', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0005-4ef8-bb6d-6bb9bd380005', 'Swedish Massage', 'Full body relaxation massage (60 mins)', 60, 2000.00, 2500.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0017-4ef8-bb6d-6bb9bd380017', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0005-4ef8-bb6d-6bb9bd380005', 'Deep Tissue Massage', 'Intensive pressure-point therapy', 60, 2500.00, 3000.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0018-4ef8-bb6d-6bb9bd380018', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0005-4ef8-bb6d-6bb9bd380005', 'Aromatherapy Massage', 'Essential oil therapy massage', 75, 3000.00, 3500.00, 18.00, TRUE, TRUE),

  -- Makeup
  ('a6eebc99-0019-4ef8-bb6d-6bb9bd380019', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0006-4ef8-bb6d-6bb9bd380006', 'Party Makeup', 'Glamorous makeup for parties and events', 60, 3000.00, NULL, 18.00, TRUE, TRUE),
  ('a6eebc99-0020-4ef8-bb6d-6bb9bd380020', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0006-4ef8-bb6d-6bb9bd380006', 'Bridal Makeup', 'Complete bridal makeup with draping', 180, 15000.00, 20000.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0021-4ef8-bb6d-6bb9bd380021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0006-4ef8-bb6d-6bb9bd380006', 'Engagement Makeup', 'Elegant engagement look with styling', 120, 8000.00, 10000.00, 18.00, TRUE, TRUE),

  -- Hair Treatments
  ('a6eebc99-0022-4ef8-bb6d-6bb9bd380022', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0007-4ef8-bb6d-6bb9bd380007', 'Keratin Treatment', 'Premium keratin smoothening treatment', 180, 6000.00, 8000.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0023-4ef8-bb6d-6bb9bd380023', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0007-4ef8-bb6d-6bb9bd380007', 'Hair Spa', 'Deep conditioning hair spa treatment', 60, 1500.00, 2000.00, 18.00, TRUE, TRUE),
  ('a6eebc99-0024-4ef8-bb6d-6bb9bd380024', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0007-4ef8-bb6d-6bb9bd380007', 'Hair Botox', 'Advanced hair botox repair treatment', 120, 4500.00, 5500.00, 18.00, TRUE, TRUE),

  -- Grooming (Men)
  ('a6eebc99-0025-4ef8-bb6d-6bb9bd380025', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0008-4ef8-bb6d-6bb9bd380008', 'Beard Trim & Shape', 'Professional beard trimming and shaping', 20, 300.00, NULL, 18.00, TRUE, TRUE),
  ('a6eebc99-0026-4ef8-bb6d-6bb9bd380026', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0008-4ef8-bb6d-6bb9bd380008', 'Royal Shave', 'Hot towel royal shave experience', 30, 500.00, NULL, 18.00, TRUE, TRUE),
  ('a6eebc99-0027-4ef8-bb6d-6bb9bd380027', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'f5eebc99-0008-4ef8-bb6d-6bb9bd380008', 'Men''s Facial', 'Deep cleansing facial for men', 45, 1000.00, 1200.00, 18.00, TRUE, TRUE);

-- ============================================================================
-- STAFF SERVICES (link staff to their services with commission)
-- ============================================================================
INSERT INTO staff_services (staff_id, service_id, commission_percent) VALUES
  -- Anjali (Stylist) - Hair services
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0001-4ef8-bb6d-6bb9bd380001', 30.00),
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0002-4ef8-bb6d-6bb9bd380002', 30.00),
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0003-4ef8-bb6d-6bb9bd380003', 25.00),
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0005-4ef8-bb6d-6bb9bd380005', 25.00),
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0006-4ef8-bb6d-6bb9bd380006', 25.00),
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0022-4ef8-bb6d-6bb9bd380022', 20.00),
  ('d3eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0023-4ef8-bb6d-6bb9bd380023', 25.00),
  -- Neha (Beautician) - Skin & Makeup
  ('d3eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a6eebc99-0009-4ef8-bb6d-6bb9bd380009', 30.00),
  ('d3eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a6eebc99-0010-4ef8-bb6d-6bb9bd380010', 25.00),
  ('d3eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a6eebc99-0011-4ef8-bb6d-6bb9bd380011', 30.00),
  ('d3eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a6eebc99-0019-4ef8-bb6d-6bb9bd380019', 25.00),
  ('d3eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a6eebc99-0020-4ef8-bb6d-6bb9bd380020', 20.00),
  ('d3eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a6eebc99-0013-4ef8-bb6d-6bb9bd380013', 30.00),
  -- Vikram (Stylist) - Hair + Men's Grooming
  ('d3eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a6eebc99-0002-4ef8-bb6d-6bb9bd380002', 30.00),
  ('d3eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a6eebc99-0025-4ef8-bb6d-6bb9bd380025', 35.00),
  ('d3eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a6eebc99-0026-4ef8-bb6d-6bb9bd380026', 35.00),
  ('d3eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a6eebc99-0027-4ef8-bb6d-6bb9bd380027', 30.00),
  ('d3eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a6eebc99-0005-4ef8-bb6d-6bb9bd380005', 25.00);

-- ============================================================================
-- STAFF SCHEDULES (Monday-Saturday working for all staff)
-- ============================================================================
INSERT INTO staff_schedules (tenant_id, staff_id, day_of_week, start_time, end_time, is_working) VALUES
  -- Anjali (Mon-Sat, off Sunday)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 1, '10:00', '19:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 2, '10:00', '19:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 3, '10:00', '19:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 4, '10:00', '19:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 5, '10:00', '19:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 6, '10:00', '17:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 0, '10:00', '19:00', FALSE),
  -- Neha (Mon-Sat, off Sunday)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 1, '09:30', '18:30', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 2, '09:30', '18:30', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 3, '09:30', '18:30', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 4, '09:30', '18:30', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 5, '09:30', '18:30', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 6, '10:00', '16:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 0, '09:30', '18:30', FALSE),
  -- Vikram (Tue-Sun, off Monday)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 1, '11:00', '20:00', FALSE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 2, '11:00', '20:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 3, '11:00', '20:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 4, '11:00', '20:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 5, '11:00', '20:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 6, '11:00', '18:00', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 0, '11:00', '18:00', TRUE);

-- ============================================================================
-- APPOINTMENTS (30 appointments, mix of statuses, spread over past month + next 2 weeks)
-- ============================================================================
INSERT INTO appointments (id, tenant_id, customer_id, staff_id, start_time, end_time, status, total_amount, discount_amount, tax_amount, final_amount, source, notes) VALUES
  -- Past completed appointments
  ('b7eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0001-4ef8-bb6d-6bb9bd380001', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '28 days' + TIME '10:00', NOW() - INTERVAL '28 days' + TIME '10:45', 'completed', 800.00, 0.00, 144.00, 944.00, 'online', 'Regular haircut'),
  ('b7eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() - INTERVAL '27 days' + TIME '11:00', NOW() - INTERVAL '27 days' + TIME '12:00', 'completed', 1500.00, 150.00, 243.00, 1593.00, 'walk_in', 'Classic facial - returning customer'),
  ('b7eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0003-4ef8-bb6d-6bb9bd380003', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() - INTERVAL '25 days' + TIME '14:00', NOW() - INTERVAL '25 days' + TIME '14:30', 'completed', 500.00, 0.00, 90.00, 590.00, 'phone', NULL),
  ('b7eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0004-4ef8-bb6d-6bb9bd380004', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '23 days' + TIME '15:00', NOW() - INTERVAL '23 days' + TIME '17:30', 'completed', 5000.00, 500.00, 810.00, 5310.00, 'online', 'Balayage - first time'),
  ('b7eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0005-4ef8-bb6d-6bb9bd380005', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() - INTERVAL '22 days' + TIME '11:00', NOW() - INTERVAL '22 days' + TIME '11:20', 'completed', 300.00, 0.00, 54.00, 354.00, 'walk_in', 'Beard trim'),
  ('b7eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0006-4ef8-bb6d-6bb9bd380006', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() - INTERVAL '20 days' + TIME '10:00', NOW() - INTERVAL '20 days' + TIME '11:15', 'completed', 2500.00, 250.00, 405.00, 2655.00, 'online', 'Gold facial - premium client'),
  ('b7eebc99-0007-4ef8-bb6d-6bb9bd380007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0007-4ef8-bb6d-6bb9bd380007', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() - INTERVAL '18 days' + TIME '16:00', NOW() - INTERVAL '18 days' + TIME '16:30', 'completed', 500.00, 0.00, 90.00, 590.00, 'walk_in', NULL),
  ('b7eebc99-0008-4ef8-bb6d-6bb9bd380008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0008-4ef8-bb6d-6bb9bd380008', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '17 days' + TIME '12:00', NOW() - INTERVAL '17 days' + TIME '13:30', 'completed', 3500.00, 0.00, 630.00, 4130.00, 'online', 'Highlights session'),
  ('b7eebc99-0009-4ef8-bb6d-6bb9bd380009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0010-4ef8-bb6d-6bb9bd380010', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() - INTERVAL '15 days' + TIME '14:00', NOW() - INTERVAL '15 days' + TIME '15:00', 'completed', 3000.00, 300.00, 486.00, 3186.00, 'phone', 'Party makeup for anniversary'),
  ('b7eebc99-0010-4ef8-bb6d-6bb9bd380010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0014-4ef8-bb6d-6bb9bd380014', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '14 days' + TIME '10:00', NOW() - INTERVAL '14 days' + TIME '13:00', 'completed', 6000.00, 600.00, 972.00, 6372.00, 'online', 'Keratin treatment - VIP'),

  -- Cancelled / No-show appointments
  ('b7eebc99-0011-4ef8-bb6d-6bb9bd380011', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0009-4ef8-bb6d-6bb9bd380009', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '13 days' + TIME '11:00', NOW() - INTERVAL '13 days' + TIME '11:45', 'cancelled', 800.00, 0.00, 144.00, 944.00, 'online', 'Cancelled due to emergency'),
  ('b7eebc99-0012-4ef8-bb6d-6bb9bd380012', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0013-4ef8-bb6d-6bb9bd380013', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() - INTERVAL '12 days' + TIME '15:00', NOW() - INTERVAL '12 days' + TIME '15:30', 'no_show', 500.00, 0.00, 90.00, 590.00, 'online', NULL),

  -- More completed
  ('b7eebc99-0013-4ef8-bb6d-6bb9bd380013', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0011-4ef8-bb6d-6bb9bd380011', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() - INTERVAL '10 days' + TIME '11:00', NOW() - INTERVAL '10 days' + TIME '11:30', 'completed', 800.00, 100.00, 126.00, 826.00, 'walk_in', 'Haircut + beard shape combo'),
  ('b7eebc99-0014-4ef8-bb6d-6bb9bd380014', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0016-4ef8-bb6d-6bb9bd380016', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() - INTERVAL '9 days' + TIME '10:00', NOW() - INTERVAL '9 days' + TIME '11:00', 'completed', 2000.00, 200.00, 324.00, 2124.00, 'online', 'Swedish massage - regular'),
  ('b7eebc99-0015-4ef8-bb6d-6bb9bd380015', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0018-4ef8-bb6d-6bb9bd380018', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '7 days' + TIME '14:00', NOW() - INTERVAL '7 days' + TIME '14:45', 'completed', 800.00, 0.00, 144.00, 944.00, 'phone', NULL),
  ('b7eebc99-0016-4ef8-bb6d-6bb9bd380016', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0020-4ef8-bb6d-6bb9bd380020', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() - INTERVAL '5 days' + TIME '11:00', NOW() - INTERVAL '5 days' + TIME '12:15', 'completed', 2500.00, 0.00, 450.00, 2950.00, 'walk_in', 'Gold facial'),
  ('b7eebc99-0017-4ef8-bb6d-6bb9bd380017', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0015-4ef8-bb6d-6bb9bd380015', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() - INTERVAL '4 days' + TIME '16:00', NOW() - INTERVAL '4 days' + TIME '16:30', 'completed', 500.00, 50.00, 81.00, 531.00, 'online', 'Quick haircut'),
  ('b7eebc99-0018-4ef8-bb6d-6bb9bd380018', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0012-4ef8-bb6d-6bb9bd380012', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '3 days' + TIME '10:00', NOW() - INTERVAL '3 days' + TIME '11:00', 'completed', 1500.00, 0.00, 270.00, 1770.00, 'online', 'Hair spa treatment'),
  ('b7eebc99-0019-4ef8-bb6d-6bb9bd380019', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() - INTERVAL '2 days' + TIME '13:00', NOW() - INTERVAL '2 days' + TIME '13:30', 'completed', 600.00, 0.00, 108.00, 708.00, 'walk_in', 'Classic manicure'),
  ('b7eebc99-0020-4ef8-bb6d-6bb9bd380020', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0001-4ef8-bb6d-6bb9bd380001', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() - INTERVAL '1 day' + TIME '15:00', NOW() - INTERVAL '1 day' + TIME '15:45', 'completed', 800.00, 80.00, 129.60, 849.60, 'online', 'Repeat visit - haircut'),

  -- Today in-progress
  ('b7eebc99-0021-4ef8-bb6d-6bb9bd380021', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0006-4ef8-bb6d-6bb9bd380006', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '30 minutes', 'in_progress', 1500.00, 0.00, 270.00, 1770.00, 'walk_in', 'Facial in progress'),

  -- Upcoming confirmed appointments
  ('b7eebc99-0022-4ef8-bb6d-6bb9bd380022', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0004-4ef8-bb6d-6bb9bd380004', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() + INTERVAL '1 day' + TIME '10:00', NOW() + INTERVAL '1 day' + TIME '10:45', 'confirmed', 800.00, 0.00, 144.00, 944.00, 'online', NULL),
  ('b7eebc99-0023-4ef8-bb6d-6bb9bd380023', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0010-4ef8-bb6d-6bb9bd380010', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() + INTERVAL '2 days' + TIME '11:00', NOW() + INTERVAL '2 days' + TIME '12:15', 'confirmed', 2500.00, 250.00, 405.00, 2655.00, 'phone', 'Gold facial - VIP client'),
  ('b7eebc99-0024-4ef8-bb6d-6bb9bd380024', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0014-4ef8-bb6d-6bb9bd380014', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() + INTERVAL '3 days' + TIME '14:00', NOW() + INTERVAL '3 days' + TIME '16:30', 'confirmed', 5000.00, 0.00, 900.00, 5900.00, 'online', 'Balayage appointment'),

  -- Upcoming scheduled (not yet confirmed)
  ('b7eebc99-0025-4ef8-bb6d-6bb9bd380025', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0007-4ef8-bb6d-6bb9bd380007', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() + INTERVAL '4 days' + TIME '15:00', NOW() + INTERVAL '4 days' + TIME '15:30', 'scheduled', 500.00, 0.00, 90.00, 590.00, 'app', NULL),
  ('b7eebc99-0026-4ef8-bb6d-6bb9bd380026', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0017-4ef8-bb6d-6bb9bd380017', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() + INTERVAL '5 days' + TIME '11:00', NOW() + INTERVAL '5 days' + TIME '11:50', 'scheduled', 1000.00, 0.00, 180.00, 1180.00, 'online', 'Men''s facial'),
  ('b7eebc99-0027-4ef8-bb6d-6bb9bd380027', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0020-4ef8-bb6d-6bb9bd380020', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() + INTERVAL '7 days' + TIME '10:00', NOW() + INTERVAL '7 days' + TIME '13:00', 'scheduled', 6000.00, 600.00, 972.00, 6372.00, 'online', 'Keratin treatment'),
  ('b7eebc99-0028-4ef8-bb6d-6bb9bd380028', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0016-4ef8-bb6d-6bb9bd380016', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', NOW() + INTERVAL '10 days' + TIME '12:00', NOW() + INTERVAL '10 days' + TIME '15:00', 'scheduled', 15000.00, 1500.00, 2430.00, 15930.00, 'phone', 'Bridal makeup - full package'),
  ('b7eebc99-0029-4ef8-bb6d-6bb9bd380029', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0019-4ef8-bb6d-6bb9bd380019', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', NOW() + INTERVAL '12 days' + TIME '16:00', NOW() + INTERVAL '12 days' + TIME '16:30', 'scheduled', 800.00, 0.00, 144.00, 944.00, 'app', 'Haircut + beard combo'),
  ('b7eebc99-0030-4ef8-bb6d-6bb9bd380030', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0008-4ef8-bb6d-6bb9bd380008', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', NOW() + INTERVAL '14 days' + TIME '11:00', NOW() + INTERVAL '14 days' + TIME '13:30', 'scheduled', 3500.00, 350.00, 567.00, 3717.00, 'online', 'Highlights - repeat client');

-- ============================================================================
-- APPOINTMENT SERVICES
-- ============================================================================
INSERT INTO appointment_services (appointment_id, service_id, staff_id, price, discount, duration_minutes) VALUES
  ('b7eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a6eebc99-0001-4ef8-bb6d-6bb9bd380001', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 800.00, 0.00, 45),
  ('b7eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a6eebc99-0009-4ef8-bb6d-6bb9bd380009', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 1500.00, 150.00, 60),
  ('b7eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a6eebc99-0002-4ef8-bb6d-6bb9bd380002', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 500.00, 0.00, 30),
  ('b7eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a6eebc99-0007-4ef8-bb6d-6bb9bd380007', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 5000.00, 500.00, 150),
  ('b7eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a6eebc99-0025-4ef8-bb6d-6bb9bd380025', 'd3eebc99-0005-4ef8-bb6d-6bb9bd380005', 300.00, 0.00, 20),
  ('b7eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a6eebc99-0010-4ef8-bb6d-6bb9bd380010', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 2500.00, 250.00, 75),
  ('b7eebc99-0010-4ef8-bb6d-6bb9bd380010', 'a6eebc99-0022-4ef8-bb6d-6bb9bd380022', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 6000.00, 600.00, 180),
  ('b7eebc99-0021-4ef8-bb6d-6bb9bd380021', 'a6eebc99-0009-4ef8-bb6d-6bb9bd380009', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 1500.00, 0.00, 60),
  ('b7eebc99-0022-4ef8-bb6d-6bb9bd380022', 'a6eebc99-0001-4ef8-bb6d-6bb9bd380001', 'd3eebc99-0003-4ef8-bb6d-6bb9bd380003', 800.00, 0.00, 45),
  ('b7eebc99-0028-4ef8-bb6d-6bb9bd380028', 'a6eebc99-0020-4ef8-bb6d-6bb9bd380020', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004', 15000.00, 1500.00, 180);

-- ============================================================================
-- INVOICES (10 invoices)
-- ============================================================================
INSERT INTO invoices (id, tenant_id, invoice_number, customer_id, appointment_id, subtotal, discount_amount, tax_amount, total_amount, status, due_date, gst_number) VALUES
  ('c8eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0001', 'e4eebc99-0001-4ef8-bb6d-6bb9bd380001', 'b7eebc99-0001-4ef8-bb6d-6bb9bd380001', 800.00, 0.00, 144.00, 944.00, 'paid', (NOW() - INTERVAL '28 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0002', 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', 'b7eebc99-0002-4ef8-bb6d-6bb9bd380002', 1500.00, 150.00, 243.00, 1593.00, 'paid', (NOW() - INTERVAL '27 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0003', 'e4eebc99-0004-4ef8-bb6d-6bb9bd380004', 'b7eebc99-0004-4ef8-bb6d-6bb9bd380004', 5000.00, 500.00, 810.00, 5310.00, 'paid', (NOW() - INTERVAL '23 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0004', 'e4eebc99-0006-4ef8-bb6d-6bb9bd380006', 'b7eebc99-0006-4ef8-bb6d-6bb9bd380006', 2500.00, 250.00, 405.00, 2655.00, 'paid', (NOW() - INTERVAL '20 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0005', 'e4eebc99-0014-4ef8-bb6d-6bb9bd380014', 'b7eebc99-0010-4ef8-bb6d-6bb9bd380010', 6000.00, 600.00, 972.00, 6372.00, 'paid', (NOW() - INTERVAL '14 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0006', 'e4eebc99-0010-4ef8-bb6d-6bb9bd380010', 'b7eebc99-0009-4ef8-bb6d-6bb9bd380009', 3000.00, 300.00, 486.00, 3186.00, 'paid', (NOW() - INTERVAL '15 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0007-4ef8-bb6d-6bb9bd380007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0007', 'e4eebc99-0016-4ef8-bb6d-6bb9bd380016', 'b7eebc99-0014-4ef8-bb6d-6bb9bd380014', 2000.00, 200.00, 324.00, 2124.00, 'paid', (NOW() - INTERVAL '9 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0008-4ef8-bb6d-6bb9bd380008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0008', 'e4eebc99-0020-4ef8-bb6d-6bb9bd380020', 'b7eebc99-0016-4ef8-bb6d-6bb9bd380016', 2500.00, 0.00, 450.00, 2950.00, 'paid', (NOW() - INTERVAL '5 days')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0009-4ef8-bb6d-6bb9bd380009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0009', 'e4eebc99-0001-4ef8-bb6d-6bb9bd380001', 'b7eebc99-0020-4ef8-bb6d-6bb9bd380020', 800.00, 80.00, 129.60, 849.60, 'paid', (NOW() - INTERVAL '1 day')::DATE, '27AABCG1234F1Z5'),
  ('c8eebc99-0010-4ef8-bb6d-6bb9bd380010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GS-2026-0010', 'e4eebc99-0006-4ef8-bb6d-6bb9bd380006', 'b7eebc99-0021-4ef8-bb6d-6bb9bd380021', 1500.00, 0.00, 270.00, 1770.00, 'draft', (NOW() + INTERVAL '7 days')::DATE, '27AABCG1234F1Z5');

-- ============================================================================
-- INVOICE ITEMS
-- ============================================================================
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, discount, tax_percent, total, service_id) VALUES
  ('c8eebc99-0001-4ef8-bb6d-6bb9bd380001', 'Women''s Haircut', 1, 800.00, 0.00, 18.00, 944.00, 'a6eebc99-0001-4ef8-bb6d-6bb9bd380001'),
  ('c8eebc99-0002-4ef8-bb6d-6bb9bd380002', 'Classic Facial', 1, 1500.00, 150.00, 18.00, 1593.00, 'a6eebc99-0009-4ef8-bb6d-6bb9bd380009'),
  ('c8eebc99-0003-4ef8-bb6d-6bb9bd380003', 'Balayage', 1, 5000.00, 500.00, 18.00, 5310.00, 'a6eebc99-0007-4ef8-bb6d-6bb9bd380007'),
  ('c8eebc99-0004-4ef8-bb6d-6bb9bd380004', 'Gold Facial', 1, 2500.00, 250.00, 18.00, 2655.00, 'a6eebc99-0010-4ef8-bb6d-6bb9bd380010'),
  ('c8eebc99-0005-4ef8-bb6d-6bb9bd380005', 'Keratin Treatment', 1, 6000.00, 600.00, 18.00, 6372.00, 'a6eebc99-0022-4ef8-bb6d-6bb9bd380022'),
  ('c8eebc99-0006-4ef8-bb6d-6bb9bd380006', 'Party Makeup', 1, 3000.00, 300.00, 18.00, 3186.00, 'a6eebc99-0019-4ef8-bb6d-6bb9bd380019'),
  ('c8eebc99-0007-4ef8-bb6d-6bb9bd380007', 'Swedish Massage', 1, 2000.00, 200.00, 18.00, 2124.00, 'a6eebc99-0016-4ef8-bb6d-6bb9bd380016'),
  ('c8eebc99-0008-4ef8-bb6d-6bb9bd380008', 'Gold Facial', 1, 2500.00, 0.00, 18.00, 2950.00, 'a6eebc99-0010-4ef8-bb6d-6bb9bd380010'),
  ('c8eebc99-0009-4ef8-bb6d-6bb9bd380009', 'Women''s Haircut', 1, 800.00, 80.00, 18.00, 849.60, 'a6eebc99-0001-4ef8-bb6d-6bb9bd380001'),
  ('c8eebc99-0010-4ef8-bb6d-6bb9bd380010', 'Classic Facial', 1, 1500.00, 0.00, 18.00, 1770.00, 'a6eebc99-0009-4ef8-bb6d-6bb9bd380009');

-- ============================================================================
-- PAYMENTS (matching invoices)
-- ============================================================================
INSERT INTO payments (tenant_id, invoice_id, amount, payment_method, status, gateway, received_by) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0001-4ef8-bb6d-6bb9bd380001', 944.00, 'upi', 'completed', 'razorpay', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0002-4ef8-bb6d-6bb9bd380002', 1593.00, 'cash', 'completed', 'cash', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0003-4ef8-bb6d-6bb9bd380003', 5310.00, 'card', 'completed', 'razorpay', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0004-4ef8-bb6d-6bb9bd380004', 2655.00, 'upi', 'completed', 'razorpay', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0005-4ef8-bb6d-6bb9bd380005', 6372.00, 'card', 'completed', 'stripe', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0006-4ef8-bb6d-6bb9bd380006', 3186.00, 'cash', 'completed', 'cash', 'd3eebc99-0002-4ef8-bb6d-6bb9bd380002'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0007-4ef8-bb6d-6bb9bd380007', 2124.00, 'upi', 'completed', 'razorpay', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0008-4ef8-bb6d-6bb9bd380008', 2950.00, 'card', 'completed', 'razorpay', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c8eebc99-0009-4ef8-bb6d-6bb9bd380009', 849.60, 'upi', 'completed', 'razorpay', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006');

-- ============================================================================
-- PRODUCTS (10 retail products)
-- ============================================================================
INSERT INTO products (id, tenant_id, name, description, sku, category, brand, cost_price, selling_price, tax_percent, stock_quantity, min_stock_level, is_active) VALUES
  ('d9eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'L''Oreal Professional Shampoo 300ml', 'Sulfate-free shampoo for treated hair', 'LOR-SHP-300', 'Hair Care', 'L''Oreal Professional', 450.00, 850.00, 18.00, 25, 5, TRUE),
  ('d9eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Schwarzkopf Hair Serum 100ml', 'Anti-frizz smoothing serum', 'SCH-SRM-100', 'Hair Care', 'Schwarzkopf', 320.00, 650.00, 18.00, 18, 5, TRUE),
  ('d9eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'OPI Nail Lacquer', 'Long-lasting nail polish, assorted shades', 'OPI-NL-001', 'Nail Care', 'OPI', 280.00, 550.00, 18.00, 40, 10, TRUE),
  ('d9eebc99-0004-4ef8-bb6d-6bb9bd380004', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Forest Essentials Face Cream 50g', 'Ayurvedic night repair cream', 'FE-FC-050', 'Skin Care', 'Forest Essentials', 800.00, 1450.00, 18.00, 12, 3, TRUE),
  ('d9eebc99-0005-4ef8-bb6d-6bb9bd380005', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Moroccanoil Treatment 50ml', 'Argan oil hair treatment', 'MOR-OIL-050', 'Hair Care', 'Moroccanoil', 650.00, 1200.00, 18.00, 8, 3, TRUE),
  ('d9eebc99-0006-4ef8-bb6d-6bb9bd380006', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'VLCC Gold Facial Kit', 'Professional gold facial kit (6 sachets)', 'VLC-GFK-001', 'Skin Care', 'VLCC', 180.00, 350.00, 18.00, 30, 10, TRUE),
  ('d9eebc99-0007-4ef8-bb6d-6bb9bd380007', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Wella Color Charm', 'Professional hair color, assorted shades', 'WEL-CC-001', 'Hair Color', 'Wella', 220.00, 450.00, 18.00, 50, 15, TRUE),
  ('d9eebc99-0008-4ef8-bb6d-6bb9bd380008', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'MAC Studio Fix Foundation', 'Full coverage liquid foundation', 'MAC-SFF-001', 'Makeup', 'MAC', 1200.00, 2400.00, 18.00, 6, 2, TRUE),
  ('d9eebc99-0009-4ef8-bb6d-6bb9bd380009', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Biotique Bio Kelp Shampoo 340ml', 'Protein shampoo for falling hair', 'BIO-SHP-340', 'Hair Care', 'Biotique', 120.00, 249.00, 18.00, 35, 10, TRUE),
  ('d9eebc99-0010-4ef8-bb6d-6bb9bd380010', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Kama Ayurveda Rose Water 200ml', 'Pure rose water face mist', 'KAM-RW-200', 'Skin Care', 'Kama Ayurveda', 350.00, 695.00, 18.00, 15, 5, TRUE);

-- ============================================================================
-- INVENTORY TRANSACTIONS
-- ============================================================================
INSERT INTO inventory_transactions (tenant_id, product_id, type, quantity, unit_cost, notes, created_by) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd9eebc99-0001-4ef8-bb6d-6bb9bd380001', 'purchase', 30, 450.00, 'Initial stock purchase', 'd3eebc99-0002-4ef8-bb6d-6bb9bd380002'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd9eebc99-0001-4ef8-bb6d-6bb9bd380001', 'sale', -5, 850.00, 'Retail sale', 'd3eebc99-0006-4ef8-bb6d-6bb9bd380006'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd9eebc99-0006-4ef8-bb6d-6bb9bd380006', 'purchase', 40, 180.00, 'Bulk purchase from VLCC distributor', 'd3eebc99-0002-4ef8-bb6d-6bb9bd380002'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd9eebc99-0006-4ef8-bb6d-6bb9bd380006', 'consumption', -10, 180.00, 'Used for facials', 'd3eebc99-0004-4ef8-bb6d-6bb9bd380004'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd9eebc99-0007-4ef8-bb6d-6bb9bd380007', 'purchase', 60, 220.00, 'Color stock replenishment', 'd3eebc99-0002-4ef8-bb6d-6bb9bd380002');

-- ============================================================================
-- MEMBERSHIP PLANS (3 tiers)
-- ============================================================================
INSERT INTO membership_plans (id, tenant_id, name, description, price, duration_days, max_services, discount_percent, benefits, is_active) VALUES
  ('e0eebc99-0001-4ef8-bb6d-6bb9bd380001', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Silver Membership', 'Basic membership with 10% discount on all services', 2999.00, 180, 20, 10.00, '["10% off all services", "Priority booking", "Birthday special offer", "Free hair spa on signup"]'::jsonb, TRUE),
  ('e0eebc99-0002-4ef8-bb6d-6bb9bd380002', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Gold Membership', 'Premium membership with 20% discount and bonus perks', 5999.00, 365, 40, 20.00, '["20% off all services", "Priority booking", "Birthday & anniversary specials", "2 free hair spas", "Complimentary cleanup every month", "Loyalty points 2x"]'::jsonb, TRUE),
  ('e0eebc99-0003-4ef8-bb6d-6bb9bd380003', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Platinum Membership', 'VIP membership with maximum benefits', 11999.00, 365, NULL, 30.00, '["30% off all services", "VIP priority booking", "All occasion specials", "Unlimited hair spas", "Monthly complimentary facial", "Loyalty points 3x", "Exclusive product discounts", "Personal style consultant"]'::jsonb, TRUE);

-- ============================================================================
-- CUSTOMER MEMBERSHIPS
-- ============================================================================
INSERT INTO customer_memberships (tenant_id, customer_id, plan_id, start_date, end_date, status, services_used) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', 'e0eebc99-0002-4ef8-bb6d-6bb9bd380002', '2026-01-15', '2027-01-15', 'active', 12),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0014-4ef8-bb6d-6bb9bd380014', 'e0eebc99-0003-4ef8-bb6d-6bb9bd380003', '2026-03-01', '2027-03-01', 'active', 18),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0006-4ef8-bb6d-6bb9bd380006', 'e0eebc99-0001-4ef8-bb6d-6bb9bd380001', '2026-04-10', '2026-10-10', 'active', 8),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0020-4ef8-bb6d-6bb9bd380020', 'e0eebc99-0002-4ef8-bb6d-6bb9bd380002', '2026-02-20', '2027-02-20', 'active', 15);

-- ============================================================================
-- LOYALTY TRANSACTIONS
-- ============================================================================
INSERT INTO loyalty_transactions (tenant_id, customer_id, points, type, reference_type, description) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0001-4ef8-bb6d-6bb9bd380001', 50, 'earned', 'appointment', 'Points for Women''s Haircut'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', 100, 'earned', 'appointment', 'Points for Classic Facial (2x Gold member)'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0014-4ef8-bb6d-6bb9bd380014', 200, 'earned', 'appointment', 'Points for Keratin Treatment (3x Platinum)'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', -200, 'redeemed', 'invoice', 'Redeemed for ₹200 discount'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0006-4ef8-bb6d-6bb9bd380006', 500, 'bonus', 'membership', 'Welcome bonus for Silver membership'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0020-4ef8-bb6d-6bb9bd380020', 150, 'earned', 'appointment', 'Points for Gold Facial (2x Gold member)');

-- ============================================================================
-- REVIEWS (5 reviews)
-- ============================================================================
INSERT INTO reviews (tenant_id, customer_id, appointment_id, rating, comment, reply, replied_at, is_published) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0001-4ef8-bb6d-6bb9bd380001', 'b7eebc99-0001-4ef8-bb6d-6bb9bd380001', 5, 'Anjali is amazing! My haircut turned out exactly how I wanted. The salon ambiance is lovely and very hygienic. Will definitely come back!', 'Thank you so much Ananya! We''re thrilled you loved the experience. See you again soon! 💇‍♀️', NOW() - INTERVAL '26 days', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', 'b7eebc99-0002-4ef8-bb6d-6bb9bd380002', 4, 'Great facial experience. Neha really knows her craft. Only reason for 4 stars is the wait time was a bit long. Products used were top quality though.', 'Thank you Ritu! We apologize for the wait and are working on our scheduling. Your feedback helps us improve! 🙏', NOW() - INTERVAL '25 days', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0004-4ef8-bb6d-6bb9bd380004', 'b7eebc99-0004-4ef8-bb6d-6bb9bd380004', 5, 'Best balayage in Mumbai! Anjali understood exactly what I wanted from my Pinterest reference. The color blending is flawless. Worth every rupee!', 'Sneha, you made our day! Your balayage looked stunning. Thank you for trusting us with your hair! ✨', NOW() - INTERVAL '21 days', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0014-4ef8-bb6d-6bb9bd380014', 'b7eebc99-0010-4ef8-bb6d-6bb9bd380010', 5, 'The keratin treatment has transformed my hair completely! So smooth and manageable now. Priya''s team is the best in Bandra. Platinum membership is totally worth it.', 'Tanvi, your hair transformation was incredible! Thank you for being our loyal Platinum member. 💎', NOW() - INTERVAL '12 days', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'e4eebc99-0010-4ef8-bb6d-6bb9bd380010', 'b7eebc99-0009-4ef8-bb6d-6bb9bd380009', 4, 'Loved the party makeup by Neha. Got so many compliments at the event. Would have given 5 stars but the false lashes felt a bit heavy. Overall excellent service!', NULL, NULL, TRUE);

-- ============================================================================
-- AI INSIGHTS
-- ============================================================================
INSERT INTO ai_insights (tenant_id, type, title, description, data, priority, is_read, is_dismissed) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'revenue_forecast', 'Revenue Expected to Grow 18% This Month', 'Based on current booking trends and seasonal patterns, we predict ₹4.2L revenue this month, up from ₹3.5L last month. Hair coloring services are driving the increase.', '{"predicted_revenue": 420000, "last_month": 350000, "growth_percent": 18, "top_services": ["Balayage", "Highlights", "Keratin Treatment"], "confidence": 0.87}'::jsonb, 'medium', FALSE, FALSE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'churn_prediction', '3 Customers at Risk of Churning', 'Rohit Saxena, Varun Choudhary, and Amit Thakur haven''t visited in over 45 days. Sending a personalized re-engagement offer could bring them back.', '{"at_risk_customers": ["Rohit Saxena", "Varun Choudhary", "Amit Thakur"], "avg_days_since_visit": 52, "recommended_action": "Send 15% discount offer via WhatsApp", "potential_revenue_loss": 12000}'::jsonb, 'high', FALSE, FALSE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'inventory_alert', 'Moroccanoil Treatment Running Low', 'Only 8 units remaining (minimum stock level: 3). Based on consumption rate, stock will last approximately 12 days. Consider reordering.', '{"product": "Moroccanoil Treatment 50ml", "current_stock": 8, "min_level": 3, "days_until_stockout": 12, "suggested_order_qty": 15}'::jsonb, 'medium', FALSE, FALSE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'scheduling_optimization', 'Wednesday 2-4 PM Slot is Consistently Empty', 'For the past 4 weeks, Wednesday afternoon slots have had 0% utilization. Consider running a flash discount or scheduling staff training during this time.', '{"day": "Wednesday", "time_range": "14:00-16:00", "utilization": 0, "weeks_analyzed": 4, "suggestion": "Run 20% flash sale for this slot"}'::jsonb, 'low', FALSE, FALSE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'performance_analysis', 'Anjali is Your Top Revenue Generator', 'Anjali Patel generated ₹1.8L in revenue this month across 35 appointments. Her rebooking rate is 78% — highest among all staff.', '{"staff_name": "Anjali Patel", "revenue": 180000, "appointments": 35, "rebooking_rate": 78, "avg_rating": 4.8, "top_service": "Balayage"}'::jsonb, 'low', TRUE, FALSE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'marketing_suggestion', 'Launch a Monsoon Hair Care Campaign', 'Monsoon season typically increases demand for hair treatments by 30%. Create a "Monsoon Hair Rescue" package combining Hair Spa + Anti-Frizz Serum at a bundled price.', '{"season": "Monsoon", "expected_demand_increase": 30, "suggested_bundle": {"services": ["Hair Spa", "Hair Botox"], "product": "Schwarzkopf Hair Serum", "bundle_price": 2499, "original_total": 3150}, "target_audience": "Existing customers with hair services history"}'::jsonb, 'medium', FALSE, FALSE);

-- ============================================================================
-- GIFT CARDS
-- ============================================================================
INSERT INTO gift_cards (tenant_id, code, initial_amount, balance, customer_id, is_active, expires_at) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GLAM-GIFT-2026-A1', 2000.00, 2000.00, NULL, TRUE, NOW() + INTERVAL '6 months'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GLAM-GIFT-2026-B2', 5000.00, 3500.00, 'e4eebc99-0002-4ef8-bb6d-6bb9bd380002', TRUE, NOW() + INTERVAL '3 months'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'GLAM-BDAY-TANVI', 3000.00, 3000.00, 'e4eebc99-0014-4ef8-bb6d-6bb9bd380014', TRUE, NOW() + INTERVAL '12 months');

-- ============================================================================
-- EXPENSES
-- ============================================================================
INSERT INTO expenses (tenant_id, category, description, amount, date, vendor, created_by) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Rent', 'Monthly salon rent - July 2026', 85000.00, '2026-07-01', 'Bandra Properties Pvt Ltd', 'd3eebc99-0001-4ef8-bb6d-6bb9bd380001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Utilities', 'Electricity bill - June 2026', 12500.00, '2026-07-05', 'Adani Electricity Mumbai', 'd3eebc99-0002-4ef8-bb6d-6bb9bd380002'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Supplies', 'Monthly consumables - towels, disposables', 8500.00, '2026-07-03', 'Mumbai Salon Supplies', 'd3eebc99-0002-4ef8-bb6d-6bb9bd380002'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marketing', 'Instagram ads - July campaign', 15000.00, '2026-07-10', 'Meta Platforms', 'd3eebc99-0001-4ef8-bb6d-6bb9bd380001'),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Maintenance', 'AC servicing and repair', 4500.00, '2026-07-12', 'CoolAir Services', 'd3eebc99-0002-4ef8-bb6d-6bb9bd380002');

-- ============================================================================
-- SUPPLIERS
-- ============================================================================
INSERT INTO suppliers (tenant_id, name, email, phone, address, gst_number, contact_person, payment_terms, is_active) VALUES
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'L''Oreal India Pvt Ltd', 'orders@loreal.co.in', '+912240001234', 'Andheri East, Mumbai', '27AADCL1234F1Z5', 'Rajesh Kumar', 'Net 30', TRUE),
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Beauty Essentials Trading Co', 'supply@beautyessentials.in', '+912240005678', 'Goregaon West, Mumbai', '27BBEBT5678G2Z3', 'Sneha Desai', 'Net 15', TRUE);

-- ============================================================================
-- DONE!
-- ============================================================================
