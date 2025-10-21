import { Env } from '../types';

export class R2StorageService {
  constructor(private env: Env) {}

  validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv', 'text/plain'
    ];

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 100MB limit' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `File type ${file.type} not allowed` };
    }

    return { valid: true };
  }

  async uploadFile(file: File, key: string, options?: { contentType?: string; metadata?: Record<string, string> }) {
    try {
      await this.env.UPLOADS.put(key, file, {
        httpMetadata: {
          contentType: options?.contentType || file.type
        },
        customMetadata: options?.metadata
      });
      return { success: true, key, url: `/uploads/${key}` };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteFile(key: string) {
    try {
      await this.env.UPLOADS.delete(key);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getStorageStats(tenantId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Query database for upload stats
      const result = await this.env.DB.prepare(`
        SELECT
          COUNT(*) as total_files,
          SUM(file_size) as total_size
        FROM r2_uploads
        WHERE tenant_id = ?
      `).bind(tenantId).first();

      return {
        success: true,
        data: {
          total_files: Number((result as any)?.total_files) || 0,
          total_size: Number((result as any)?.total_size) || 0,
          total_size_mb: Math.round((Number((result as any)?.total_size) || 0) / 1024 / 1024 * 100) / 100
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}
