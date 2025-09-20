import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Plus,
  Columns,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './Button'
import { Input } from './Input'

export interface Column<T> {
  key: keyof T
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, row: T, index: number) => React.ReactNode
  width?: string | number
  minWidth?: string | number
  maxWidth?: string | number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  resizable?: boolean
  hidden?: boolean
  type?: 'text' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage'
  format?: (value: any) => string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchable?: boolean
  filterable?: boolean
  exportable?: boolean
  selectable?: boolean
  pagination?: boolean
  pageSize?: number
  loading?: boolean
  error?: string
  empty?: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  onRowClick?: (row: T, index: number) => void
  onEdit?: (row: T, index: number) => void
  onDelete?: (row: T, index: number) => void
  onView?: (row: T, index: number) => void
  onRefresh?: () => void
  onExport?: (data: T[]) => void
  onSelectionChange?: (selectedRows: T[]) => void
  rowKey?: keyof T | ((row: T) => string | number)
  className?: string
  tableClassName?: string
  headerClassName?: string
  rowClassName?: string | ((row: T, index: number) => string)
  cellClassName?: string | ((value: any, row: T, column: Column<T>) => string)
  stickyHeader?: boolean
  striped?: boolean
  bordered?: boolean
  compact?: boolean
  responsive?: boolean
  virtualScrolling?: boolean
  maxHeight?: string | number
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchable = true,
  filterable = true,
  exportable = true,
  selectable = false,
  pagination = true,
  pageSize = 10,
  loading = false,
  error,
  empty,
  title,
  description,
  actions,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  onRefresh,
  onExport,
  onSelectionChange,
  rowKey = 'id',
  className = '',
  tableClassName = '',
  headerClassName = '',
  rowClassName = '',
  cellClassName = '',
  stickyHeader = false,
  striped = true,
  bordered = false,
  compact = false,
  responsive = true,
  virtualScrolling = false,
  maxHeight
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState<{
    key: keyof T | null
    direction: 'asc' | 'desc'
  }>({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedRows, setSelectedRows] = useState<Set<string | number>>(new Set())
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [visibleColumns, setVisibleColumns] = useState<Set<keyof T>>(
    new Set(columns.filter(col => !col.hidden).map(col => col.key))
  )
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({})

  // Get row key
  const getRowKey = useCallback((row: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(row)
    }
    return row[rowKey] ?? index
  }, [rowKey])

  // Handle selection
  const handleRowSelection = useCallback((rowKey: string | number, selected: boolean) => {
    const newSelection = new Set(selectedRows)
    if (selected) {
      newSelection.add(rowKey)
    } else {
      newSelection.delete(rowKey)
    }
    setSelectedRows(newSelection)

    const selectedData = data.filter((row, index) =>
      newSelection.has(getRowKey(row, index))
    )
    onSelectionChange?.(selectedData)
  }, [selectedRows, data, getRowKey, onSelectionChange])

  // Handle select all
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allKeys = new Set(data.map((row, index) => getRowKey(row, index)))
      setSelectedRows(allKeys)
      onSelectionChange?.(data)
    } else {
      setSelectedRows(new Set())
      onSelectionChange?.([])
    }
  }, [data, getRowKey, onSelectionChange])

  // Enhanced filtering and search
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Apply global search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(row => {
        return columns.some(column => {
          const value = row[column.key]
          if (value == null) return false

          // Handle different data types
          switch (column.type) {
            case 'number':
            case 'currency':
            case 'percentage':
              return String(value).includes(searchTerm)
            case 'date':
              return new Date(value).toLocaleDateString().toLowerCase().includes(searchLower)
            case 'boolean':
              return String(value).toLowerCase() === searchLower
            default:
              return String(value).toLowerCase().includes(searchLower)
          }
        })
      })
    }

    // Apply column-specific filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        const column = columns.find(col => String(col.key) === key)
        filtered = filtered.filter(row => {
          const cellValue = row[key]
          if (cellValue == null) return false

          if (column?.type === 'number' || column?.type === 'currency') {
            return Number(cellValue) === Number(value)
          } else if (column?.type === 'boolean') {
            return String(cellValue).toLowerCase() === value.toLowerCase()
          } else {
            return String(cellValue).toLowerCase().includes(value.toLowerCase())
          }
        })
      }
    })

    return filtered
  }, [data, searchTerm, filters, columns])

  // Enhanced sorting with type awareness
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData

    const column = columns.find(col => col.key === sortConfig.key)

    return [...filteredData].sort((a, b) => {
      let aValue = a[sortConfig.key!]
      let bValue = b[sortConfig.key!]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Type-specific sorting
      switch (column?.type) {
        case 'number':
        case 'currency':
        case 'percentage':
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
          break
        case 'date':
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
          break
        case 'boolean':
          aValue = Boolean(aValue)
          bValue = Boolean(bValue)
          break
        default:
          aValue = String(aValue).toLowerCase()
          bValue = String(bValue).toLowerCase()
      }

      let result = 0
      if (aValue < bValue) result = -1
      else if (aValue > bValue) result = 1

      return sortConfig.direction === 'asc' ? result : -result
    })
  }, [filteredData, sortConfig, columns])

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData

    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, pagination])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, sortedData.length)

  // Enhanced handlers
  const handleSort = useCallback((key: keyof T) => {
    const column = columns.find(col => col.key === key)
    if (!column?.sortable) return

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [columns])

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport(sortedData)
    } else {
      // Default CSV export
      const csvContent = [
        columns.map(col => col.title).join(','),
        ...sortedData.map(row =>
          columns.map(col => {
            const value = row[col.key]
            return typeof value === 'string' && value.includes(',')
              ? `"${value}"`
              : String(value || '')
          }).join(',')
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title || 'data'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }, [sortedData, columns, onExport, title])

  const handleColumnToggle = useCallback((columnKey: keyof T) => {
    setVisibleColumns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(columnKey)) {
        newSet.delete(columnKey)
      } else {
        newSet.add(columnKey)
      }
      return newSet
    })
  }, [])

  // Format cell value based on column type
  const formatCellValue = useCallback((value: any, column: Column<T>) => {
    if (value == null) return '-'

    if (column.format) {
      return column.format(value)
    }

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(Number(value))
      case 'percentage':
        return `${Number(value).toFixed(2)}%`
      case 'number':
        return Number(value).toLocaleString('vi-VN')
      case 'date':
        return new Date(value).toLocaleDateString('vi-VN')
      case 'boolean':
        return value ? 'Có' : 'Không'
      default:
        return String(value)
    }
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className={cn("w-full", className)}>
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}
        <div className="bg-white  rounded-xl border border-gray-200 shadow-lg">
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center space-x-3 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm font-medium">Đang tải dữ liệu...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={cn("w-full", className)}>
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}
        <div className="bg-white  rounded-xl border border-red-200 shadow-lg">
          <div className="h-64 flex items-center justify-center">
            <div className="flex items-center space-x-3 text-red-500">
              <AlertCircle className="w-6 h-6" />
              <div>
                <p className="text-sm font-medium">Có lỗi xảy ra</p>
                <p className="text-xs text-red-400 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={cn("w-full", className)}>
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
        )}
        <div className="bg-white  rounded-xl border border-gray-200 shadow-lg">
          <div className="h-64 flex items-center justify-center">
            {empty || (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
                <p className="text-gray-500">Không có dữ liệu để hiển thị</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Enhanced Header */}
      {(title || description || actions) && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            {title && (
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            )}
            {description && (
              <p className="text-gray-600 mt-1">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Enhanced Controls */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-1 gap-3 items-center">
          {searchable && (
            <div className="relative flex-1 max-w-md">
              <Input
                placeholder="Tìm kiếm trong bảng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
                clearable
                onClear={() => setSearchTerm('')}
              />
            </div>
          )}

          {filterable && (
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <Button variant="outline" size="sm">
            <Columns className="w-4 h-4 mr-2" />
            Cột
          </Button>

          {/* Refresh */}
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Làm mới
            </Button>
          )}

          {/* Export */}
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          )}

          {/* Selection Actions */}
          {selectedRows.size > 0 && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-300">
              <span className="text-sm text-gray-600">
                Đã chọn {selectedRows.size}
              </span>
              <Button variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-white  rounded-xl border border-gray-200 shadow-lg overflow-hidden">
        <div
          className={cn(
            "overflow-auto",
            maxHeight && `max-h-[${maxHeight}]`,
            responsive && "overflow-x-auto"
          )}
        >
          <table className={cn(
            "w-full",
            compact ? "text-sm" : "text-base",
            tableClassName
          )}>
            <thead className={cn(
              "bg-gray-50",
              stickyHeader && "sticky top-0 z-10",
              headerClassName
            )}>
              <tr>
                {selectable && (
                  <th className="w-12 px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                    />
                  </th>
                )}
                {columns
                  .filter(column => visibleColumns.has(column.key))
                  .map((column) => (
                    <th
                      key={String(column.key)}
                      className={cn(
                        "px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200",
                        column.sortable && "cursor-pointer hover:bg-gray-100 transition-colors",
                        column.align === "center" && "text-center",
                        column.align === "right" && "text-right",
                        column.fixed === "left" && "sticky left-0 z-20 bg-gray-50",
                        column.fixed === "right" && "sticky right-0 z-20 bg-gray-50"
                      )}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth
                      }}
                      onClick={() => column.sortable && handleSort(column.key)}
                    >
                      <div className={cn(
                        "flex items-center space-x-2",
                        column.align === 'center' && 'justify-center',
                        column.align === 'right' && 'justify-end'
                      )}>
                        <span>{column.title}</span>
                        {column.sortable && (
                          <div className="flex items-center">
                            <AnimatePresence mode="wait">
                              {sortConfig.key === column.key ? (
                                <motion.div
                                  key={sortConfig.direction}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {sortConfig.direction === 'asc' ? (
                                    <SortAsc className="w-4 h-4 text-blue-600" />
                                  ) : (
                                    <SortDesc className="w-4 h-4 text-blue-600" />
                                  )}
                                </motion.div>
                              ) : (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="flex flex-col opacity-40 hover:opacity-100 transition-opacity"
                                >
                                  <ChevronUp className="w-3 h-3 text-gray-400" />
                                  <ChevronDown className="w-3 h-3 -mt-1 text-gray-400" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                      )}
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete || onView) && (
                  <th className="w-32 px-4 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                    Thao tác
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <AnimatePresence>
                {paginatedData.map((row, rowIndex) => {
                  const globalIndex = startIndex + rowIndex
                  const rowKey = getRowKey(row, globalIndex)
                  const isSelected = selectedRows.has(rowKey)
                  const rowClassNameValue = typeof rowClassName === 'function'
                    ? rowClassName(row, globalIndex)
                    : rowClassName

                  return (
                    <motion.tr
                      key={rowKey}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
                      className={cn(
                        "group transition-all duration-200",
                        "hover:bg-gray-50",
                        onRowClick && "cursor-pointer",
                        isSelected && "bg-blue-50 border-blue-200",
                        striped && rowIndex % 2 === 0 && "bg-gray-50/50",
                        bordered && "border border-gray-200",
                        rowClassNameValue
                      )}
                      onClick={() => onRowClick?.(row, globalIndex)}
                    >
                        {selectable && (
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                e.stopPropagation()
                                handleRowSelection(rowKey, e.target.checked)
                              }}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500  focus:ring-2 "
                            />
                          </td>
                        )}

                        {columns
                          .filter(column => visibleColumns.has(column.key))
                          .map((column) => {
                            const cellValue = row[column.key]
                            const cellClassNameValue = typeof cellClassName === 'function'
                              ? cellClassName(cellValue, row, column)
                              : cellClassName

                            return (
                              <td
                                key={String(column.key)}
                                className={cn(
                                  "px-4 py-4 text-sm transition-colors",
                                  compact ? "py-2" : "py-4",
                                  column.align === "center" && "text-center",
                                  column.align === "right" && "text-right",
                                  column.fixed === "left" && "sticky left-0 z-10 bg-white",
                                  column.fixed === "right" && "sticky right-0 z-10 bg-white",
                                  cellClassNameValue
                                )}
                                style={{
                                  width: column.width,
                                  minWidth: column.minWidth,
                                  maxWidth: column.maxWidth
                                }}
                              >
                                <div className="flex items-center">
                                  {column.render
                                    ? column.render(cellValue, row, globalIndex)
                                    : formatCellValue(cellValue, column)
                                  }
                                </div>
                              </td>
                            )
                          })}

                        {(onEdit || onDelete || onView) && (
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {onView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onView(row, globalIndex)
                                  }}
                                  tooltip="Xem chi tiết"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              )}
                              {onEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onEdit(row, globalIndex)
                                  }}
                                  tooltip="Chỉnh sửa"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              {onDelete && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDelete(row, globalIndex)
                                  }}
                                  tooltip="Xóa"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500 hover:text-red-700" />
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </motion.tr>
                    )
                  })}
              </AnimatePresence>

              {/* Empty State */}
              {paginatedData.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + ((onEdit || onDelete || onView) ? 1 : 0)}
                    className="px-4 py-12 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">Không có dữ liệu</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {searchTerm ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dữ liệu để hiển thị'}
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-xl border border-gray-200">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Hiển thị <span className="font-medium text-gray-900">{startIndex + 1}</span> đến{' '}
              <span className="font-medium text-gray-900">{Math.min(endIndex, totalItems)}</span> của{' '}
              <span className="font-medium text-gray-900">{totalItems}</span> kết quả
            </span>
            {selectedRows.size > 0 && (
              <span className="text-blue-600">
                • Đã chọn {selectedRows.size}
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-2">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="hidden sm:flex"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>

              {/* Previous Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let page: number
                  if (totalPages <= 5) {
                    page = i + 1
                  } else if (currentPage <= 3) {
                    page = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i
                  } else {
                    page = currentPage - 2 + i
                  }

                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        "min-w-[2.5rem]",
                        currentPage === page && "bg-blue-600 text-white"
                      )}
                    >
                      {page}
                    </Button>
                  )
                })}
              </div>

              {/* Next Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>

              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="hidden sm:flex"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
