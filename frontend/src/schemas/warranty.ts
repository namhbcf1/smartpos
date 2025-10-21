/**
 * Zod Validation Schemas for Warranty Forms
 */
import { z } from 'zod'

export const warrantyFormSchema = z.object({
  warranty_code: z.string().min(1, 'Mã bảo hành là bắt buộc'),
  product_id: z.string().min(1, 'Vui lòng chọn sản phẩm'),
  customer_id: z.string().nullable().optional(),
  order_id: z.string().nullable().optional(),
  warranty_type: z.enum(['standard', 'extended', 'premium'], {
    required_error: 'Vui lòng chọn loại bảo hành',
  }),
  start_date: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
  end_date: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
  notes: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.start_date)
  const end = new Date(data.end_date)
  return end > start
}, {
  message: 'Ngày kết thúc phải sau ngày bắt đầu',
  path: ['end_date'],
})

export const claimFormSchema = z.object({
  warranty_id: z.string().min(1, 'Warranty ID là bắt buộc'),
  claim_type: z.enum(['repair', 'replacement', 'refund'], {
    required_error: 'Vui lòng chọn loại yêu cầu',
  }),
  issue_description: z.string().min(10, 'Mô tả sự cố tối thiểu 10 ký tự'),
  estimated_cost: z.number().min(0, 'Chi phí ước tính phải >= 0').optional(),
})

export const serialNumberFormSchema = z.object({
  serial_number: z.string().min(1, 'Serial number là bắt buộc'),
  product_id: z.string().min(1, 'Vui lòng chọn sản phẩm'),
  status: z.enum(['available', 'sold', 'in_warranty', 'warranty_expired', 'defective']),
  notes: z.string().optional(),
})

export type WarrantyFormData = z.infer<typeof warrantyFormSchema>
export type ClaimFormData = z.infer<typeof claimFormSchema>
export type SerialNumberFormData = z.infer<typeof serialNumberFormSchema>
