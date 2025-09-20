import { Hono } from 'hono';
import { Env } from '../../types';
import { R2StorageService } from '../../services/R2StorageService';

const app = new Hono<{ Bindings: Env }>();

// Upload single file
app.post('/file', async (c: any) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';
    const maxSize = parseInt(formData.get('maxSize') as string || '10485760'); // 10MB default

    if (!file) {
      return c.json({
        success: false,
        error: 'No file provided'
      }, 400);
    }

    const r2Service = new R2StorageService(c.env);
    const result = await r2Service.uploadFile(file, {
      category,
      maxSize,
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'text/plain', 'application/json',
        'text/csv', 'application/vnd.ms-excel'
      ]
    });

    if (result.success) {
      return c.json({
        success: true,
        data: {
          url: result.url,
          key: result.key,
          message: result.message
        }
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error('Upload endpoint error:', error);
    return c.json({
      success: false,
      error: 'Upload failed'
    }, 500);
  }
});

// Upload multiple files
app.post('/files', async (c: any) => {
  try {
    const formData = await c.req.formData();
    const files = formData.getAll('files') as File[];
    const category = formData.get('category') as string || 'general';
    const maxSize = parseInt(formData.get('maxSize') as string || '10485760');

    if (!files || files.length === 0) {
      return c.json({
        success: false,
        error: 'No files provided'
      }, 400);
    }

    const r2Service = new R2StorageService(c.env);
    const results = [];

    for (const file of files) {
      const result = await r2Service.uploadFile(file, {
        category,
        maxSize
      });

      results.push({
        filename: file.name,
        ...result
      });
    }

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return c.json({
      success: successful.length > 0,
      data: {
        uploaded: successful.length,
        failed: failed.length,
        results: results
      }
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    return c.json({
      success: false,
      error: 'Multiple upload failed'
    }, 500);
  }
});

// Delete file
app.delete('/:key', async (c: any) => {
  try {
    const key = c.req.param('key');
    const decodedKey = decodeURIComponent(key);

    const r2Service = new R2StorageService(c.env);
    const result = await r2Service.deleteFile(decodedKey);

    if (result.success) {
      return c.json({
        success: true,
        message: result.message
      });
    } else {
      return c.json({
        success: false,
        error: result.error
      }, 400);
    }

  } catch (error) {
    console.error('Delete endpoint error:', error);
    return c.json({
      success: false,
      error: 'Delete failed'
    }, 500);
  }
});

// List files
app.get('/list', async (c: any) => {
  try {
    const prefix = c.req.query('prefix');
    const maxKeys = parseInt(c.req.query('maxKeys') || '100');
    const category = c.req.query('category');

    const r2Service = new R2StorageService(c.env);
    const searchPrefix = category ? `${category}/` : prefix;
    const files = await r2Service.listFiles(searchPrefix, maxKeys);

    return c.json({
      success: true,
      data: {
        files,
        count: files.length
      }
    });

  } catch (error) {
    console.error('List files error:', error);
    return c.json({
      success: false,
      error: 'Failed to list files'
    }, 500);
  }
});

// Get file info
app.get('/info/:key', async (c: any) => {
  try {
    const key = decodeURIComponent(c.req.param('key'));

    const result = await c.env.DB.prepare(`
      SELECT * FROM file_uploads WHERE filename = ? AND status = 'active'
    `).bind(key).first();

    if (!result) {
      return c.json({
        success: false,
        error: 'File not found'
      }, 404);
    }

    const r2Service = new R2StorageService(c.env);
    const url = await r2Service.getPresignedUrl(key);

    return c.json({
      success: true,
      data: {
        ...result,
        url
      }
    });

  } catch (error) {
    console.error('Get file info error:', error);
    return c.json({
      success: false,
      error: 'Failed to get file info'
    }, 500);
  }
});

// Health check for R2 service
app.get('/health', async (c: any) => {
  try {
    const r2Service = new R2StorageService(c.env);

    // Test basic configuration
    const testResult = {
      r2Configured: !!(c.env.CLOUDFLARE_R2_ACCESS_KEY_ID && c.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY),
      bucketName: c.env.CLOUDFLARE_R2_BUCKET_UPLOADS || 'smartpos-uploads',
      endpoint: c.env.CLOUDFLARE_R2_ENDPOINT || 'Not configured'
    };

    return c.json({
      success: true,
      data: testResult
    });

  } catch (error) {
    console.error('R2 health check error:', error);
    return c.json({
      success: false,
      error: 'R2 service health check failed'
    }, 500);
  }
});

export default app;