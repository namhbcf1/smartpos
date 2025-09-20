import { Hono } from 'hono';
import { Env } from '../../types';

const app = new Hono<{ Bindings: Env }>();

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/json'
];

// POST /api/file-upload - Upload file
app.post('/', async (c: any) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';
    const description = formData.get('description') as string || '';

    if (!file) {
      return c.json({
        success: false,
        message: 'No file provided'
      }, 400);
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return c.json({
        success: false,
        message: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
      }, 400);
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({
        success: false,
        message: 'File type not allowed'
      }, 400);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${category}_${timestamp}.${extension}`;

    // Store file metadata in database
    const fileId = crypto.randomUUID();
    await c.env.DB.prepare(`
      INSERT INTO file_uploads (
        id, original_name, filename, file_type, file_size, category, description,
        uploaded_by, uploaded_at, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active')
    `).bind(
      fileId,
      file.name,
      filename,
      file.type,
      file.size,
      category,
      description,
      (c.get('jwtPayload') as any)?.id || 'system'
    ).run();

    // In a real implementation, you would store the file in a cloud storage service
    // For now, we'll just return the metadata
    return c.json({
      success: true,
      data: {
        id: fileId,
        original_name: file.name,
        filename: filename,
        file_type: file.type,
        file_size: file.size,
        category: category,
        description: description,
        uploaded_at: new Date().toISOString(),
        url: `/api/file-upload/${fileId}/download`
      },
      message: 'File uploaded successfully'
    });

  } catch (error) {
    console.error('File upload error:', error);
    return c.json({
      success: false,
      message: 'Failed to upload file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/file-upload - List uploaded files
app.get('/', async (c: any) => {
  try {
    // Create table if not exists
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id TEXT PRIMARY KEY,
        original_name TEXT NOT NULL,
        filename TEXT NOT NULL UNIQUE,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        category TEXT DEFAULT 'general',
        description TEXT,
        uploaded_by TEXT NOT NULL,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'deleted', 'processing')),
        metadata TEXT,
        download_count INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const category = c.req.query('category');
    const search = c.req.query('search');
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, original_name, filename, file_type, file_size, category, description,
             uploaded_by, uploaded_at, status
      FROM file_uploads 
      WHERE status = 'active'
    `;
    const params: any[] = [];

    if (category) {
      query += ` AND category = ?`;
      params.push(category);
    }

    if (search) {
      query += ` AND (original_name LIKE ? OR description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY uploaded_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const result = await c.env.DB.prepare(query).bind(...params).all();

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM file_uploads WHERE status = 'active'`;
    const countParams: any[] = [];
    
    if (category) {
      countQuery += ` AND category = ?`;
      countParams.push(category);
    }

    if (search) {
      countQuery += ` AND (original_name LIKE ? OR description LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first() as any;
    const total = countResult?.total || 0;

    return c.json({
      success: true,
      data: result.results || [],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('File list error:', error);
    return c.json({
      success: false,
      message: 'Failed to list files',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/file-upload/:id - Get file details
app.get('/:id', async (c: any) => {
  try {
    const fileId = c.req.param('id');

    const result = await c.env.DB.prepare(`
      SELECT id, original_name, filename, file_type, file_size, category, description,
             uploaded_by, uploaded_at, status
      FROM file_uploads 
      WHERE id = ? AND status = 'active'
    `).bind(fileId).first();

    if (!result) {
      return c.json({
        success: false,
        message: 'File not found'
      }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...result,
        url: `/api/file-upload/${fileId}/download`
      }
    });

  } catch (error) {
    console.error('File details error:', error);
    return c.json({
      success: false,
      message: 'Failed to get file details',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// GET /api/file-upload/:id/download - Download file
app.get('/:id/download', async (c: any) => {
  try {
    const fileId = c.req.param('id');

    const result = await c.env.DB.prepare(`
      SELECT filename, file_type, file_size
      FROM file_uploads 
      WHERE id = ? AND status = 'active'
    `).bind(fileId).first() as any;

    if (!result) {
      return c.json({
        success: false,
        message: 'File not found'
      }, 404);
    }

    // In a real implementation, you would retrieve the file from cloud storage
    // For now, we'll return a placeholder response
    return c.json({
      success: true,
      message: 'File download initiated',
      data: {
        filename: result.filename,
        file_type: result.file_type,
        file_size: result.file_size,
        download_url: `/api/file-upload/${fileId}/download`
      }
    });

  } catch (error) {
    console.error('File download error:', error);
    return c.json({
      success: false,
      message: 'Failed to download file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// DELETE /api/file-upload/:id - Delete file
app.delete('/:id', async (c: any) => {
  try {
    const fileId = c.req.param('id');

    // Soft delete - mark as inactive
    await c.env.DB.prepare(`
      UPDATE file_uploads 
      SET status = 'deleted', deleted_at = datetime('now')
      WHERE id = ?
    `).bind(fileId).run();

    return c.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File delete error:', error);
    return c.json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/file-upload/bulk - Bulk upload files
app.post('/bulk', async (c: any) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string || 'general';
    const description = formData.get('description') as string || '';

    if (!files || files.length === 0) {
      return c.json({
        success: false,
        message: 'No files provided'
      }, 400);
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          errors.push({
            filename: file.name,
            error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`
          });
          continue;
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          errors.push({
            filename: file.name,
            error: 'File type not allowed'
          });
          continue;
        }

        // Generate unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `${category}_${timestamp}_${Math.random().toString(36).substring(2)}.${extension}`;

        // Store file metadata in database
        const fileId = crypto.randomUUID();
        await c.env.DB.prepare(`
          INSERT INTO file_uploads (
            id, original_name, filename, file_type, file_size, category, description,
            uploaded_by, uploaded_at, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'active')
        `).bind(
          fileId,
          file.name,
          filename,
          file.type,
          file.size,
          category,
          description,
          (c.get('jwtPayload') as any)?.id || 'system'
        ).run();

        results.push({
          id: fileId,
          original_name: file.name,
          filename: filename,
          file_type: file.type,
          file_size: file.size,
          category: category,
          description: description,
          uploaded_at: new Date().toISOString(),
          url: `/api/file-upload/${fileId}/download`
        });

      } catch (error) {
        errors.push({
          filename: file.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return c.json({
      success: true,
      data: {
        uploaded: results,
        errors: errors
      },
      message: `Uploaded ${results.length} files successfully${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    return c.json({
      success: false,
      message: 'Failed to upload files',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
