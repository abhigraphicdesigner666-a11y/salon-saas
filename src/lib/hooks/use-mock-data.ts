'use client'

import { useState } from 'react'
import type { Customer, Service, ServiceCategory, Staff, Appointment, Invoice, InvoiceItem, Product, MembershipPlan, Review, Notification, AIInsight, RevenueDataPoint, DashboardStats, Campaign, LoyaltyTransaction, Expense, AuditLog, StaffSchedule } from '@/lib/types'

const TENANT_ID = 'demo-tenant-001'

const customers: Customer[] = [
  { id: 'c1', tenant_id: TENANT_ID, first_name: 'Priya', last_name: 'Sharma', email: 'priya.sharma@gmail.com', phone: '+91 98765 43210', gender: 'female', date_of_birth: '1992-03-15', anniversary: '2018-11-20', address: 'Bandra West', city: 'Mumbai', notes: 'Prefers organic products', medical_notes: '', allergies: ['Ammonia-based dye'], preferences: { favorite_services: ['s1','s5'], preferred_staff: ['st1'], communication: 'whatsapp', preferred_time: 'morning' }, referral_source: 'Instagram', loyalty_points: 2450, total_visits: 34, total_spent: 89500, last_visit_at: '2026-07-14T10:00:00Z', is_active: true, created_at: '2024-01-10T00:00:00Z', updated_at: '2026-07-14T10:00:00Z' },
  { id: 'c2', tenant_id: TENANT_ID, first_name: 'Anita', last_name: 'Desai', email: 'anita.desai@yahoo.com', phone: '+91 87654 32109', gender: 'female', date_of_birth: '1988-07-22', address: 'Juhu', city: 'Mumbai', notes: 'VIP client - always offer complimentary drink', medical_notes: 'Sensitive scalp', allergies: [], preferences: { communication: 'email', preferred_time: 'afternoon' }, referral_source: 'Google', loyalty_points: 5200, total_visits: 56, total_spent: 234000, last_visit_at: '2026-07-13T14:00:00Z', is_active: true, created_at: '2023-06-15T00:00:00Z', updated_at: '2026-07-13T14:00:00Z' },
  { id: 'c3', tenant_id: TENANT_ID, first_name: 'Rahul', last_name: 'Mehta', email: 'rahul.m@gmail.com', phone: '+91 76543 21098', gender: 'male', date_of_birth: '1995-11-08', address: 'Andheri East', city: 'Mumbai', notes: '', medical_notes: '', allergies: [], preferences: { communication: 'sms', preferred_time: 'evening' }, referral_source: 'Walk-in', loyalty_points: 800, total_visits: 12, total_spent: 18600, last_visit_at: '2026-07-10T18:00:00Z', is_active: true, created_at: '2025-02-20T00:00:00Z', updated_at: '2026-07-10T18:00:00Z' },
  { id: 'c4', tenant_id: TENANT_ID, first_name: 'Sneha', last_name: 'Patel', email: 'sneha.patel@outlook.com', phone: '+91 65432 10987', gender: 'female', date_of_birth: '1990-01-30', anniversary: '2016-12-05', address: 'Powai', city: 'Mumbai', notes: 'Bridal package regular', medical_notes: '', allergies: ['Parabens'], preferences: { communication: 'whatsapp' }, referral_source: 'Referral', loyalty_points: 3100, total_visits: 42, total_spent: 156000, last_visit_at: '2026-07-12T11:00:00Z', is_active: true, created_at: '2023-11-01T00:00:00Z', updated_at: '2026-07-12T11:00:00Z' },
  { id: 'c5', tenant_id: TENANT_ID, first_name: 'Vikram', last_name: 'Singh', email: 'vikram.s@gmail.com', phone: '+91 54321 09876', gender: 'male', date_of_birth: '1985-05-14', address: 'Worli', city: 'Mumbai', notes: 'Executive grooming package monthly', medical_notes: '', allergies: [], preferences: { communication: 'all', preferred_time: 'morning' }, referral_source: 'Google', loyalty_points: 1900, total_visits: 24, total_spent: 72000, last_visit_at: '2026-07-09T09:30:00Z', is_active: true, created_at: '2024-03-10T00:00:00Z', updated_at: '2026-07-09T09:30:00Z' },
  { id: 'c6', tenant_id: TENANT_ID, first_name: 'Kavita', last_name: 'Reddy', email: 'kavita.r@gmail.com', phone: '+91 43210 98765', gender: 'female', date_of_birth: '1993-09-25', address: 'Colaba', city: 'Mumbai', notes: '', medical_notes: '', allergies: [], preferences: { communication: 'whatsapp' }, referral_source: 'Instagram', loyalty_points: 600, total_visits: 8, total_spent: 12400, last_visit_at: '2026-06-28T15:00:00Z', is_active: true, created_at: '2025-08-12T00:00:00Z', updated_at: '2026-06-28T15:00:00Z' },
  { id: 'c7', tenant_id: TENANT_ID, first_name: 'Deepak', last_name: 'Joshi', email: 'deepak.j@yahoo.com', phone: '+91 32109 87654', gender: 'male', date_of_birth: '1991-12-03', address: 'Dadar', city: 'Mumbai', notes: 'Beard trim specialist request', medical_notes: '', allergies: [], preferences: { communication: 'sms' }, referral_source: 'Walk-in', loyalty_points: 350, total_visits: 5, total_spent: 4500, last_visit_at: '2026-07-05T17:00:00Z', is_active: true, created_at: '2026-01-15T00:00:00Z', updated_at: '2026-07-05T17:00:00Z' },
  { id: 'c8', tenant_id: TENANT_ID, first_name: 'Meera', last_name: 'Kapoor', email: 'meera.k@gmail.com', phone: '+91 21098 76543', gender: 'female', date_of_birth: '1987-04-18', anniversary: '2014-02-14', address: 'Lower Parel', city: 'Mumbai', notes: 'Anniversary special every Feb', medical_notes: 'Eczema on hands', allergies: ['Latex gloves'], preferences: { communication: 'email', preferred_time: 'afternoon' }, referral_source: 'Referral', loyalty_points: 4100, total_visits: 48, total_spent: 198000, last_visit_at: '2026-07-11T13:00:00Z', is_active: true, created_at: '2023-04-20T00:00:00Z', updated_at: '2026-07-11T13:00:00Z' },
  { id: 'c9', tenant_id: TENANT_ID, first_name: 'Arjun', last_name: 'Nair', email: 'arjun.n@gmail.com', phone: '+91 10987 65432', gender: 'male', date_of_birth: '1998-08-30', address: 'Malad', city: 'Mumbai', notes: '', medical_notes: '', allergies: [], preferences: { communication: 'whatsapp' }, referral_source: 'Social Media', loyalty_points: 200, total_visits: 3, total_spent: 2700, last_visit_at: '2026-06-20T12:00:00Z', is_active: true, created_at: '2026-04-01T00:00:00Z', updated_at: '2026-06-20T12:00:00Z' },
  { id: 'c10', tenant_id: TENANT_ID, first_name: 'Ritu', last_name: 'Agarwal', email: 'ritu.a@hotmail.com', phone: '+91 09876 54321', gender: 'female', date_of_birth: '1994-06-12', address: 'Goregaon', city: 'Mumbai', notes: 'Interested in hair spa packages', medical_notes: '', allergies: [], preferences: { communication: 'all' }, referral_source: 'Google', loyalty_points: 1500, total_visits: 18, total_spent: 45000, last_visit_at: '2026-07-08T10:30:00Z', is_active: true, created_at: '2024-09-05T00:00:00Z', updated_at: '2026-07-08T10:30:00Z' },
  { id: 'c11', tenant_id: TENANT_ID, first_name: 'Pooja', last_name: 'Gupta', email: 'pooja.g@gmail.com', phone: '+91 98712 34567', gender: 'female', date_of_birth: '1996-02-28', address: 'Thane', city: 'Mumbai', notes: '', medical_notes: '', allergies: [], preferences: { communication: 'whatsapp' }, referral_source: 'Walk-in', loyalty_points: 950, total_visits: 14, total_spent: 28900, last_visit_at: '2026-07-06T16:00:00Z', is_active: true, created_at: '2025-01-10T00:00:00Z', updated_at: '2026-07-06T16:00:00Z' },
  { id: 'c12', tenant_id: TENANT_ID, first_name: 'Sanjay', last_name: 'Kumar', email: 'sanjay.k@gmail.com', phone: '+91 87612 45678', gender: 'male', date_of_birth: '1982-10-05', address: 'Vashi', city: 'Navi Mumbai', notes: 'Corporate client', medical_notes: '', allergies: [], preferences: { communication: 'email' }, referral_source: 'Corporate', loyalty_points: 2800, total_visits: 30, total_spent: 67500, last_visit_at: '2026-07-03T11:00:00Z', is_active: true, created_at: '2024-02-28T00:00:00Z', updated_at: '2026-07-03T11:00:00Z' },
]

const serviceCategories: ServiceCategory[] = [
  { id: 'cat1', tenant_id: TENANT_ID, name: 'Hair Care', description: 'Cuts, styling, coloring & treatments', icon: '💇', sort_order: 1, is_active: true, service_count: 6, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat2', tenant_id: TENANT_ID, name: 'Skin Care', description: 'Facials, cleanup & skin treatments', icon: '✨', sort_order: 2, is_active: true, service_count: 5, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat3', tenant_id: TENANT_ID, name: 'Nail Art', description: 'Manicure, pedicure & nail extensions', icon: '💅', sort_order: 3, is_active: true, service_count: 4, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat4', tenant_id: TENANT_ID, name: 'Bridal', description: 'Complete bridal packages', icon: '👰', sort_order: 4, is_active: true, service_count: 3, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat5', tenant_id: TENANT_ID, name: 'Men\'s Grooming', description: 'Haircut, beard & grooming', icon: '🧔', sort_order: 5, is_active: true, service_count: 4, created_at: '2024-01-01T00:00:00Z' },
  { id: 'cat6', tenant_id: TENANT_ID, name: 'Spa & Wellness', description: 'Massage, body wraps & relaxation', icon: '🧖', sort_order: 6, is_active: true, service_count: 4, created_at: '2024-01-01T00:00:00Z' },
]

const services: Service[] = [
  { id: 's1', tenant_id: TENANT_ID, category_id: 'cat1', category_name: 'Hair Care', name: 'Haircut & Styling', description: 'Professional haircut with wash and blow dry', duration_minutes: 45, price: 800, compare_price: 1000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's2', tenant_id: TENANT_ID, category_id: 'cat1', category_name: 'Hair Care', name: 'Hair Coloring', description: 'Global or highlight coloring with premium products', duration_minutes: 120, price: 3500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's3', tenant_id: TENANT_ID, category_id: 'cat1', category_name: 'Hair Care', name: 'Keratin Treatment', description: 'Smoothening treatment for frizz-free hair', duration_minutes: 180, price: 5500, compare_price: 7000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's4', tenant_id: TENANT_ID, category_id: 'cat1', category_name: 'Hair Care', name: 'Hair Spa', description: 'Deep conditioning hair spa treatment', duration_minutes: 60, price: 1500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's5', tenant_id: TENANT_ID, category_id: 'cat1', category_name: 'Hair Care', name: 'Balayage', description: 'Hand-painted highlights for natural look', duration_minutes: 150, price: 6000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's6', tenant_id: TENANT_ID, category_id: 'cat1', category_name: 'Hair Care', name: 'Blow Dry', description: 'Professional blow dry and styling', duration_minutes: 30, price: 500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's7', tenant_id: TENANT_ID, category_id: 'cat2', category_name: 'Skin Care', name: 'Classic Facial', description: 'Deep cleansing facial with massage', duration_minutes: 60, price: 1200, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's8', tenant_id: TENANT_ID, category_id: 'cat2', category_name: 'Skin Care', name: 'Gold Facial', description: 'Premium gold facial for radiant glow', duration_minutes: 75, price: 2500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's9', tenant_id: TENANT_ID, category_id: 'cat2', category_name: 'Skin Care', name: 'Cleanup', description: 'Basic face cleanup with extraction', duration_minutes: 30, price: 600, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's10', tenant_id: TENANT_ID, category_id: 'cat2', category_name: 'Skin Care', name: 'Chemical Peel', description: 'Advanced skin resurfacing treatment', duration_minutes: 45, price: 3000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's11', tenant_id: TENANT_ID, category_id: 'cat2', category_name: 'Skin Care', name: 'De-Tan Treatment', description: 'Full body de-tan with natural ingredients', duration_minutes: 90, price: 2000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's12', tenant_id: TENANT_ID, category_id: 'cat3', category_name: 'Nail Art', name: 'Classic Manicure', description: 'Nail shaping, cuticle care, and polish', duration_minutes: 30, price: 500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's13', tenant_id: TENANT_ID, category_id: 'cat3', category_name: 'Nail Art', name: 'Gel Nails', description: 'Long-lasting gel nail application', duration_minutes: 60, price: 1800, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's14', tenant_id: TENANT_ID, category_id: 'cat3', category_name: 'Nail Art', name: 'Spa Pedicure', description: 'Relaxing pedicure with foot massage', duration_minutes: 45, price: 800, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's15', tenant_id: TENANT_ID, category_id: 'cat3', category_name: 'Nail Art', name: 'Nail Art Design', description: 'Custom nail art with premium designs', duration_minutes: 90, price: 2500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's16', tenant_id: TENANT_ID, category_id: 'cat4', category_name: 'Bridal', name: 'Bridal Makeup', description: 'Complete bridal makeup with airbrush', duration_minutes: 120, price: 15000, compare_price: 20000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's17', tenant_id: TENANT_ID, category_id: 'cat4', category_name: 'Bridal', name: 'Pre-Bridal Package', description: '5-session package: facial, body polish, hair spa, threading, waxing', duration_minutes: 180, price: 12000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's18', tenant_id: TENANT_ID, category_id: 'cat4', category_name: 'Bridal', name: 'Mehndi Application', description: 'Professional bridal mehndi by expert artist', duration_minutes: 240, price: 8000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's19', tenant_id: TENANT_ID, category_id: 'cat5', category_name: "Men's Grooming", name: "Men's Haircut", description: 'Precision cut with wash and style', duration_minutes: 30, price: 500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's20', tenant_id: TENANT_ID, category_id: 'cat5', category_name: "Men's Grooming", name: 'Beard Trim & Shape', description: 'Professional beard grooming and shaping', duration_minutes: 20, price: 300, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's21', tenant_id: TENANT_ID, category_id: 'cat5', category_name: "Men's Grooming", name: 'Royal Shave', description: 'Hot towel shave with premium aftershave', duration_minutes: 30, price: 400, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's22', tenant_id: TENANT_ID, category_id: 'cat5', category_name: "Men's Grooming", name: "Men's Facial", description: 'Deep cleansing facial for men', duration_minutes: 45, price: 900, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's23', tenant_id: TENANT_ID, category_id: 'cat6', category_name: 'Spa & Wellness', name: 'Swedish Massage', description: 'Full body relaxation massage (60 min)', duration_minutes: 60, price: 2500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's24', tenant_id: TENANT_ID, category_id: 'cat6', category_name: 'Spa & Wellness', name: 'Aromatherapy', description: 'Essential oil aromatherapy massage', duration_minutes: 75, price: 3000, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's25', tenant_id: TENANT_ID, category_id: 'cat6', category_name: 'Spa & Wellness', name: 'Body Wrap', description: 'Detoxifying body wrap treatment', duration_minutes: 90, price: 3500, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 's26', tenant_id: TENANT_ID, category_id: 'cat6', category_name: 'Spa & Wellness', name: 'Head Massage', description: 'Relaxing champi head massage', duration_minutes: 30, price: 600, tax_percent: 18, is_active: true, is_online_bookable: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
]

const staffMembers: Staff[] = [
  { id: 'st1', tenant_id: TENANT_ID, role: 'stylist', first_name: 'Neha', last_name: 'Verma', email: 'neha@glamstyle.in', phone: '+91 98765 11111', avatar_url: '', commission_percent: 30, specializations: ['Hair Coloring', 'Balayage', 'Keratin'], bio: 'Senior stylist with 8 years experience', is_active: true, rating: 4.8, total_appointments: 1240, revenue_generated: 2850000, created_at: '2023-01-01T00:00:00Z', updated_at: '2026-07-14T00:00:00Z' },
  { id: 'st2', tenant_id: TENANT_ID, role: 'beautician', first_name: 'Rekha', last_name: 'Iyer', email: 'rekha@glamstyle.in', phone: '+91 98765 22222', avatar_url: '', commission_percent: 25, specializations: ['Bridal Makeup', 'Facials', 'Skin Care'], bio: 'Certified beauty expert', is_active: true, rating: 4.9, total_appointments: 980, revenue_generated: 3200000, created_at: '2023-01-01T00:00:00Z', updated_at: '2026-07-14T00:00:00Z' },
  { id: 'st3', tenant_id: TENANT_ID, role: 'stylist', first_name: 'Amit', last_name: 'Khanna', email: 'amit@glamstyle.in', phone: '+91 98765 33333', avatar_url: '', commission_percent: 25, specializations: ["Men's Grooming", 'Haircut', 'Beard'], bio: "Expert barber and men's grooming specialist", is_active: true, rating: 4.7, total_appointments: 1560, revenue_generated: 1890000, created_at: '2023-03-15T00:00:00Z', updated_at: '2026-07-14T00:00:00Z' },
  { id: 'st4', tenant_id: TENANT_ID, role: 'beautician', first_name: 'Divya', last_name: 'Shah', email: 'divya@glamstyle.in', phone: '+91 98765 44444', avatar_url: '', commission_percent: 20, specializations: ['Nail Art', 'Manicure', 'Pedicure'], bio: 'Creative nail artist', is_active: true, rating: 4.6, total_appointments: 720, revenue_generated: 1250000, created_at: '2024-01-10T00:00:00Z', updated_at: '2026-07-14T00:00:00Z' },
  { id: 'st5', tenant_id: TENANT_ID, role: 'beautician', first_name: 'Sunita', last_name: 'Rao', email: 'sunita@glamstyle.in', phone: '+91 98765 55555', avatar_url: '', commission_percent: 25, specializations: ['Spa', 'Massage', 'Wellness'], bio: 'Certified spa therapist', is_active: true, rating: 4.8, total_appointments: 640, revenue_generated: 1680000, created_at: '2023-06-01T00:00:00Z', updated_at: '2026-07-14T00:00:00Z' },
  { id: 'st6', tenant_id: TENANT_ID, role: 'receptionist', first_name: 'Aisha', last_name: 'Khan', email: 'aisha@glamstyle.in', phone: '+91 98765 66666', avatar_url: '', commission_percent: 0, specializations: ['Front Desk', 'Customer Service'], bio: 'Friendly front desk manager', is_active: true, rating: 4.5, total_appointments: 0, revenue_generated: 0, created_at: '2024-06-01T00:00:00Z', updated_at: '2026-07-14T00:00:00Z' },
  { id: 'st7', tenant_id: TENANT_ID, role: 'stylist', first_name: 'Kiran', last_name: 'Malhotra', email: 'kiran@glamstyle.in', phone: '+91 98765 77777', avatar_url: '', commission_percent: 20, specializations: ['Hair Spa', 'Blow Dry', 'Styling'], bio: 'Junior stylist with creative flair', is_active: true, rating: 4.4, total_appointments: 380, revenue_generated: 680000, created_at: '2025-01-15T00:00:00Z', updated_at: '2026-07-14T00:00:00Z' },
]

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

function makeTime(dayOffset: number, hour: number, minute: number = 0): string {
  const d = new Date(today)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

const appointments: Appointment[] = [
  { id: 'a1', tenant_id: TENANT_ID, customer_id: 'c1', customer_name: 'Priya Sharma', customer_phone: '+91 98765 43210', staff_id: 'st1', staff_name: 'Neha Verma', start_time: makeTime(0, 9, 0), end_time: makeTime(0, 9, 45), status: 'completed', services: [{ id: 'as1', appointment_id: 'a1', service_id: 's1', service_name: 'Haircut & Styling', staff_id: 'st1', staff_name: 'Neha Verma', price: 800, discount: 0, duration_minutes: 45 }], notes: '', total_amount: 800, discount_amount: 0, tax_amount: 144, final_amount: 944, source: 'online', created_at: makeTime(-2, 10), updated_at: makeTime(0, 9, 45) },
  { id: 'a2', tenant_id: TENANT_ID, customer_id: 'c2', customer_name: 'Anita Desai', staff_id: 'st2', staff_name: 'Rekha Iyer', start_time: makeTime(0, 10, 0), end_time: makeTime(0, 11, 15), status: 'in_progress', services: [{ id: 'as2', appointment_id: 'a2', service_id: 's8', service_name: 'Gold Facial', staff_id: 'st2', staff_name: 'Rekha Iyer', price: 2500, discount: 250, duration_minutes: 75 }], notes: 'VIP client', total_amount: 2500, discount_amount: 250, tax_amount: 405, final_amount: 2655, source: 'phone', created_at: makeTime(-1, 14), updated_at: makeTime(0, 10) },
  { id: 'a3', tenant_id: TENANT_ID, customer_id: 'c3', customer_name: 'Rahul Mehta', staff_id: 'st3', staff_name: 'Amit Khanna', start_time: makeTime(0, 10, 30), end_time: makeTime(0, 11, 0), status: 'confirmed', services: [{ id: 'as3', appointment_id: 'a3', service_id: 's19', service_name: "Men's Haircut", staff_id: 'st3', staff_name: 'Amit Khanna', price: 500, discount: 0, duration_minutes: 30 }], notes: '', total_amount: 500, discount_amount: 0, tax_amount: 90, final_amount: 590, source: 'walk_in', created_at: makeTime(0, 8), updated_at: makeTime(0, 8) },
  { id: 'a4', tenant_id: TENANT_ID, customer_id: 'c4', customer_name: 'Sneha Patel', staff_id: 'st1', staff_name: 'Neha Verma', start_time: makeTime(0, 11, 0), end_time: makeTime(0, 13, 30), status: 'scheduled', services: [{ id: 'as4', appointment_id: 'a4', service_id: 's3', service_name: 'Keratin Treatment', staff_id: 'st1', staff_name: 'Neha Verma', price: 5500, discount: 500, duration_minutes: 150 }], notes: 'First time keratin', total_amount: 5500, discount_amount: 500, tax_amount: 900, final_amount: 5900, source: 'online', created_at: makeTime(-3, 20), updated_at: makeTime(-3, 20) },
  { id: 'a5', tenant_id: TENANT_ID, customer_id: 'c5', customer_name: 'Vikram Singh', staff_id: 'st3', staff_name: 'Amit Khanna', start_time: makeTime(0, 12, 0), end_time: makeTime(0, 12, 50), status: 'scheduled', services: [{ id: 'as5a', appointment_id: 'a5', service_id: 's19', service_name: "Men's Haircut", staff_id: 'st3', staff_name: 'Amit Khanna', price: 500, discount: 0, duration_minutes: 30 }, { id: 'as5b', appointment_id: 'a5', service_id: 's20', service_name: 'Beard Trim & Shape', staff_id: 'st3', staff_name: 'Amit Khanna', price: 300, discount: 0, duration_minutes: 20 }], notes: '', total_amount: 800, discount_amount: 0, tax_amount: 144, final_amount: 944, source: 'app', created_at: makeTime(-1, 9), updated_at: makeTime(-1, 9) },
  { id: 'a6', tenant_id: TENANT_ID, customer_id: 'c8', customer_name: 'Meera Kapoor', staff_id: 'st5', staff_name: 'Sunita Rao', start_time: makeTime(0, 14, 0), end_time: makeTime(0, 15, 0), status: 'scheduled', services: [{ id: 'as6', appointment_id: 'a6', service_id: 's23', service_name: 'Swedish Massage', staff_id: 'st5', staff_name: 'Sunita Rao', price: 2500, discount: 0, duration_minutes: 60 }], notes: 'Regular monthly appointment', total_amount: 2500, discount_amount: 0, tax_amount: 450, final_amount: 2950, source: 'online', created_at: makeTime(-5, 11), updated_at: makeTime(-5, 11) },
  { id: 'a7', tenant_id: TENANT_ID, customer_id: 'c10', customer_name: 'Ritu Agarwal', staff_id: 'st4', staff_name: 'Divya Shah', start_time: makeTime(0, 15, 0), end_time: makeTime(0, 16, 30), status: 'scheduled', services: [{ id: 'as7', appointment_id: 'a7', service_id: 's15', service_name: 'Nail Art Design', staff_id: 'st4', staff_name: 'Divya Shah', price: 2500, discount: 0, duration_minutes: 90 }], notes: 'Wedding guest nail art', total_amount: 2500, discount_amount: 0, tax_amount: 450, final_amount: 2950, source: 'online', created_at: makeTime(-2, 16), updated_at: makeTime(-2, 16) },
  { id: 'a8', tenant_id: TENANT_ID, customer_id: 'c6', customer_name: 'Kavita Reddy', staff_id: 'st7', staff_name: 'Kiran Malhotra', start_time: makeTime(0, 16, 0), end_time: makeTime(0, 16, 30), status: 'scheduled', services: [{ id: 'as8', appointment_id: 'a8', service_id: 's6', service_name: 'Blow Dry', staff_id: 'st7', staff_name: 'Kiran Malhotra', price: 500, discount: 0, duration_minutes: 30 }], notes: '', total_amount: 500, discount_amount: 0, tax_amount: 90, final_amount: 590, source: 'walk_in', created_at: makeTime(0, 7), updated_at: makeTime(0, 7) },
  { id: 'a9', tenant_id: TENANT_ID, customer_id: 'c11', customer_name: 'Pooja Gupta', staff_id: 'st2', staff_name: 'Rekha Iyer', start_time: makeTime(0, 17, 0), end_time: makeTime(0, 18, 0), status: 'scheduled', services: [{ id: 'as9', appointment_id: 'a9', service_id: 's7', service_name: 'Classic Facial', staff_id: 'st2', staff_name: 'Rekha Iyer', price: 1200, discount: 0, duration_minutes: 60 }], notes: '', total_amount: 1200, discount_amount: 0, tax_amount: 216, final_amount: 1416, source: 'online', created_at: makeTime(-1, 20), updated_at: makeTime(-1, 20) },
  // Past appointments
  { id: 'a10', tenant_id: TENANT_ID, customer_id: 'c1', customer_name: 'Priya Sharma', staff_id: 'st1', staff_name: 'Neha Verma', start_time: makeTime(-1, 10), end_time: makeTime(-1, 12, 30), status: 'completed', services: [{ id: 'as10', appointment_id: 'a10', service_id: 's5', service_name: 'Balayage', staff_id: 'st1', staff_name: 'Neha Verma', price: 6000, discount: 0, duration_minutes: 150 }], notes: '', total_amount: 6000, discount_amount: 0, tax_amount: 1080, final_amount: 7080, source: 'online', created_at: makeTime(-4, 10), updated_at: makeTime(-1, 12, 30) },
  { id: 'a11', tenant_id: TENANT_ID, customer_id: 'c7', customer_name: 'Deepak Joshi', staff_id: 'st3', staff_name: 'Amit Khanna', start_time: makeTime(-2, 18), end_time: makeTime(-2, 18, 30), status: 'completed', services: [{ id: 'as11', appointment_id: 'a11', service_id: 's19', service_name: "Men's Haircut", staff_id: 'st3', staff_name: 'Amit Khanna', price: 500, discount: 0, duration_minutes: 30 }], notes: '', total_amount: 500, discount_amount: 0, tax_amount: 90, final_amount: 590, source: 'walk_in', created_at: makeTime(-2, 17), updated_at: makeTime(-2, 18, 30) },
  { id: 'a12', tenant_id: TENANT_ID, customer_id: 'c9', customer_name: 'Arjun Nair', staff_id: 'st3', staff_name: 'Amit Khanna', start_time: makeTime(-3, 14), end_time: makeTime(-3, 14, 30), status: 'no_show', services: [{ id: 'as12', appointment_id: 'a12', service_id: 's19', service_name: "Men's Haircut", staff_id: 'st3', staff_name: 'Amit Khanna', price: 500, discount: 0, duration_minutes: 30 }], notes: 'Did not show up, no prior notice', total_amount: 500, discount_amount: 0, tax_amount: 90, final_amount: 590, source: 'online', created_at: makeTime(-5, 10), updated_at: makeTime(-3, 15) },
  // Future
  { id: 'a13', tenant_id: TENANT_ID, customer_id: 'c4', customer_name: 'Sneha Patel', staff_id: 'st2', staff_name: 'Rekha Iyer', start_time: makeTime(1, 11), end_time: makeTime(1, 13), status: 'confirmed', services: [{ id: 'as13', appointment_id: 'a13', service_id: 's16', service_name: 'Bridal Makeup', staff_id: 'st2', staff_name: 'Rekha Iyer', price: 15000, discount: 1500, duration_minutes: 120 }], notes: 'Trial bridal look', total_amount: 15000, discount_amount: 1500, tax_amount: 2430, final_amount: 15930, source: 'phone', created_at: makeTime(-7, 10), updated_at: makeTime(-7, 10) },
  { id: 'a14', tenant_id: TENANT_ID, customer_id: 'c2', customer_name: 'Anita Desai', staff_id: 'st5', staff_name: 'Sunita Rao', start_time: makeTime(2, 10), end_time: makeTime(2, 11, 15), status: 'scheduled', services: [{ id: 'as14', appointment_id: 'a14', service_id: 's24', service_name: 'Aromatherapy', staff_id: 'st5', staff_name: 'Sunita Rao', price: 3000, discount: 0, duration_minutes: 75 }], notes: '', total_amount: 3000, discount_amount: 0, tax_amount: 540, final_amount: 3540, source: 'online', created_at: makeTime(-1, 19), updated_at: makeTime(-1, 19) },
]

const invoices: Invoice[] = [
  { id: 'inv1', tenant_id: TENANT_ID, invoice_number: 'GS-2026-001', customer_id: 'c1', customer_name: 'Priya Sharma', customer_phone: '+91 98765 43210', appointment_id: 'a1', items: [{ id: 'ii1', invoice_id: 'inv1', description: 'Haircut & Styling', quantity: 1, unit_price: 800, discount: 0, tax_percent: 18, total: 944, service_id: 's1' }], subtotal: 800, discount_amount: 0, tax_amount: 144, total_amount: 944, status: 'paid', payment_method: 'upi', due_date: makeTime(0, 23, 59), gst_number: '27AABCG1234A1Z5', created_at: makeTime(0, 9, 50), updated_at: makeTime(0, 9, 50) },
  { id: 'inv2', tenant_id: TENANT_ID, invoice_number: 'GS-2026-002', customer_id: 'c2', customer_name: 'Anita Desai', appointment_id: 'a2', items: [{ id: 'ii2', invoice_id: 'inv2', description: 'Gold Facial', quantity: 1, unit_price: 2500, discount: 250, tax_percent: 18, total: 2655, service_id: 's8' }], subtotal: 2500, discount_amount: 250, tax_amount: 405, total_amount: 2655, status: 'pending', payment_method: 'card', due_date: makeTime(7, 23, 59), created_at: makeTime(0, 11, 20), updated_at: makeTime(0, 11, 20) },
  { id: 'inv3', tenant_id: TENANT_ID, invoice_number: 'GS-2026-003', customer_id: 'c1', customer_name: 'Priya Sharma', appointment_id: 'a10', items: [{ id: 'ii3', invoice_id: 'inv3', description: 'Balayage', quantity: 1, unit_price: 6000, discount: 0, tax_percent: 18, total: 7080, service_id: 's5' }], subtotal: 6000, discount_amount: 0, tax_amount: 1080, total_amount: 7080, status: 'paid', payment_method: 'card', due_date: makeTime(-1, 23, 59), created_at: makeTime(-1, 12, 35), updated_at: makeTime(-1, 12, 35) },
  { id: 'inv4', tenant_id: TENANT_ID, invoice_number: 'GS-2026-004', customer_id: 'c12', customer_name: 'Sanjay Kumar', items: [{ id: 'ii4a', invoice_id: 'inv4', description: "Men's Haircut", quantity: 1, unit_price: 500, discount: 0, tax_percent: 18, total: 590, service_id: 's19' }, { id: 'ii4b', invoice_id: 'inv4', description: 'Beard Trim & Shape', quantity: 1, unit_price: 300, discount: 0, tax_percent: 18, total: 354 }], subtotal: 800, discount_amount: 0, tax_amount: 144, total_amount: 944, status: 'paid', payment_method: 'cash', due_date: makeTime(-3, 23, 59), created_at: makeTime(-3, 11, 15), updated_at: makeTime(-3, 11, 15) },
  { id: 'inv5', tenant_id: TENANT_ID, invoice_number: 'GS-2026-005', customer_id: 'c8', customer_name: 'Meera Kapoor', items: [{ id: 'ii5', invoice_id: 'inv5', description: 'Swedish Massage', quantity: 1, unit_price: 2500, discount: 0, tax_percent: 18, total: 2950 }], subtotal: 2500, discount_amount: 0, tax_amount: 450, total_amount: 2950, status: 'overdue', due_date: makeTime(-5, 23, 59), created_at: makeTime(-7, 15), updated_at: makeTime(-7, 15) },
]

const products: Product[] = [
  { id: 'p1', tenant_id: TENANT_ID, name: "L'Oréal Hair Serum", description: 'Smoothening serum 100ml', sku: 'LOR-SER-001', barcode: '8901526401234', category: 'Hair Care', brand: "L'Oréal", cost_price: 350, selling_price: 599, tax_percent: 18, stock_quantity: 24, min_stock_level: 5, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'p2', tenant_id: TENANT_ID, name: 'Matrix Shampoo', description: 'Color protect shampoo 500ml', sku: 'MAT-SHP-001', category: 'Hair Care', brand: 'Matrix', cost_price: 420, selling_price: 750, tax_percent: 18, stock_quantity: 18, min_stock_level: 5, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'p3', tenant_id: TENANT_ID, name: 'OPI Nail Polish Set', description: 'Top selling colors (set of 6)', sku: 'OPI-NP-006', category: 'Nail Care', brand: 'OPI', cost_price: 1800, selling_price: 2999, tax_percent: 18, stock_quantity: 3, min_stock_level: 5, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'p4', tenant_id: TENANT_ID, name: 'VLCC Facial Kit', description: 'Gold facial kit 6 sachets', sku: 'VLC-FK-001', category: 'Skin Care', brand: 'VLCC', cost_price: 280, selling_price: 450, tax_percent: 18, stock_quantity: 35, min_stock_level: 10, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'p5', tenant_id: TENANT_ID, name: 'Schwarzkopf Hair Color', description: 'Professional hair color 60ml', sku: 'SCH-HC-001', category: 'Hair Color', brand: 'Schwarzkopf', cost_price: 220, selling_price: 380, tax_percent: 18, stock_quantity: 42, min_stock_level: 10, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'p6', tenant_id: TENANT_ID, name: 'Wella Conditioner', description: 'Intense repair conditioner 250ml', sku: 'WEL-CON-001', category: 'Hair Care', brand: 'Wella', cost_price: 380, selling_price: 650, tax_percent: 18, stock_quantity: 2, min_stock_level: 5, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'p7', tenant_id: TENANT_ID, name: 'Massage Oil - Lavender', description: 'Aromatherapy massage oil 200ml', sku: 'ARO-MO-001', category: 'Spa', brand: 'Forest Essentials', cost_price: 450, selling_price: 850, tax_percent: 18, stock_quantity: 12, min_stock_level: 3, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
  { id: 'p8', tenant_id: TENANT_ID, name: 'Disposable Gloves Box', description: 'Nitrile gloves (100 pcs)', sku: 'SUP-GL-001', category: 'Supplies', brand: 'SafeHands', cost_price: 350, selling_price: 350, tax_percent: 18, stock_quantity: 8, min_stock_level: 3, is_active: true, created_at: '2024-01-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z' },
]

const membershipPlans: MembershipPlan[] = [
  { id: 'mp1', tenant_id: TENANT_ID, name: 'Silver', description: 'Basic membership with standard perks', price: 2999, duration_days: 90, max_services: 6, discount_percent: 10, benefits: ['10% off all services', '6 services in 3 months', 'Priority booking', 'Birthday bonus points'], is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp2', tenant_id: TENANT_ID, name: 'Gold', description: 'Premium membership for regulars', price: 5999, duration_days: 180, max_services: 15, discount_percent: 20, benefits: ['20% off all services', '15 services in 6 months', 'Priority booking', 'Free hair spa monthly', 'Birthday & anniversary bonus', 'Complimentary drink'], is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'mp3', tenant_id: TENANT_ID, name: 'Platinum', description: 'Ultimate luxury membership', price: 14999, duration_days: 365, max_services: -1, discount_percent: 30, benefits: ['30% off all services', 'Unlimited services', 'VIP priority booking', 'Free monthly hair spa + facial', 'Personal stylist', 'Exclusive event invites', 'Gift hamper on anniversary'], is_active: true, created_at: '2024-01-01T00:00:00Z' },
]

const reviews: Review[] = [
  { id: 'r1', tenant_id: TENANT_ID, customer_id: 'c2', customer_name: 'Anita Desai', appointment_id: 'a2', rating: 5, comment: 'Absolutely amazing service! Rekha is a genius with facials. My skin has never looked better. Will definitely be back!', reply: 'Thank you so much Anita! We love having you as our valued client. See you soon! 💕', replied_at: makeTime(-1, 10), is_published: true, created_at: makeTime(-2, 15) },
  { id: 'r2', tenant_id: TENANT_ID, customer_id: 'c4', customer_name: 'Sneha Patel', rating: 5, comment: 'The bridal package was worth every rupee. All my friends asked about my makeup artist. Highly recommend GlamStyle!', is_published: true, created_at: makeTime(-5, 11) },
  { id: 'r3', tenant_id: TENANT_ID, customer_id: 'c5', customer_name: 'Vikram Singh', rating: 4, comment: 'Great haircut by Amit. Quick, professional, and exactly what I asked for. The only suggestion is to reduce waiting time.', reply: 'Thanks Vikram! We appreciate the feedback. We\'ve recently introduced our online booking system to help reduce wait times.', replied_at: makeTime(-3, 9), is_published: true, created_at: makeTime(-4, 19) },
  { id: 'r4', tenant_id: TENANT_ID, customer_id: 'c8', customer_name: 'Meera Kapoor', rating: 5, comment: 'The Swedish massage by Sunita was heavenly. The ambiance is so relaxing. This is my monthly therapy now!', is_published: true, created_at: makeTime(-7, 16) },
  { id: 'r5', tenant_id: TENANT_ID, customer_id: 'c3', customer_name: 'Rahul Mehta', rating: 3, comment: 'Decent haircut but the salon was quite crowded. Had to wait 20 minutes past my appointment time.', is_published: true, created_at: makeTime(-10, 20) },
]

const revenueData: RevenueDataPoint[] = [
  { month: 'Aug 25', revenue: 285000, appointments: 142, customers: 89 },
  { month: 'Sep 25', revenue: 312000, appointments: 158, customers: 95 },
  { month: 'Oct 25', revenue: 378000, appointments: 185, customers: 112 },
  { month: 'Nov 25', revenue: 425000, appointments: 198, customers: 128 },
  { month: 'Dec 25', revenue: 520000, appointments: 245, customers: 156 },
  { month: 'Jan 26', revenue: 395000, appointments: 189, customers: 118 },
  { month: 'Feb 26', revenue: 410000, appointments: 195, customers: 124 },
  { month: 'Mar 26', revenue: 445000, appointments: 210, customers: 135 },
  { month: 'Apr 26', revenue: 468000, appointments: 218, customers: 142 },
  { month: 'May 26', revenue: 498000, appointments: 232, customers: 148 },
  { month: 'Jun 26', revenue: 535000, appointments: 248, customers: 158 },
  { month: 'Jul 26', revenue: 452300, appointments: 186, customers: 132 },
]

const dashboardStats: DashboardStats = {
  today_revenue: 45230,
  today_appointments: 18,
  active_customers: 1247,
  pending_payments: 12450,
  revenue_change: 12.5,
  appointments_change: 8.3,
  customers_change: 5.2,
  in_progress_count: 3,
  no_show_count: 1,
  pending_invoice_count: 3,
}

const notifications: Notification[] = [
  { id: 'n1', tenant_id: TENANT_ID, title: 'New Online Booking', message: 'Priya Sharma booked Haircut & Styling for today 9:00 AM', type: 'appointment', is_read: false, action_url: '/dashboard/appointments', created_at: makeTime(0, 7, 30) },
  { id: 'n2', tenant_id: TENANT_ID, title: 'Payment Received', message: '₹7,080 received from Priya Sharma via Card', type: 'payment', is_read: false, action_url: '/dashboard/billing', created_at: makeTime(-1, 12, 40) },
  { id: 'n3', tenant_id: TENANT_ID, title: 'Low Stock Alert', message: 'OPI Nail Polish Set is below minimum stock level (3 remaining)', type: 'warning', is_read: false, action_url: '/dashboard/inventory', created_at: makeTime(-1, 9) },
  { id: 'n4', tenant_id: TENANT_ID, title: 'New Review', message: 'Anita Desai left a 5-star review', type: 'success', is_read: true, action_url: '/dashboard/reviews', created_at: makeTime(-2, 15) },
  { id: 'n5', tenant_id: TENANT_ID, title: 'Membership Expiring', message: "Sanjay Kumar's Gold membership expires in 5 days", type: 'warning', is_read: false, action_url: '/dashboard/customers', created_at: makeTime(-1, 8) },
]

const aiInsights: AIInsight[] = [
  { id: 'ai1', tenant_id: TENANT_ID, type: 'revenue_forecast', title: 'Revenue Trending Up', description: 'Based on current booking patterns, your revenue is projected to reach ₹5.8L this month — a 12% increase from last month. Weekend slots are driving growth.', data: { projected: 580000, growth: 12, confidence: 0.85 }, priority: 'medium', is_read: false, is_dismissed: false, created_at: makeTime(0, 6), expires_at: makeTime(30, 0) },
  { id: 'ai2', tenant_id: TENANT_ID, type: 'churn_prediction', title: '8 Customers at Risk', description: '8 regular customers haven\'t visited in 45+ days. Sending them a 15% discount offer could recover ₹35,000 in potential revenue.', data: { at_risk: 8, potential_revenue: 35000, suggested_discount: 15 }, priority: 'high', is_read: false, is_dismissed: false, created_at: makeTime(-1, 6), expires_at: makeTime(14, 0) },
  { id: 'ai3', tenant_id: TENANT_ID, type: 'inventory_alert', title: 'Restock 3 Products', description: 'OPI Nail Polish Set, Wella Conditioner, and disposable gloves are running low. Estimated stockout in 5-7 days at current consumption rate.', data: { products: ['p3', 'p6', 'p8'], days_until_stockout: 6 }, priority: 'high', is_read: false, is_dismissed: false, created_at: makeTime(0, 6), expires_at: makeTime(7, 0) },
  { id: 'ai4', tenant_id: TENANT_ID, type: 'marketing_suggestion', title: 'Monsoon Special Campaign', description: 'Launch a "Monsoon Hair Care" package combining Hair Spa + Serum at ₹1,799. Based on last year\'s data, hair treatments see 25% more demand during monsoon.', data: { suggested_price: 1799, expected_bookings: 45, expected_revenue: 80955 }, priority: 'medium', is_read: false, is_dismissed: false, created_at: makeTime(-2, 6), expires_at: makeTime(21, 0) },
  { id: 'ai5', tenant_id: TENANT_ID, type: 'scheduling_optimization', title: 'Optimize Thursday Schedule', description: 'Thursday afternoons (2-5 PM) have 40% idle capacity. Consider offering flash discounts for this slot to increase utilization from 60% to 85%.', data: { day: 'Thursday', current_utilization: 60, target_utilization: 85, idle_hours: 3 }, priority: 'low', is_read: false, is_dismissed: false, created_at: makeTime(-1, 6), expires_at: makeTime(7, 0) },
  { id: 'ai6', tenant_id: TENANT_ID, type: 'performance_analysis', title: 'Top Performer: Rekha Iyer', description: 'Rekha generated ₹1.2L this month with a 4.9 average rating. She\'s your highest revenue generator per hour. Consider promoting her premium services.', data: { staff_id: 'st2', revenue: 120000, rating: 4.9, appointments: 42 }, priority: 'low', is_read: true, is_dismissed: false, created_at: makeTime(-3, 6), expires_at: makeTime(14, 0) },
]

const campaigns: Campaign[] = [
  { id: 'camp1', tenant_id: TENANT_ID, name: 'Weekend Flash Sale', type: 'whatsapp', status: 'sent', subject: '💇 50% Off This Weekend!', content: 'Hi {name}! Get 50% off on all hair services this Saturday & Sunday. Book now at {salon}!', target_segment: 'All Customers', scheduled_at: makeTime(-3, 10), sent_at: makeTime(-3, 10), total_recipients: 850, total_delivered: 823, total_opened: 654, total_clicked: 187, created_by: 'st1', created_at: makeTime(-5, 14) },
  { id: 'camp2', tenant_id: TENANT_ID, name: 'July Birthday Wishes', type: 'whatsapp', status: 'sent', subject: '🎂 Happy Birthday!', content: 'Happy Birthday {name}! 🎉 Enjoy a complimentary Head Massage on your special day. Valid this week!', target_segment: 'July Birthdays', sent_at: makeTime(-7, 9), total_recipients: 34, total_delivered: 34, total_opened: 28, total_clicked: 12, created_by: 'st6', created_at: makeTime(-8, 11) },
  { id: 'camp3', tenant_id: TENANT_ID, name: 'Monsoon Hair Care Package', type: 'email', status: 'draft', subject: '🌧️ Monsoon Special: Hair Spa + Serum @ ₹1,799', content: 'Beat the monsoon frizz! Book our special Hair Spa + Serum combo at just ₹1,799 (save ₹500). Limited slots available.', target_segment: 'Active Customers', total_recipients: 0, total_delivered: 0, total_opened: 0, total_clicked: 0, created_by: 'st1', created_at: makeTime(-1, 16) },
]

const loyaltyTransactions: LoyaltyTransaction[] = [
  { id: 'lt1', tenant_id: TENANT_ID, customer_id: 'c1', customer_name: 'Priya Sharma', points: 80, type: 'earned', description: 'Earned from Haircut & Styling', created_at: makeTime(0, 9, 50) },
  { id: 'lt2', tenant_id: TENANT_ID, customer_id: 'c2', customer_name: 'Anita Desai', points: 250, type: 'earned', description: 'Earned from Gold Facial', created_at: makeTime(0, 11, 20) },
  { id: 'lt3', tenant_id: TENANT_ID, customer_id: 'c1', customer_name: 'Priya Sharma', points: -500, type: 'redeemed', description: 'Redeemed for ₹500 discount', created_at: makeTime(-5, 10) },
  { id: 'lt4', tenant_id: TENANT_ID, customer_id: 'c4', customer_name: 'Sneha Patel', points: 200, type: 'bonus', description: 'Referral bonus - referred Kavita Reddy', created_at: makeTime(-10, 12) },
]

const expenses: Expense[] = [
  { id: 'e1', tenant_id: TENANT_ID, category: 'Rent', description: 'Monthly shop rent - July 2026', amount: 85000, date: makeTime(-15, 0), vendor: 'Landlord', created_by: 'owner', created_at: makeTime(-15, 10) },
  { id: 'e2', tenant_id: TENANT_ID, category: 'Utilities', description: 'Electricity bill - June 2026', amount: 12500, date: makeTime(-10, 0), vendor: 'MSEB', created_by: 'owner', created_at: makeTime(-10, 11) },
  { id: 'e3', tenant_id: TENANT_ID, category: 'Inventory', description: "L'Oréal products restock", amount: 28000, date: makeTime(-7, 0), vendor: "L'Oréal India", created_by: 'owner', created_at: makeTime(-7, 14) },
  { id: 'e4', tenant_id: TENANT_ID, category: 'Marketing', description: 'Instagram & Google Ads - July', amount: 15000, date: makeTime(-5, 0), vendor: 'Meta/Google', created_by: 'owner', created_at: makeTime(-5, 9) },
  { id: 'e5', tenant_id: TENANT_ID, category: 'Maintenance', description: 'AC servicing', amount: 3500, date: makeTime(-3, 0), vendor: 'CoolTech Services', created_by: 'owner', created_at: makeTime(-3, 16) },
]

const auditLogs: AuditLog[] = [
  { id: 'al1', tenant_id: TENANT_ID, user_id: 'st6', user_name: 'Aisha Khan', action: 'create', entity_type: 'appointment', entity_id: 'a1', new_values: { customer: 'Priya Sharma', service: 'Haircut & Styling' }, ip_address: '103.45.67.89', created_at: makeTime(-2, 10) },
  { id: 'al2', tenant_id: TENANT_ID, user_id: 'st1', user_name: 'Neha Verma', action: 'update', entity_type: 'appointment', entity_id: 'a1', old_values: { status: 'scheduled' }, new_values: { status: 'completed' }, ip_address: '103.45.67.90', created_at: makeTime(0, 9, 45) },
  { id: 'al3', tenant_id: TENANT_ID, user_id: 'st6', user_name: 'Aisha Khan', action: 'create', entity_type: 'invoice', entity_id: 'inv1', new_values: { customer: 'Priya Sharma', amount: 944 }, ip_address: '103.45.67.89', created_at: makeTime(0, 9, 50) },
]

const staffSchedules: StaffSchedule[] = [
  // Neha Verma
  { id: 'ss1', staff_id: 'st1', day_of_week: 1, start_time: '09:00', end_time: '18:00', is_working: true },
  { id: 'ss2', staff_id: 'st1', day_of_week: 2, start_time: '09:00', end_time: '18:00', is_working: true },
  { id: 'ss3', staff_id: 'st1', day_of_week: 3, start_time: '09:00', end_time: '18:00', is_working: true },
  { id: 'ss4', staff_id: 'st1', day_of_week: 4, start_time: '09:00', end_time: '18:00', is_working: true },
  { id: 'ss5', staff_id: 'st1', day_of_week: 5, start_time: '09:00', end_time: '18:00', is_working: true },
  { id: 'ss6', staff_id: 'st1', day_of_week: 6, start_time: '10:00', end_time: '16:00', is_working: true },
  { id: 'ss7', staff_id: 'st1', day_of_week: 0, start_time: '00:00', end_time: '00:00', is_working: false },
  // Amit Khanna
  { id: 'ss8', staff_id: 'st3', day_of_week: 1, start_time: '10:00', end_time: '20:00', is_working: true },
  { id: 'ss9', staff_id: 'st3', day_of_week: 2, start_time: '10:00', end_time: '20:00', is_working: true },
  { id: 'ss10', staff_id: 'st3', day_of_week: 3, start_time: '10:00', end_time: '20:00', is_working: true },
  { id: 'ss11', staff_id: 'st3', day_of_week: 4, start_time: '10:00', end_time: '20:00', is_working: true },
  { id: 'ss12', staff_id: 'st3', day_of_week: 5, start_time: '10:00', end_time: '20:00', is_working: true },
  { id: 'ss13', staff_id: 'st3', day_of_week: 6, start_time: '10:00', end_time: '20:00', is_working: true },
  { id: 'ss14', staff_id: 'st3', day_of_week: 0, start_time: '00:00', end_time: '00:00', is_working: false },
]

export function useMockData() {
  return {
    customers,
    serviceCategories,
    services,
    staff: staffMembers,
    appointments,
    invoices,
    products,
    membershipPlans,
    reviews,
    revenueData,
    dashboardStats,
    notifications,
    aiInsights,
    campaigns,
    loyaltyTransactions,
    expenses,
    auditLogs,
    staffSchedules,
    tenant: {
      id: TENANT_ID,
      name: 'GlamStyle Salon & Spa',
      slug: 'glamstyle',
      email: 'hello@glamstyle.in',
      phone: '+91 22 2634 5678',
      address: '42, Turner Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      plan: 'professional' as TenantPlan,
      status: 'active' as TenantStatus,
      settings: {
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        date_format: 'DD/MM/YYYY',
        gst_number: '27AABCG1234A1Z5',
        default_tax_percent: 18,
        booking_advance_days: 30,
        cancellation_hours: 4,
        auto_confirm_bookings: false,
        send_reminders: true,
        business_hours: [
          { day: 0, is_open: false, open_time: '00:00', close_time: '00:00' },
          { day: 1, is_open: true, open_time: '09:00', close_time: '20:00' },
          { day: 2, is_open: true, open_time: '09:00', close_time: '20:00' },
          { day: 3, is_open: true, open_time: '09:00', close_time: '20:00' },
          { day: 4, is_open: true, open_time: '09:00', close_time: '20:00' },
          { day: 5, is_open: true, open_time: '09:00', close_time: '20:00' },
          { day: 6, is_open: true, open_time: '10:00', close_time: '18:00' },
        ],
      },
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    } as Tenant,
  }
}
