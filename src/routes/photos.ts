import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const app = new Hono();

// Validation schemas
const uploadPhotoSchema = z.object({
  filename: z.string(),
  content_type: z.string(),
  size: z.number(),
  stock_in_id: z.string().optional(),
  product_id: z.number().optional(),
  description: z.string().optional()
});

// Upload Photo Endpoint
app.post('/upload', zValidator('json', uploadPhotoSchema), async (c) => {
  try {
    const { filename, content_type, size, stock_in_id, product_id, description } = c.req.valid('json');
    const db = c.env.DB;

    // In a real implementation, this would:
    // 1. Upload the image to Cloudflare R2
    // 2. Generate thumbnails
    // 3. Store metadata in database
    // 4. Return the public URL

    const photoId = Date.now().toString();
    const publicUrl = `https://your-r2-bucket.r2.dev/photos/${photoId}_${filename}`;
    const thumbnailUrl = `https://your-r2-bucket.r2.dev/thumbnails/${photoId}_${filename}`;

    // Mock database insert
    const photoRecord = {
      id: photoId,
      filename,
      content_type,
      size,
      stock_in_id,
      product_id,
      description,
      public_url: publicUrl,
      thumbnail_url: thumbnailUrl,
      created_at: new Date().toISOString(),
      created_by: 'current_user' // Would get from auth context
    };

    console.log('Photo uploaded:', photoRecord);

    return c.json({
      success: true,
      data: {
        id: photoId,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        filename,
        size
      },
      message: 'Ảnh đã được tải lên thành công'
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải lên ảnh'
    }, 500);
  }
});

// Get Photos for Stock-In
app.get('/stock-in/:stockInId', async (c) => {
  try {
    const stockInId = c.req.param('stockInId');
    const db = c.env.DB;

    // Mock photos data
    const photos = [
      {
        id: '1',
        filename: 'stock_in_verification_1.jpg',
        public_url: 'https://example.com/photo1.jpg',
        thumbnail_url: 'https://example.com/thumb1.jpg',
        description: 'Ảnh xác minh hàng hóa',
        created_at: new Date().toISOString(),
        created_by: 'Nguyễn Văn A'
      }
    ];

    return c.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('Error getting photos:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy danh sách ảnh'
    }, 500);
  }
});

// Delete Photo
app.delete('/:id', async (c) => {
  try {
    const photoId = c.req.param('id');
    const db = c.env.DB;

    // In a real implementation, this would:
    // 1. Delete from R2 storage
    // 2. Remove from database
    // 3. Clean up thumbnails

    console.log('Deleting photo:', photoId);

    return c.json({
      success: true,
      message: 'Ảnh đã được xóa'
    });
  } catch (error) {
    console.error('Error deleting photo:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi xóa ảnh'
    }, 500);
  }
});

// Batch Upload Photos
app.post('/batch-upload', async (c) => {
  try {
    const body = await c.req.json();
    const { photos, stock_in_id, product_id } = body;
    const db = c.env.DB;

    const uploadedPhotos = [];

    for (const photo of photos) {
      const photoId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      const publicUrl = `https://your-r2-bucket.r2.dev/photos/${photoId}_${photo.filename}`;
      const thumbnailUrl = `https://your-r2-bucket.r2.dev/thumbnails/${photoId}_${photo.filename}`;

      // In a real implementation, would upload to R2 here
      // const uploadResult = await uploadToR2(photo.dataUrl, photoId, photo.filename);

      const photoRecord = {
        id: photoId,
        filename: photo.filename,
        content_type: 'image/jpeg',
        size: photo.size,
        stock_in_id,
        product_id,
        public_url: publicUrl,
        thumbnail_url: thumbnailUrl,
        created_at: new Date().toISOString(),
        created_by: 'current_user'
      };

      uploadedPhotos.push(photoRecord);
    }

    return c.json({
      success: true,
      data: uploadedPhotos,
      message: `Đã tải lên ${uploadedPhotos.length} ảnh thành công`
    });
  } catch (error) {
    console.error('Error batch uploading photos:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi tải lên ảnh hàng loạt'
    }, 500);
  }
});

// Get Photo Analytics
app.get('/analytics', async (c) => {
  try {
    const db = c.env.DB;

    // Mock analytics data
    const analytics = {
      total_photos: 1247,
      total_size_mb: 2850,
      photos_this_month: 156,
      top_categories: [
        { category: 'Stock Verification', count: 450 },
        { category: 'Product Images', count: 320 },
        { category: 'Damage Reports', count: 89 }
      ],
      storage_usage: {
        used_gb: 2.85,
        limit_gb: 100,
        usage_percentage: 2.85
      }
    };

    return c.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting photo analytics:', error);
    return c.json({
      success: false,
      message: 'Lỗi khi lấy thống kê ảnh'
    }, 500);
  }
});

export default app;
