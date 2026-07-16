'use client'

import React, { useState, useEffect } from 'react'
import { Shield, Loader2, Calendar, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AuditRepository } from '@/lib/repositories/repositories'
import { formatDate } from '@/lib/utils'

export default function GlobalAuditPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchSystemLogs = async () => {
      try {
        setLoading(true)
        const list = await AuditRepository.list('system')
        setLogs(list)
      } catch (e) {
        console.error('Failed to load system audits', e)
      } finally {
        setLoading(false)
      }
    }
    fetchSystemLogs()
  }, [])

  const filteredLogs = logs.filter(l =>
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.user_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Audit Logs</h2>
          <p className="text-xs text-muted-foreground">Compliance timeline and security registers tracking platform-wide changes.</p>
        </div>
        <div className="relative w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search action..." className="h-8 pl-8 text-xs bg-card" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground">Loading audit records...</span>
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold">Workspace Audit Trail</CardTitle>
            <CardDescription className="text-xs">Timeline logs of system-level license and config settings.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left">
                <thead className="bg-muted/30 border-b text-muted-foreground font-semibold uppercase">
                  <tr>
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">User/Operator</th>
                    <th className="p-3">Action</th>
                    <th className="p-3">Details/Audit Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredLogs.map((log, idx) => (
                    <tr key={log.id || idx}>
                      <td className="p-3 text-muted-foreground">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="p-3 font-semibold text-primary">{log.user_name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[9px] uppercase border-violet-500/20 text-violet-500">
                          {log.action.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-muted-foreground">
                        {JSON.stringify(log.new_values || {})}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-muted-foreground">No audit logs found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
