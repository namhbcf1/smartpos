import { Hono } from 'hono';
import { Context } from 'hono';
import { Env } from '../../types';
import { R2StorageService_FileStorageManagementtsx as R2StorageService } from '../../services/R2StorageService-FileStorageManagementtsx';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation-standard';
import { z } from 'zod';

const uploadRouter = new Hono<{ Bindings: Env }>();

// Upload schema validation
const uploadSchema = z.object({
  category: z.string().min(1).max(50),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional(),
});

// File upload endpoint
uploadRouter.post('/upload', authenticate, async (c: Context<{ Bindings: Env }>) => {
  try {
    const user = (c.get as any)('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const fileEntry = formData.get('file');
    const category = formData.get('category') as string;
    const description = formData.get('description') as string;
    const metadata = formData.get('metadata') as string;

    if (!fileEntry || typeof fileEntry === 'string') {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    const file = fileEntry as File;

    // Validate input
    const validation = uploadSchema.safeParse({
      category,
      description,
      metadata: metadata ? JSON.parse(metadata) : undefined,
    });

    if (!validation.success) {
      return c.json({
        success: false,
        error: 'Invalid input',
        details: validation.error.errors,
      }, 400);
    }

    const r2Service = new R2StorageService(c.env);
    
    // Validate file
    const fileValidation = r2Service.validateFile(file);
    if (!fileValidation.valid) {
      return c.json({ success: false, error: fileValidation.error }, 400);
    }

    // Generate file key
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = file.name.split('.').pop() || '';
    const key = `uploads/${category}/${timestamp}_${random}.${extension}`;

    // Upload to R2
    const uploadResult = await r2Service.uploadFile(file, key, {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: user.id,
        category: validation.data.category,
        description: validation.data.description || '',
        ...validation.data.metadata,
      },
    });

    if (!uploadResult.success) {
      return c.json({ success: false, error: uploadResult.error }, 500);
    }

    // Save file record to database
    const db = c.env.DB;
    const fileRecord = await db.prepare(`
      INSERT INTO file_uploads (
        id, original_name, filename, file_type, file_size, 
        file_path, uploaded_by, entity_type, entity_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      `file_${timestamp}_${random}`,
      file.name,
      key,
      file.type,
      file.size,
      uploadResult.url,
      user.id,
      'upload',
      null,
      new Date().toISOString()
    ).run();

    return c.json({
      success: true,
      data: {
        id: `file_${timestamp}_${random}`,
        filename: file.name,
        key,
        url: uploadResult.url,
        size: file.size,
        type: file.type,
        category: validation.data.category,
        description: validation.data.description,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return c.json({
      success: false,
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Bulk upload endpoint
uploadRouter.post('/upload/bulk', authenticate, async (c: Context<{ Bindings: Env }>) => {
  try {
    const user = (c.get as any)('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const files = formData.getAll('files') as (File | string)[];
    const category = formData.get('category') as string;

    if (!files || files.length === 0) {
      return c.json({ success: false, error: 'No files provided' }, 400);
    }

    if (files.length > 10) {
      return c.json({ success: false, error: 'Maximum 10 files allowed' }, 400);
    }

    const r2Service = new R2StorageService(c.env);
    const results = [];
    const errors = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        // Skip if not a File
        if (!(file instanceof File)) {
          errors.push({ file: 'unknown', error: 'Invalid file type' });
          continue;
        }

        // Validate file
        const fileValidation = r2Service.validateFile(file);
        if (!fileValidation.valid) {
          errors.push({ file: file.name, error: fileValidation.error });
          continue;
        }

        // Generate file key
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const extension = file.name.split('.').pop() || '';
        const key = `uploads/${category}/${timestamp}_${random}_${i}.${extension}`;

        // Upload to R2
        const uploadResult = await r2Service.uploadFile(file, key, {
          contentType: file.type,
          metadata: {
            originalName: file.name,
            uploadedBy: user.id,
            category: category,
            batchUpload: 'true',
          },
        });

        if (uploadResult.success) {
          // Save file record to database
          const db = c.env.DB;
          await db.prepare(`
            INSERT INTO file_uploads (
              id, original_name, filename, file_type, file_size, 
              file_path, uploaded_by, entity_type, entity_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            `file_${timestamp}_${random}_${i}`,
            file.name,
            key,
            file.type,
            file.size,
            uploadResult.url,
            user.id,
            'upload',
            null,
            new Date().toISOString()
          ).run();

          results.push({
            id: `file_${timestamp}_${random}_${i}`,
            filename: file.name,
            key,
            url: uploadResult.url,
            size: file.size,
            type: file.type,
          });
        } else {
          errors.push({ file: file.name, error: uploadResult.error });
        }
      } catch (error) {
        errors.push({
          file: file instanceof File ? file.name : 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return c.json({
      success: true,
      data: {
        uploaded: results,
        errors,
        summary: {
          total: files.length,
          successful: results.length,
          failed: errors.length,
        },
      },
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    return c.json({
      success: false,
      error: 'Bulk upload failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get file info endpoint
uploadRouter.get('/file/:id', authenticate, async (c: Context<{ Bindings: Env }>) => {
  try {
    const user = (c.get as any)('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const fileId = c.req.param('id');
    const db = c.env.DB;

    const file = await db.prepare(`
      SELECT * FROM file_uploads
      WHERE id = ? AND uploaded_by = ?
    `).bind(fileId, user.id).first();

    if (!file) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    return c.json({
      success: true,
      data: file,
    });
  } catch (error) {
    console.error('Get file error:', error);
    return c.json({
      success: false,
      error: 'Failed to get file',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Delete file endpoint
uploadRouter.delete('/file/:id', authenticate, async (c: Context<{ Bindings: Env }>) => {
  try {
    const user = (c.get as any)('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const fileId = c.req.param('id');
    const db = c.env.DB;

    // Get file info
    const file = await db.prepare(`
      SELECT * FROM file_uploads
      WHERE id = ? AND uploaded_by = ?
    `).bind(fileId, user.id).first();

    if (!file) {
      return c.json({ success: false, error: 'File not found' }, 404);
    }

    // Delete from R2
    const r2Service = new R2StorageService(c.env);
    await r2Service.deleteFile((file as any).filename);

    // Delete from database
    await db.prepare(`
      DELETE FROM file_uploads 
      WHERE id = ? AND uploaded_by = ?
    `).bind(fileId, user.id).run();

    return c.json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('Delete file error:', error);
    return c.json({
      success: false,
      error: 'Failed to delete file',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// List files endpoint
uploadRouter.get('/files', authenticate, async (c: Context<{ Bindings: Env }>) => {
  try {
    const user = (c.get as any)('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const category = c.req.query('category');
    const search = c.req.query('search');

    const offset = (page - 1) * limit;
    const db = c.env.DB;

    let whereClause = 'WHERE uploaded_by = ?';
    let params: any[] = [user.id];

    if (category) {
      whereClause += ' AND entity_type = ?';
      params.push(category);
    }

    if (search) {
      whereClause += ' AND (original_name LIKE ? OR filename LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Get files
    const files = await db.prepare(`
      SELECT * FROM file_uploads
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    // Get total count
    const totalResult = await db.prepare(`
      SELECT COUNT(*) as total FROM file_uploads
      ${whereClause}
    `).bind(...params).first();

    const total = (totalResult as any)?.total || 0;

    return c.json({
      success: true,
      data: files,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('List files error:', error);
    return c.json({
      success: false,
      error: 'Failed to list files',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get storage stats endpoint
uploadRouter.get('/stats', authenticate, async (c: Context<{ Bindings: Env }>) => {
  try {
    const user = (c.get as any)('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const tenantId = (c.get as any)('tenantId') || 'default';
    const r2Service = new R2StorageService(c.env);
    const stats = await r2Service.getStorageStats(tenantId);

    const db = c.env.DB;
    const userStats = await db.prepare(`
      SELECT
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        AVG(file_size) as avg_size
      FROM file_uploads
      WHERE uploaded_by = ?
    `).bind(user.id).first();

    return c.json({
      success: true,
      data: {
        global: stats,
        user: userStats,
      },
    });
  } catch (error) {
    console.error('Storage stats error:', error);
    return c.json({
      success: false,
      error: 'Failed to get storage stats',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default uploadRouter;