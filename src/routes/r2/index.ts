import { Hono } from 'hono';
import { Env } from '../../types';
import uploadRouter from './upload';

const r2Router = new Hono<{ Bindings: Env }>();

// Mount upload routes
r2Router.route('/upload', uploadRouter);

// R2 storage info endpoint
r2Router.get('/info', async (c) => {
  return c.json({
    success: true,
    data: {
      service: 'Cloudflare R2 Storage',
      bucket: 'smartpos-uploads',
      features: [
        'File upload',
        'Bulk upload',
        'File management',
        'Public URLs',
        'Metadata support',
      ],
      limits: {
        maxFileSize: '10MB',
        maxFilesPerUpload: 10,
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv'],
      },
    },
  });
});

export default r2Router;