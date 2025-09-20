/**
 * Cloudflare R2 Storage Service
 * Tối ưu cho production environment
 */

import { Env } from '../types';

export interface R2UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  message?: string;
  error?: string;
}

export interface R2UploadOptions {
  category?: string;
  maxSize?: number;
  allowedTypes?: string[];
  generateThumbnail?: boolean;
}

export class R2StorageService {
  private env: Env;
  private bucketName: string;
  private publicUrl: string;

  constructor(env: Env) {
    this.env = env;
    this.bucketName = env.CLOUDFLARE_R2_BUCKET_UPLOADS || 'smartpos-uploads';
    this.publicUrl = `https://uploads.namhbcf.uk`; // Custom domain cho R2
  }

  /**
   * Validate environment configuration
   */
  private validateConfig(): void {
    const required = [
      'CLOUDFLARE_R2_ACCESS_KEY_ID',
      'CLOUDFLARE_R2_SECRET_ACCESS_KEY',
      'CLOUDFLARE_R2_ENDPOINT'
    ];

    const missing = required.filter(key => !this.env[key]);
    if (missing.length > 0) {
      throw new Error(`R2 configuration missing: ${missing.join(', ')}`);
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File, options: R2UploadOptions = {}): void {
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    const allowedTypes = options.allowedTypes || [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf', 'text/plain', 'application/json'
    ];

    if (file.size > maxSize) {
      throw new Error(`File size exceeds limit of ${maxSize / (1024 * 1024)}MB`);
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
  }

  /**
   * Generate unique file key
   */
  private generateFileKey(file: File, category: string = 'general'): string {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const randomId = crypto.randomUUID().slice(0, 8);
    const extension = file.name.split('.').pop() || 'bin';
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 50);

    return `${category}/${timestamp}/${randomId}_${safeName}`;
  }

  /**
   * Upload file to R2 using direct API
   */
  async uploadFile(file: File, options: R2UploadOptions = {}): Promise<R2UploadResult> {
    try {
      this.validateConfig();
      this.validateFile(file, options);

      const category = options.category || 'general';
      const fileKey = this.generateFileKey(file, category);

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Create R2 request using fetch with AWS S3 compatible API
      const uploadUrl = `${this.env.CLOUDFLARE_R2_ENDPOINT}/${this.bucketName}/${fileKey}`;

      // Create signature for AWS S3 compatible request
      const headers = await this.createS3Headers(fileKey, file.type, arrayBuffer.byteLength);

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers,
        body: arrayBuffer
      });

      if (!response.ok) {
        throw new Error(`R2 upload failed: ${response.status} ${response.statusText}`);
      }

      // Store file metadata in database
      await this.saveFileMetadata(fileKey, file, category);

      const publicUrl = `${this.publicUrl}/${fileKey}`;

      return {
        success: true,
        url: publicUrl,
        key: fileKey,
        message: 'File uploaded successfully'
      };

    } catch (error) {
      console.error('R2 upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Create AWS S3 compatible headers for R2
   */
  private async createS3Headers(key: string, contentType: string, contentLength: number): Promise<Record<string, string>> {
    const accessKeyId = this.env.CLOUDFLARE_R2_ACCESS_KEY_ID!;
    const secretAccessKey = this.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!;

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const region = 'auto'; // Cloudflare R2 uses 'auto'
    const service = 's3';

    // Create canonical request
    const canonicalHeaders = [
      `content-type:${contentType}`,
      `host:${new URL(this.env.CLOUDFLARE_R2_ENDPOINT!).host}`,
      `x-amz-content-sha256:UNSIGNED-PAYLOAD`,
      `x-amz-date:${amzDate}`
    ].join('\n');

    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = [
      'PUT',
      `/${this.bucketName}/${key}`,
      '',
      canonicalHeaders + '\n',
      signedHeaders,
      'UNSIGNED-PAYLOAD'
    ].join('\n');

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      await this.sha256(canonicalRequest)
    ].join('\n');

    // Create signature
    const signature = await this.createSignature(secretAccessKey, dateStamp, region, service, stringToSign);

    const authorization = `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
      'Content-Type': contentType,
      'Content-Length': contentLength.toString(),
      'Authorization': authorization,
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      'x-amz-date': amzDate
    };
  }

  /**
   * Create AWS signature
   */
  private async createSignature(secretKey: string, dateStamp: string, region: string, service: string, stringToSign: string): Promise<string> {
    const kDate = await this.hmacSha256(`AWS4${secretKey}`, dateStamp);
    const kRegion = await this.hmacSha256(kDate, region);
    const kService = await this.hmacSha256(kRegion, service);
    const kSigning = await this.hmacSha256(kService, 'aws4_request');
    const signature = await this.hmacSha256(kSigning, stringToSign);

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * HMAC-SHA256 helper
   */
  private async hmacSha256(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder();
    const keyData = typeof key === 'string' ? encoder.encode(key) : key;
    const messageData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    return await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  }

  /**
   * SHA256 helper
   */
  private async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Save file metadata to database
   */
  private async saveFileMetadata(key: string, file: File, category: string): Promise<void> {
    try {
      await this.env.DB.prepare(`
        INSERT INTO file_uploads (
          id, original_name, filename, file_type, file_size,
          category, description, uploaded_by, uploaded_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active')
      `).bind(
        crypto.randomUUID(),
        file.name,
        key,
        file.type,
        file.size,
        category,
        `Uploaded via R2 service`,
        'system'
      ).run();
    } catch (error) {
      console.warn('Failed to save file metadata:', error);
      // Non-critical error, don't fail upload
    }
  }

  /**
   * Delete file from R2
   */
  async deleteFile(key: string): Promise<R2UploadResult> {
    try {
      this.validateConfig();

      const deleteUrl = `${this.env.CLOUDFLARE_R2_ENDPOINT}/${this.bucketName}/${key}`;
      const headers = await this.createS3Headers(key, '', 0);

      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: new Headers({
          'Authorization': headers.Authorization || '',
          'x-amz-content-sha256': headers['x-amz-content-sha256'] || '',
          'x-amz-date': headers['x-amz-date'] || ''
        })
      });

      if (!response.ok) {
        throw new Error(`R2 delete failed: ${response.status}`);
      }

      // Update database
      await this.env.DB.prepare(`
        UPDATE file_uploads
        SET status = 'deleted', deleted_at = datetime('now')
        WHERE filename = ?
      `).bind(key).run();

      return {
        success: true,
        message: 'File deleted successfully'
      };

    } catch (error) {
      console.error('R2 delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * Get presigned URL for temporary access
   */
  async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For public bucket, return direct URL
    return `${this.publicUrl}/${key}`;
  }

  /**
   * List files in bucket
   */
  async listFiles(prefix?: string, maxKeys: number = 100): Promise<any[]> {
    try {
      // Get from database for easier filtering
      const query = prefix
        ? `SELECT * FROM file_uploads WHERE filename LIKE ? AND status = 'active' ORDER BY uploaded_at DESC LIMIT ?`
        : `SELECT * FROM file_uploads WHERE status = 'active' ORDER BY uploaded_at DESC LIMIT ?`;

      const params = prefix ? [`${prefix}%`, maxKeys] : [maxKeys];
      const result = await this.env.DB.prepare(query).bind(...params).all();

      return result.results?.map((file: any) => ({
        key: file.filename,
        name: file.original_name,
        size: file.file_size,
        type: file.file_type,
        category: file.category,
        uploadedAt: file.uploaded_at,
        url: `${this.publicUrl}/${file.filename}`
      })) || [];

    } catch (error) {
      console.error('List files error:', error);
      return [];
    }
  }
}