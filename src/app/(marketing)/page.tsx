'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Users, Brain, CreditCard, BarChart3, Building2, Sparkles, Shield, Zap, TrendingUp, Star, ArrowRight, Check, ChevronRight, Clock, MessageSquare, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }
const stagger = { visible: { transition: { staggerChildren: 0.1 } } }

const features = [
  { icon: Calendar, title: 'Smart Scheduling', description: 'AI-optimized appointments with drag-and-drop calendar, online booking, and conflict detection.', color: 'from-violet-500 to-purple-600' },
  { icon: Users, title: 'Client Management', description: 'Complete CRM with visit history, preferences, medical notes, loyalty tracking, and automated follow-ups.', color: 'from-pink-500 to-rose-600' },
  { icon: Brain, title: 'AI Insights', description: 'Revenue forecasting, churn prediction, inventory alerts, and smart marketing suggestions powered by AI.', color: 'from-blue-500 to-indigo-600' },
  { icon: CreditCard, title: 'POS & Billing', description: 'GST invoicing, multi-payment support (UPI/Card/Cash), split payments, and automated receipts.', color: 'from-teal-500 to-emerald-600' },
  { icon: BarChart3, title: 'Staff Management', description: 'Shift scheduling, commission tracking, performance analytics, leave management, and payroll.', color: 'from-amber-500 to-orange-600' },
  { icon: Building2, title: 'Multi-Branch', description: 'Central dashboard for all locations with branch comparison, staff transfer, and inventory management.', color: 'from-green-500 to-teal-600' },
]

const aiFeatures = [
  { icon: TrendingUp, title: 'Revenue Forecast', desc: 'Predict monthly revenue with 92% accuracy using booking patterns and seasonal trends.' },
  { icon: Target, title: 'Churn Prediction', desc: 'Identify at-risk customers before they leave and automatically send win-back campaigns.' },
  { icon: Clock, title: 'Smart Scheduling', desc: 'AI optimizes staff schedules to maximize chair utilization and reduce idle time by 40%.' },
  { icon: MessageSquare, title: 'Sentiment Analysis', desc: 'Analyze customer reviews and feedback to identify improvement areas automatically.' },
]

const stats = [
  { value: '50,000+', label: 'Salons Trust Us' },
  { value: '5M+', label: 'Appointments Booked' },
  { value: '₹500Cr+', label: 'Revenue Processed' },
  { value: '99.9%', label: 'Uptime SLA' },
]

const testimonials = [
  { name: 'Nisha Malhotra', salon: 'Nisha\'s Beauty Studio, Delhi', rating: 5, quote: 'SalonAI transformed our booking system. We reduced no-shows by 60% and increased revenue by 35% in just 3 months. The AI insights are incredibly accurate!', color: 'from-violet-500 to-purple-500' },
  { name: 'Rajesh Khanna', salon: 'The Grooming Room, Bangalore', rating: 5, quote: 'Managing 3 branches was a nightmare before SalonAI. Now I can see everything from one dashboard. The staff scheduling AI alone saved us 10 hours per week.', color: 'from-pink-500 to-rose-500' },
  { name: 'Fatima Sheikh', salon: 'Glow & Glamour Spa, Mumbai', rating: 5, quote: 'The customer CRM is phenomenal. We remember every client\'s preferences, allergies, and favorite services. Our retention rate jumped from 45% to 78%.', color: 'from-teal-500 to-emerald-500' },
]

const faqs = [
  { q: 'How long does it take to set up SalonAI?', a: 'Most salons are up and running within 30 minutes. Our onboarding wizard guides you through setting up services, staff, and business hours. We also offer free data migration from your existing software.' },
  { q: 'Can I use SalonAI on my phone?', a: 'Yes! SalonAI is a Progressive Web App (PWA) that works beautifully on any device — phone, tablet, or desktop. Install it directly from your browser for a native app-like experience.' },
  { q: 'What payment gateways do you support?', a: 'We support Stripe and Razorpay for subscription billing. For your salon POS, customers can pay via UPI, credit/debit cards, net banking, wallets, and cash. We also support split payments.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use bank-grade encryption, Row Level Security (RLS) in our database, 2FA authentication, and comply with GDPR. Your salon\'s data is completely isolated from other salons.' },
  { q: 'Can I manage multiple branches?', a: 'Yes! Our Professional and Enterprise plans support multi-branch management with a central dashboard, inter-branch inventory transfers, staff transfers, and consolidated reporting.' },
  { q: 'What AI features are included?', a: 'Our AI suite includes revenue forecasting, customer churn prediction, smart scheduling optimization, inventory alerts, marketing suggestions, sentiment analysis, and an embedded AI chat assistant.' },
  { q: 'Do you offer a free trial?', a: 'Yes! Start with a 14-day free trial with full access to all Professional features. No credit card required. Cancel anytime.' },
  { q: 'Can I export my data?', a: 'Yes, you can export all your data including customer records, appointments, invoices, and reports in PDF and Excel formats at any time.' },
]

export default function HomePage() {
  const [annual, setAnnual] = useState(false)

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger} className="text-center lg:text-left">
              <motion.div variants={fadeUp}>
                <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
                  <Sparkles className="h-3.5 w-3.5 mr-1.5 text-violet-500" /> Powered by AI — Now with Smart Scheduling
                </Badge>
              </motion.div>
              <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]">
                <span className="gradient-text">AI-Powered</span> Salon Management That{' '}
                <span className="gradient-text">Grows Your Business</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Automate appointments, delight clients, track revenue, and grow with intelligent insights. The all-in-one platform trusted by 50,000+ salons across India.
              </motion.p>
              <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild variant="gradient" size="lg" className="text-base px-8 shadow-xl shadow-violet-500/25">
                  <Link href="/signup">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base px-8">
                  <Link href="/contact">
                    Book a Demo
                  </Link>
                </Button>
              </motion.div>
              <motion.div variants={fadeUp} className="mt-8 flex items-center gap-6 justify-center lg:justify-start text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> 14-day free trial</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> No credit card</span>
                <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-green-500" /> Cancel anytime</span>
              </motion.div>
            </motion.div>

            {/* Dashboard Mockup */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotateY: -5 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
                {/* Fake browser bar */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="h-6 rounded-lg bg-muted flex items-center px-3 text-xs text-muted-foreground">app.salonai.in/dashboard</div>
                  </div>
                </div>
                {/* Fake Dashboard */}
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div><div className="h-3 w-32 bg-foreground/10 rounded" /><div className="h-2 w-20 bg-muted rounded mt-1.5" /></div>
                    <div className="flex gap-2"><div className="h-8 w-20 rounded-lg bg-primary/20" /><div className="h-8 w-8 rounded-lg bg-muted" /></div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Revenue', value: '₹45,230', color: 'bg-violet-500/10 border-violet-500/20', change: '+12.5%' },
                      { label: 'Appointments', value: '18', color: 'bg-pink-500/10 border-pink-500/20', change: '+8.3%' },
                      { label: 'Customers', value: '1,247', color: 'bg-teal-500/10 border-teal-500/20', change: '+5.2%' },
                      { label: 'Payments', value: '₹12,450', color: 'bg-amber-500/10 border-amber-500/20', change: '3 pending' },
                    ].map((stat) => (
                      <div key={stat.label} className={`p-3 rounded-xl border ${stat.color}`}>
                        <div className="text-[10px] text-muted-foreground">{stat.label}</div>
                        <div className="text-sm font-bold mt-0.5">{stat.value}</div>
                        <div className="text-[10px] text-green-500 mt-0.5">{stat.change}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-32 rounded-xl bg-gradient-to-t from-violet-500/5 to-transparent border border-border p-3">
                    <div className="text-[10px] font-medium mb-2">Revenue Trend</div>
                    <svg viewBox="0 0 300 80" className="w-full h-16">
                      <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.3" /><stop offset="100%" stopColor="#7c3aed" stopOpacity="0" /></linearGradient></defs>
                      <path d="M0,60 Q30,55 60,50 T120,35 T180,40 T240,25 T300,15" fill="none" stroke="#7c3aed" strokeWidth="2" />
                      <path d="M0,60 Q30,55 60,50 T120,35 T180,40 T240,25 T300,15 L300,80 L0,80 Z" fill="url(#grad)" />
                    </svg>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="text-[10px] font-medium">Today&apos;s Schedule</div>
                      {['9:00 AM - Priya S. — Haircut', '10:00 AM - Anita D. — Gold Facial', '11:00 AM - Sneha P. — Keratin'].map((apt) => (
                        <div key={apt} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 text-[10px]">
                          <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                          {apt}
                        </div>
                      ))}
                    </div>
                    <div className="w-32 space-y-2">
                      <div className="text-[10px] font-medium">AI Insights</div>
                      <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px]">
                        <span className="text-amber-600">⚡</span> Revenue trending up 12%
                      </div>
                      <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[10px]">
                        <span className="text-red-600">⚠</span> 3 products low stock
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute -bottom-4 -left-8 p-3 rounded-xl glass-card shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xs">✓</div>
                  <div><div className="text-xs font-semibold">Booking Confirmed</div><div className="text-[10px] text-muted-foreground">Priya Sharma • 9:00 AM</div></div>
                </div>
              </motion.div>
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }} className="absolute -top-4 -right-6 p-3 rounded-xl glass-card shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs">AI</div>
                  <div><div className="text-xs font-semibold">Revenue ↑ 12.5%</div><div className="text-[10px] text-muted-foreground">This month vs last</div></div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-8">Trusted by leading salons and spas across India</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-50">
            {['Lakme Salon', 'Naturals', 'Green Trends', 'Jawed Habib', 'VLCC', 'Bodycraft'].map((brand) => (
              <span key={brand} className="text-lg font-bold text-muted-foreground/60 tracking-wide">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.div variants={fadeUp}>
              <Badge variant="secondary" className="mb-4">Features</Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything You Need to <span className="gradient-text">Run Your Salon</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
              From booking to billing, staff management to marketing — we&apos;ve got every aspect of your salon covered.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}>
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 bg-gradient-to-b from-violet-500/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.div variants={fadeUp}>
              <Badge className="mb-4 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-0">
                <Brain className="h-3.5 w-3.5 mr-1.5" /> AI-Powered
              </Badge>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
              Your Salon&apos;s <span className="gradient-text">AI Brain</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
              Make data-driven decisions with our AI that learns your business patterns and delivers actionable insights.
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-2 gap-6">
            {aiFeatures.map((feature) => (
              <motion.div key={feature.title} variants={fadeUp}>
                <Card className="h-full border-violet-500/20 hover:border-violet-500/40 transition-all hover:shadow-lg hover:shadow-violet-500/5">
                  <CardContent className="p-6 flex gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                      <feature.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 gradient-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <motion.div key={stat.label} variants={fadeUp} className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-white">{stat.value}</div>
                <div className="mt-2 text-sm text-white/70">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24" id="pricing">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-12">
            <motion.div variants={fadeUp}><Badge variant="secondary" className="mb-4">Pricing</Badge></motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
              Simple, <span className="gradient-text">Transparent Pricing</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-lg text-muted-foreground">
              Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-6 inline-flex items-center gap-3 p-1 rounded-xl bg-muted">
              <button onClick={() => setAnnual(false)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!annual ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>Monthly</button>
              <button onClick={() => setAnnual(true)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${annual ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}>
                Annual <Badge variant="success" className="ml-1.5 text-[10px]">Save 20%</Badge>
              </button>
            </motion.div>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {SUBSCRIPTION_PLANS.map((plan) => (
              <motion.div key={plan.id} variants={fadeUp}>
                <Card className={`h-full relative ${(plan as any).popular ? 'border-primary shadow-xl shadow-primary/10 scale-105' : ''}`}>
                  {(plan as any).popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary text-white border-0 shadow-lg">Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <h3 className="text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold">{formatCurrency(annual ? Math.round(plan.price_yearly / 12) : plan.price_monthly)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {annual && (
                      <p className="text-xs text-muted-foreground mt-1">Billed {formatCurrency(plan.price_yearly)}/year</p>
                    )}
                    <Button asChild className={`w-full mt-6 ${(plan as any).popular ? 'gradient-primary text-white' : ''}`} variant={(plan as any).popular ? 'default' : 'outline'}>
                      <Link href="/signup">
                        Start Free Trial <ChevronRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-center mt-8 text-sm text-muted-foreground">
            All plans include: <strong>Stripe</strong> & <strong>Razorpay</strong> payment processing • GST invoicing • SSL encryption • Daily backups
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center max-w-3xl mx-auto mb-16">
            <motion.div variants={fadeUp}><Badge variant="secondary" className="mb-4">Testimonials</Badge></motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">
              Loved by <span className="gradient-text">Salon Owners</span>
            </motion.h2>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <motion.div key={t.name} variants={fadeUp}>
                <Card className="h-full hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />)}
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground mb-6">&quot;{t.quote}&quot;</p>
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-semibold`}>
                        {t.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.salon}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24" id="faq">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-12">
            <motion.div variants={fadeUp}><Badge variant="secondary" className="mb-4">FAQ</Badge></motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold tracking-tight">Frequently Asked Questions</motion.h2>
          </motion.div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative overflow-hidden rounded-3xl gradient-primary p-12 text-center text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Transform Your Salon?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join 50,000+ salons already using SalonAI to grow their business. Start your free trial today.
            </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center">
               <Button asChild size="lg" className="bg-white text-violet-700 hover:bg-white/90 text-base px-8 shadow-xl">
                 <Link href="/signup">
                   Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                 </Link>
               </Button>
               <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 text-base px-8">
                 <Link href="/contact">
                   Talk to Sales
                 </Link>
               </Button>
             </div>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-white/60">
              <span><Shield className="inline h-3.5 w-3.5 mr-1" />Bank-grade security</span>
              <span><Zap className="inline h-3.5 w-3.5 mr-1" />Setup in 30 minutes</span>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}
