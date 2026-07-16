'use client'

import React, { useState, useMemo } from 'react'
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Column<T> {
  header: string
  accessorKey: keyof T | string
  render?: (row: T) => React.ReactNode
  sortable?: boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  searchKey?: keyof T
  filterOptions?: {
    label: string
    key: keyof T
    options: { label: string; value: string }[]
  }[]
  actions?: (row: T) => React.ReactNode
  pageSize?: number
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Search records...',
  searchKey,
  filterOptions = [],
  actions,
  pageSize = 10,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Clear query and filter configurations
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }))
    setCurrentPage(1)
  }

  // Filtered and Sorted Data
  const processedData = useMemo(() => {
    let result = [...data]

    // 1. Search Query
    if (searchQuery.trim() && searchKey) {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter((row) => {
        const value = row[searchKey]
        return value ? String(value).toLowerCase().includes(query) : false
      })
    }

    // 2. Custom Dropdown Filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        result = result.filter((row) => String(row[key]) === value)
      }
    })

    // 3. Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key]
        const valB = b[sortConfig.key]
        if (valA === undefined || valB === undefined) return 0
        
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA
        }
        
        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()
        if (strA < strB) return sortConfig.direction === 'asc' ? -1 : 1
        if (strA > strB) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, searchQuery, searchKey, filters, sortConfig])

  // Pagination bounds
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return processedData.slice(start, start + pageSize)
  }, [processedData, currentPage, pageSize])

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-muted/20 p-4 rounded-2xl border">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
            className="pl-9 bg-card"
          />
        </div>

        {filterOptions.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground mr-1 hidden sm:block" />
            {filterOptions.map((opt) => (
              <Select
                key={String(opt.key)}
                onValueChange={(val) => handleFilterChange(String(opt.key), val)}
              >
                <SelectTrigger className="w-[140px] bg-card">
                  <SelectValue placeholder={opt.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {opt.label}s</SelectItem>
                  {opt.options.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
      </div>

      {/* Main Table Grid */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {columns.map((col, index) => (
                <TableHead
                  key={index}
                  className={cn(col.sortable && 'cursor-pointer select-none hover:text-foreground')}
                  onClick={() => col.sortable && requestSort(String(col.accessorKey))}
                >
                  <div className="flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && sortConfig?.key === col.accessorKey && (
                      <span className="text-[10px]">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
              {actions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {columns.map((col, colIndex) => (
                  <TableCell key={colIndex}>
                    {col.render
                      ? col.render(row)
                      : row[col.accessorKey as string] !== undefined
                      ? String(row[col.accessorKey as string])
                      : '-'}
                  </TableCell>
                ))}
                {actions && (
                  <TableCell className="text-right">
                    {actions(row)}
                  </TableCell>
                )}
              </TableRow>
            ))}
            {processedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length + (actions ? 1 : 0)} className="text-center py-12 text-muted-foreground">
                  No records matching your search queries.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-xs text-muted-foreground">
            Showing Page {currentPage} of {totalPages} ({processedData.length} records)
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}
