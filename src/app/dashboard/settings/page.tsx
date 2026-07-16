'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2,
  Clock,
  Landmark,
  Printer,
  FileText,
  ShieldAlert,
  Bell,
  MessageSquare,
  Shield,
  Layers,
  HelpCircle,
  Save,
  Loader2,
  RefreshCw,
  Key,
  Download,
  Upload,
  CreditCard,
  CheckCircle,
  Settings,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuth } from '@/lib/auth/auth-context'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'
import { useSettings } from '@/lib/contexts/settings-context'

const stagger = { visible: { transition: { staggerChildren: 0.05 } } }
const fadeUp = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

export default function SettingsPage() {
  const { user } = useAuth()
  const { success, error } = useToast()
  const { settings, updateSettings, resetSystem, loading } = useSettings()

  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'hours' | 'tax' | 'receipt' | 'roles' | 'notifications' | 'backup' | 'subscription' | 'developer'>('profile')

  // Local Form states (initialized from context settings)
  const [name, setName] = useState(settings.name)
  const [logo, setLogo] = useState(settings.logo)
  const [phone, setPhone] = useState(settings.phone)
  const [email, setEmail] = useState(settings.email)
  const [address, setAddress] = useState(settings.address)

  const [gstin, setGstin] = useState(settings.gstin)
  const [rate, setRate] = useState(settings.rate)
  const [inclusive, setInclusive] = useState(settings.inclusive)

  const [receiptHeader, setReceiptHeader] = useState(settings.receipt_header)
  const [receiptFooter, setReceiptFooter] = useState(settings.receipt_footer)
  const [themePreference, setThemePreference] = useState(settings.theme)

  const [printerName, setPrinterName] = useState('Thermal POS-80')
  const [printerWidth, setPrinterWidth] = useState('80mm')

  // Dialog State for Developer resets
  const [showConfirm, setShowConfirm] = useState<string | null>(null)
  const [confirmInput, setConfirmInput] = useState('')

  React.useEffect(() => {
    if (settings) {
      setName(settings.name ?? '')
      setLogo(settings.logo ?? '')
      setPhone(settings.phone ?? '')
      setEmail(settings.email ?? '')
      setAddress(settings.address ?? '')
      setGstin(settings.gstin ?? '')
      setRate(settings.rate ?? '18')
      setInclusive(settings.inclusive ?? true)
      setReceiptHeader(settings.receipt_header ?? '')
      setReceiptFooter(settings.receipt_footer ?? '')
      setThemePreference(settings.theme ?? 'dark')
    }
  }, [settings])

  const handleSaveProfile = async () => {
    try {
      setSaving(true)
      await updateSettings({ name, logo, phone, email, address })
    } catch (e: any) {
      error('Save failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTax = async () => {
    try {
      setSaving(true)
      await updateSettings({ gstin, rate, inclusive })
    } catch (e: any) {
      error('Save failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveReceipt = async () => {
    try {
      setSaving(true)
      await updateSettings({ receipt_header: receiptHeader, receipt_footer: receiptFooter, theme: themePreference })
    } catch (e: any) {
      error('Save failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  const triggerReset = async (section: string) => {
    if (confirmInput.toUpperCase() !== 'RESET') {
      error('Validation Failure', 'Please type "RESET" to confirm purging databases.')
      return
    }
    try {
      setSaving(true)
      await resetSystem(section)
      setShowConfirm(null)
      setConfirmInput('')
    } catch (e: any) {
      error('Reset failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs text-muted-foreground">Loading workspace settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Salon Operating Settings</h1>
        <p className="text-muted-foreground text-xs mt-1">Configure profile details, taxes, hardware integration settings, and dev tools.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <Card className="lg:col-span-1 border shadow-sm h-fit">
          <CardContent className="p-3 flex flex-col gap-1.5">
            {[
              { id: 'profile', label: 'Salon Profile', icon: Building2 },
              { id: 'hours', label: 'Business Hours', icon: Clock },
              { id: 'tax', label: 'GST & Tax', icon: Landmark },
              { id: 'receipt', label: 'Receipts & Printers', icon: Printer },
              { id: 'roles', label: 'Roles & Permissions', icon: Shield },
              { id: 'notifications', label: 'WhatsApp Alerts', icon: Bell },
              { id: 'backup', label: 'Backup & Restore', icon: Download },
              { id: 'subscription', label: 'Subscription & SaaS', icon: CreditCard },
              { id: 'developer', label: 'Developer Reset Tools', icon: ShieldAlert },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4.5 w-4.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Content panel */}
        <div className="lg:col-span-3">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-6">
            
            {/* TAB 1: Profile */}
            {activeTab === 'profile' && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Building2 className="h-4 w-4 text-violet-500" /> Salon Profile Details</CardTitle>
                  <CardDescription className="text-xs">Update your public customer details and billing addresses.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="sname">Salon Name</Label>
                      <Input id="sname" value={name} onChange={e => setName(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sphone">Business Phone</Label>
                      <Input id="sphone" value={phone} onChange={e => setPhone(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="semail">Billing Email</Label>
                      <Input id="semail" value={email} onChange={e => setEmail(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="slogo">Logo URL Path</Label>
                      <Input id="slogo" placeholder="e.g. /images/logo.png" value={logo} onChange={e => setLogo(e.target.value)} className="h-9" />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label htmlFor="saddress">Physical Address</Label>
                      <Input id="saddress" value={address} onChange={e => setAddress(e.target.value)} className="h-9" />
                    </div>
                  </div>
                  <Button size="sm" variant="gradient" disabled={saving} onClick={handleSaveProfile} className="flex items-center gap-1">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Profile Changes
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* TAB 2: Hours */}
            {activeTab === 'hours' && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Clock className="h-4 w-4 text-violet-500" /> Weekly Business Hours</CardTitle>
                  <CardDescription className="text-xs">Configure opening and closing schedules for your salon chairs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="border rounded-2xl divide-y">
                    {settings.business_hours?.map((h) => (
                      <div key={h.day} className="flex justify-between items-center p-3">
                        <span className="font-semibold w-24">{h.day}</span>
                        <div className="flex gap-2 items-center">
                          <Input type="text" value={h.open} disabled={h.closed} className="w-16 h-8 text-center" readOnly />
                          <span>to</span>
                          <Input type="text" value={h.close} disabled={h.closed} className="w-16 h-8 text-center" readOnly />
                        </div>
                        <Badge variant={h.closed ? 'destructive' : 'success'}>
                          {h.closed ? 'Closed' : 'Active'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => success('Business Hours Saved', 'Roster calendar updated.')}>
                    Update Hours Roster
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* TAB 3: Tax */}
            {activeTab === 'tax' && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Landmark className="h-4 w-4 text-violet-500" /> GST & Tax Settings</CardTitle>
                  <CardDescription className="text-xs">Configure standard salon GST taxes applied during checkouts.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="gstin">GSTIN ID Number</Label>
                      <Input id="gstin" value={gstin} onChange={e => setGstin(e.target.value)} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gstPercent">Default Tax Rate (%)</Label>
                      <Select value={rate} onValueChange={setRate}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5% (Budget Tier)</SelectItem>
                          <SelectItem value="12">12% (Standard Services)</SelectItem>
                          <SelectItem value="18">18% (Standard GST Luxury)</SelectItem>
                          <SelectItem value="28">28% (Premium Cosmetic)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 flex items-center justify-between border p-3 rounded-2xl bg-muted/10">
                      <div>
                        <strong className="block font-semibold">Taxes Inclusive in Service Price</strong>
                        <span className="text-[10px] text-muted-foreground">Taxes are included directly in the catalog service price during checkout.</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={inclusive}
                        onChange={e => setInclusive(e.target.checked)}
                        className="h-4 w-4 rounded accent-primary"
                      />
                    </div>
                  </div>
                  <Button size="sm" variant="gradient" disabled={saving} onClick={handleSaveTax} className="flex items-center gap-1">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Save Tax Rates
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* TAB 4: Printer & Receipts */}
            {activeTab === 'receipt' && (
              <div className="space-y-6">
                <Card className="border">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5"><FileText className="h-4 w-4 text-violet-500" /> Receipt Templates Configuration</CardTitle>
                    <CardDescription className="text-xs">Adjust headers, footers, and active theme profiles.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="rHeader">Receipt Header Banner</Label>
                        <Input id="rHeader" value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pTheme">Active Portal Theme</Label>
                        <Select value={themePreference} onValueChange={setThemePreference}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light Mode</SelectItem>
                            <SelectItem value="dark">Dark Mode (Premium)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label htmlFor="rFooter">Receipt Footer Policies</Label>
                        <Input id="rFooter" value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="h-9" />
                      </div>
                    </div>
                    <Button size="sm" variant="gradient" disabled={saving} onClick={handleSaveReceipt} className="flex items-center gap-1">
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border">
                  <CardHeader>
                    <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Printer className="h-4 w-4 text-violet-500" /> Hardware Printer Settings</CardTitle>
                    <CardDescription className="text-xs">Configure local POS thermal receipt printer connection.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="pName">Thermal Printer Port/Name</Label>
                        <Input id="pName" value={printerName} onChange={e => setPrinterName(e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="pSize">Paper Roll Width</Label>
                        <Select value={printerWidth} onValueChange={setPrinterWidth}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="58mm">58mm Receipt</SelectItem>
                            <SelectItem value="80mm">80mm Wide Thermal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => success('Printer Port Saved', 'Connected to thermal roll.')}>
                      Save Connection Port
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* TAB 5: Roles */}
            {activeTab === 'roles' && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Shield className="h-4 w-4 text-violet-500" /> Staff Roles & Access Matrix</CardTitle>
                  <CardDescription className="text-xs">Review system permission groups assigned to team members.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="overflow-x-auto w-full border rounded-2xl">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-muted/40 border-b">
                          <th className="p-3">Feature Group</th>
                          <th className="p-3 text-center">Owner</th>
                          <th className="p-3 text-center">Manager</th>
                          <th className="p-3 text-center">Receptionist</th>
                          <th className="p-3 text-center">Stylist/Staff</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {[
                          { f: 'Overview Dashboard Analytics', o: '✅ Full', m: '✅ Full', r: '✅ Full', s: '❌ Restrict' },
                          { f: 'Appointments & Calendar Booking', o: '✅ Full', m: '✅ Full', r: '✅ Full', s: '✅ Own Slots' },
                          { f: 'Customer Profile CRM Details', o: '✅ Full', m: '✅ Full', r: '✅ Full', s: '❌ View Only' },
                          { f: 'Billing, Checkout & Cashier POS', o: '✅ Full', m: '✅ Full', r: '✅ Full', s: '❌ Restrict' },
                          { f: 'Inventory Stock procurement', o: '✅ Full', m: '✅ Full', r: '❌ Restrict', s: '❌ Restrict' },
                          { f: 'Operating Settings & GST Configurations', o: '✅ Full', m: '❌ Restrict', r: '❌ Restrict', s: '❌ Restrict' },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="p-3 font-semibold">{row.f}</td>
                            <td className="p-3 text-center text-emerald-500 font-bold">{row.o}</td>
                            <td className="p-3 text-center font-medium">{row.m}</td>
                            <td className="p-3 text-center font-medium">{row.r}</td>
                            <td className="p-3 text-center text-rose-500">{row.s}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 6: Notifications */}
            {activeTab === 'notifications' && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Bell className="h-4 w-4 text-violet-500" /> WhatsApp & Notification Settings</CardTitle>
                  <CardDescription className="text-xs">Configure alerts dispatch channels sent to clients.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="space-y-3.5">
                    {[
                      { id: 'whatsapp', label: 'WhatsApp Alerts Channel', desc: 'Dispatches booking confirmations, reminders, and links via WhatsApp Business.' },
                      { id: 'email', label: 'Email Invoicing and Receipts', desc: 'Sends PDF copies of invoice receipts automatically to registered email addresses.' },
                      { id: 'sms', label: 'Transactional SMS Carrier Backup', desc: 'Toggles backup DND carrier alerts when WhatsApp is unserviceable.' },
                    ].map(item => (
                      <div key={item.id} className="flex items-center justify-between border p-3.5 rounded-2xl bg-muted/15">
                        <div className="space-y-0.5">
                          <strong className="block font-semibold text-xs">{item.label}</strong>
                          <span className="text-[10px] text-muted-foreground leading-normal max-w-lg block">{item.desc}</span>
                        </div>
                        <Badge variant="success">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 7: Backup */}
            {activeTab === 'backup' && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Download className="h-4 w-4 text-violet-500" /> Database Backup & Local Recovery</CardTitle>
                  <CardDescription className="text-xs">Download full local database state or import backup files.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border p-4 rounded-2xl bg-muted/15 flex flex-col justify-between items-start gap-4">
                      <div>
                        <strong className="block font-semibold">Download Backup Archive</strong>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-normal">Download a full snapshot of customers, appointments, inventory, and invoices in standard JSON format.</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => success('Backup Complete', 'Local storage data downloaded.')} className="flex items-center gap-1"><Download className="h-3.5 w-3.5" /> Download Database Backup</Button>
                    </div>

                    <div className="border p-4 rounded-2xl bg-muted/15 flex flex-col justify-between items-start gap-4">
                      <div>
                        <strong className="block font-semibold">Restore from JSON Archive</strong>
                        <p className="text-[10px] text-muted-foreground mt-1 leading-normal">Upload a previously saved backup file to restore databases.</p>
                      </div>
                      <Button size="sm" variant="outline" className="flex items-center gap-1 w-full" onClick={() => success('Backup Restored', 'Re-initialized mock database.')}><Upload className="h-3.5 w-3.5" /> Upload & Restore</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 8: Subscription */}
            {activeTab === 'subscription' && (
              <Card className="border">
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5"><CreditCard className="h-4 w-4 text-violet-500" /> Subscription & Account Licenses</CardTitle>
                  <CardDescription className="text-xs">Manage your software plan, license seats billing, and integrations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border rounded-2xl bg-muted/10 gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Active License Plan</span>
                      <h3 className="text-lg font-bold mt-1 text-primary">Enterprise Core Chain</h3>
                      <p className="text-muted-foreground text-[10px] mt-0.5">Billing: ₹4,999 / month • Next renewal: Aug 01, 2026</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase font-bold border-primary text-primary">Premium Enterprise</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* TAB 9: Developer Tools Resets */}
            {activeTab === 'developer' && (
              <Card className="border border-red-500/20">
                <CardHeader className="bg-red-500/5">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-red-500"><ShieldAlert className="h-4 w-4" /> Developer Reset Control Panel</CardTitle>
                  <CardDescription className="text-xs text-red-600/80">Perform selective table purges to reset the system. Proceed with absolute caution.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-xs pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { id: 'transactions', label: 'Purge Transaction History', desc: 'Deletes all invoices, sales payments, checkouts, and closes the cash drawer shift.' },
                      { id: 'appointments', label: 'Purge Calendar Bookings', desc: 'Wipes scheduled calendar reservations.' },
                      { id: 'customers', label: 'Re-seed Basic CRM Clients', desc: 'Resets the customer CRM list to default seed clients.' },
                      { id: 'inventory', label: 'Re-seed Products Catalog', desc: 'Resets product inventory lists back to initial seed serums.' },
                      { id: 'memberships', label: 'Purge Membership Packages', desc: 'Wipes active package vouchers and membership logs.' },
                      { id: 'marketing', label: 'Purge Marketing Campaigns', desc: 'Clears coupons codes and campaign SMS dispatch statistics.' },
                    ].map(btn => (
                      <div key={btn.id} className="p-3.5 border rounded-2xl flex flex-col justify-between items-start gap-3 bg-muted/10">
                        <div>
                          <strong className="block font-semibold text-xs">{btn.label}</strong>
                          <p className="text-[10px] text-muted-foreground mt-0.5 leading-normal">{btn.desc}</p>
                        </div>
                        <Button size="sm" variant="destructive" className="h-7 text-[10px] flex items-center gap-1" onClick={() => setShowConfirm(btn.id)}>
                          <Trash2 className="h-3 w-3" /> Reset Section
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="border border-red-500/20 rounded-2xl p-4 bg-red-500/5 mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <strong className="block font-semibold text-red-500">Reset Full Demo Platform</strong>
                      <p className="text-[10px] text-red-600/70 max-w-lg leading-normal mt-0.5">Completely clears all local databases including custom settings and logs. Reloads the initial platform state.</p>
                    </div>
                    <Button size="sm" variant="destructive" onClick={() => setShowConfirm('demo')} className="flex items-center gap-1"><RefreshCw className="h-3.5 w-3.5" /> Full Factory Reset</Button>
                  </div>
                </CardContent>
              </Card>
            )}

          </motion.div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="bg-card border rounded-2xl p-6 max-w-sm w-full mx-4 space-y-4 text-left shadow-2xl">
            <div className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse" />
              <strong className="font-bold text-sm">Confirm System Purge</strong>
            </div>
            <p className="text-xs text-muted-foreground leading-normal">
              You are about to reset the <code className="bg-muted px-1 py-0.5 rounded font-mono font-bold">{showConfirm}</code> database table. This action is permanent and cannot be undone.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="confVal" className="text-[10px] font-bold text-muted-foreground uppercase">Type "RESET" to execute</Label>
              <Input
                id="confVal"
                placeholder="Type RESET"
                value={confirmInput}
                onChange={e => setConfirmInput(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs font-semibold">
              <Button size="sm" variant="ghost" onClick={() => { setShowConfirm(null); setConfirmInput(''); }}>Cancel</Button>
              <Button size="sm" variant="destructive" onClick={() => triggerReset(showConfirm)} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                Purge Database Table
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
