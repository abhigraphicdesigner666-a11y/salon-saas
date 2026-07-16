'use client'

import React, { useState, useEffect } from 'react'
import { Star, Landmark, Award, Tag, Sparkles, Loader2, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CustomerRepository, CustomerValueRepository } from '@/lib/repositories/repositories'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function LoyaltyWalletPage() {
  const activeTenantId = 'demo-tenant-001'
  const activeCustomerId = 'c1' // Priya Sharma

  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<any>(null)
  const [packages, setPackages] = useState<any[]>([])
  const [walletTx, setWalletTx] = useState<any[]>([])

  useEffect(() => {
    const loadLoyaltyData = async () => {
      try {
        setLoading(true)
        const cust = await CustomerRepository.getById(activeCustomerId)
        setCustomer(cust)

        const pkgs = await CustomerValueRepository.listCustomerPackages(activeTenantId)
        setPackages(pkgs.filter(p => p.customer_id === activeCustomerId))

        const wTx = await CustomerValueRepository.listWalletTransactions(activeCustomerId, activeTenantId)
        setWalletTx(wTx)
      } catch (e) {
        console.error('Failed to load customer loyalty and wallet balances', e)
      } finally {
        setLoading(false)
      }
    }
    loadLoyaltyData()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <span className="text-xs text-muted-foreground">Retrieving store ledger...</span>
      </div>
    )
  }

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-violet-500" />
        <h2 className="text-lg font-bold">Loyalty & Balances</h2>
      </div>

      {/* Main stats card grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Award className="h-5 w-5 text-amber-500 mx-auto mb-1.5" />
            <h3 className="text-lg font-bold">{customer?.loyalty_points || 0}</h3>
            <span className="text-[9px] text-muted-foreground uppercase font-bold">Loyalty Points</span>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 text-center">
            <Landmark className="h-5 w-5 text-blue-500 mx-auto mb-1.5" />
            <h3 className="text-lg font-bold">{formatCurrency(customer?.wallet_balance || 0)}</h3>
            <span className="text-[9px] text-muted-foreground uppercase font-bold">Wallet Balance</span>
          </CardContent>
        </Card>
      </div>

      {/* Active Membership details */}
      <Card className="glass-card">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-xs font-bold uppercase text-rose-500 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" /> Membership Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-xs space-y-2">
          {customer?.membership_level ? (
            <div className="flex justify-between items-center">
              <div>
                <strong>{customer.membership_level} Plan</strong>
                <p className="text-[10px] text-muted-foreground mt-0.5">Enables active discounts on service categories.</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
          ) : (
            <p className="text-muted-foreground text-center">No active membership plan currently assigned.</p>
          )}
        </CardContent>
      </Card>

      {/* Prepaid Packages */}
      <Card className="glass-card">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Prepaid Packages</CardTitle>
        </CardHeader>
        <CardContent className="p-4 text-xs space-y-2">
          {packages.map(pkg => (
            <div key={pkg.id} className="flex justify-between items-center p-2.5 border rounded-xl bg-card">
              <div>
                <strong>{pkg.name}</strong>
                <p className="text-[10px] text-muted-foreground mt-0.5">Remaining sessions: {pkg.remaining_sessions} / {pkg.total_sessions}</p>
              </div>
              <Badge variant="outline">{pkg.status}</Badge>
            </div>
          ))}
          {packages.length === 0 && (
            <p className="text-muted-foreground text-center">No prepaid packages on file.</p>
          )}
        </CardContent>
      </Card>

      {/* Wallet transaction ledger */}
      <Card className="glass-card">
        <CardHeader className="p-4 pb-2 border-b">
          <CardTitle className="text-xs font-bold uppercase text-muted-foreground">Wallet Statements</CardTitle>
        </CardHeader>
        <CardContent className="p-0 max-h-[220px] overflow-y-auto divide-y text-xs">
          {walletTx.map((tx, idx) => (
            <div key={tx.id || idx} className="p-3 flex justify-between items-center">
              <div>
                <strong>{tx.reason}</strong>
                <p className="text-[10px] text-muted-foreground mt-0.5">{formatDate(tx.created_at)}</p>
              </div>
              <span className={`font-bold ${tx.change_amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {tx.change_amount > 0 ? '+' : ''}{formatCurrency(tx.change_amount)}
              </span>
            </div>
          ))}
          {walletTx.length === 0 && (
            <p className="text-muted-foreground text-center py-4">No wallet transactions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
