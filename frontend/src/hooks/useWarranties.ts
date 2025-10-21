/**
 * React Query Hooks for Warranty Management
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSnackbar } from 'notistack'
import { warrantyApi, claimApi, serialNumberApi } from '../services/warrantyApi'
import type { WarrantyFormData, ClaimFormData } from '../schemas/warranty'

// Query keys
export const warrantyKeys = {
  all: ['warranties'] as const,
  lists: () => [...warrantyKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...warrantyKeys.lists(), filters] as const,
  details: () => [...warrantyKeys.all, 'detail'] as const,
  detail: (id: string) => [...warrantyKeys.details(), id] as const,
  stats: () => [...warrantyKeys.all, 'stats'] as const,
  expiringSoon: (days: number) => [...warrantyKeys.all, 'expiring', days] as const,
}

// List warranties
export function useWarranties(params?: {
  page?: number
  limit?: number
  status?: string
  search?: string
}) {
  return useQuery({
    queryKey: warrantyKeys.list(params || {}),
    queryFn: () => warrantyApi.list(params),
  })
}

// Get single warranty
export function useWarranty(id: string) {
  return useQuery({
    queryKey: warrantyKeys.detail(id),
    queryFn: () => warrantyApi.getById(id),
    enabled: !!id,
  })
}

// Warranty stats
export function useWarrantyStats() {
  return useQuery({
    queryKey: warrantyKeys.stats(),
    queryFn: () => warrantyApi.stats(),
  })
}

// Expiring soon
export function useExpiringSoonWarranties(days: number = 30) {
  return useQuery({
    queryKey: warrantyKeys.expiringSoon(days),
    queryFn: () => warrantyApi.getExpiringSoon(days),
  })
}

// Create warranty mutation
export function useCreateWarranty() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  return useMutation({
    mutationFn: (data: WarrantyFormData) => warrantyApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warrantyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: warrantyKeys.stats() })
      enqueueSnackbar('Tạo phiếu bảo hành thành công', { variant: 'success' })
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi: ${error.message}`, { variant: 'error' })
    },
  })
}

// Update warranty mutation
export function useUpdateWarranty() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WarrantyFormData> }) =>
      warrantyApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: warrantyKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: warrantyKeys.lists() })
      enqueueSnackbar('Cập nhật bảo hành thành công', { variant: 'success' })
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi: ${error.message}`, { variant: 'error' })
    },
  })
}

// Delete warranty mutation
export function useDeleteWarranty() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  return useMutation({
    mutationFn: (id: string) => warrantyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warrantyKeys.lists() })
      queryClient.invalidateQueries({ queryKey: warrantyKeys.stats() })
      enqueueSnackbar('Xóa phiếu bảo hành thành công', { variant: 'success' })
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi: ${error.message}`, { variant: 'error' })
    },
  })
}

// Warranty Claims hooks
export const claimKeys = {
  all: ['claims'] as const,
  lists: () => [...claimKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...claimKeys.lists(), filters] as const,
  details: () => [...claimKeys.all, 'detail'] as const,
  detail: (id: string) => [...claimKeys.details(), id] as const,
}

export function useClaims(params?: { page?: number; limit?: number; status?: string }) {
  return useQuery({
    queryKey: claimKeys.list(params || {}),
    queryFn: () => claimApi.list(params),
  })
}

export function useCreateClaim() {
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()

  return useMutation({
    mutationFn: (data: ClaimFormData) => claimApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: claimKeys.lists() })
      enqueueSnackbar('Tạo yêu cầu bảo hành thành công', { variant: 'success' })
    },
    onError: (error: Error) => {
      enqueueSnackbar(`Lỗi: ${error.message}`, { variant: 'error' })
    },
  })
}

// Serial Number hooks
export const serialKeys = {
  all: ['serials'] as const,
  lists: () => [...serialKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...serialKeys.lists(), filters] as const,
  details: () => [...serialKeys.all, 'detail'] as const,
  detail: (id: string) => [...serialKeys.details(), id] as const,
}

export function useSerialNumbers(params?: {
  page?: number
  limit?: number
  status?: string
  product_id?: string
}) {
  return useQuery({
    queryKey: serialKeys.list(params || {}),
    queryFn: () => serialNumberApi.list(params),
  })
}

export function useSerialNumber(id: string) {
  return useQuery({
    queryKey: serialKeys.detail(id),
    queryFn: () => serialNumberApi.getById(id),
    enabled: !!id,
  })
}
