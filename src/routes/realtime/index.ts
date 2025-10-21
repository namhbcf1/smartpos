import { Hono } from 'hono';
import { Context } from 'hono';
import { authenticate } from '../../middleware/auth';
import { validateRequest } from '../../middleware/validation-standard';
import { z } from 'zod';
import { Env } from '../../types';

const realtimeRouter = new Hono<{ Bindings: Env }>();

// WebSocket connection endpoint
realtimeRouter.get('/ws', async (c: Context<{ Bindings: Env }>) => {
  try {
    const upgradeHeader = c.req.header('Upgrade');
    
    if (upgradeHeader !== 'websocket') {
      return c.json({ 
        success: false, 
        error: 'WebSocket upgrade required' 
      }, 426);
    }

    // Get Durable Object namespace
    const notificationNamespace = c.env.NOTIFICATION_OBJECT;
    if (!notificationNamespace) {
      return c.json({ 
        success: false, 
        error: 'Realtime service not available' 
      }, 503);
    }

    // Create or get Durable Object instance
    const id = notificationNamespace.idFromName('global');
    const durableObject = notificationNamespace.get(id);

    // Forward WebSocket request to Durable Object
    return durableObject.fetch(c.req.raw);
  } catch (error) {
    console.error('WebSocket connection error:', error);
    return c.json({
      success: false,
      error: 'WebSocket connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Broadcast message endpoint
realtimeRouter.post('/broadcast', authenticate, async (c: Context<{ Bindings: Env; Variables: { user?: any } }>) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { message, type = 'notification', target = 'all', data = {} } = body;

    if (!message) {
      return c.json({ success: false, error: 'Message is required' }, 400);
    }

    // Get Durable Object namespace
    const notificationNamespace = c.env.NOTIFICATION_OBJECT;
    if (!notificationNamespace) {
      return c.json({ 
        success: false, 
        error: 'Realtime service not available' 
      }, 503);
    }

    // Create or get Durable Object instance
    const id = notificationNamespace.idFromName('global');
    const durableObject = notificationNamespace.get(id);

    // Send broadcast request to Durable Object
    const broadcastData = {
      message,
      type,
      target,
      data,
      from: user.id,
      timestamp: new Date().toISOString(),
    };

    const response = await durableObject.fetch('http://internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(broadcastData),
    });

    if (response.ok) {
      return c.json({
        success: true,
        message: 'Broadcast sent successfully',
        data: broadcastData,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to send broadcast',
      }, 500);
    }
  } catch (error) {
    console.error('Broadcast error:', error);
    return c.json({
      success: false,
      error: 'Broadcast failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get active connections endpoint
realtimeRouter.get('/connections', authenticate, async (c: Context<{ Bindings: Env; Variables: { user?: any } }>) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    // Get Durable Object namespace
    const notificationNamespace = c.env.NOTIFICATION_OBJECT;
    if (!notificationNamespace) {
      return c.json({ 
        success: false, 
        error: 'Realtime service not available' 
      }, 503);
    }

    // Create or get Durable Object instance
    const id = notificationNamespace.idFromName('global');
    const durableObject = notificationNamespace.get(id);

    // Get connection info from Durable Object
    const response = await durableObject.fetch('http://internal/connections');
    
    if (response.ok) {
      const data = await response.json();
      return c.json({
        success: true,
        data,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to get connection info',
      }, 500);
    }
  } catch (error) {
    console.error('Get connections error:', error);
    return c.json({
      success: false,
      error: 'Failed to get connections',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Subscribe to specific events endpoint
realtimeRouter.post('/subscribe', authenticate, async (c: Context<{ Bindings: Env; Variables: { user?: any } }>) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { events = [], userId = user.id } = body;

    if (!Array.isArray(events) || events.length === 0) {
      return c.json({ success: false, error: 'Events array is required' }, 400);
    }

    // Get Durable Object namespace
    const notificationNamespace = c.env.NOTIFICATION_OBJECT;
    if (!notificationNamespace) {
      return c.json({ 
        success: false, 
        error: 'Realtime service not available' 
      }, 503);
    }

    // Create or get Durable Object instance
    const id = notificationNamespace.idFromName('global');
    const durableObject = notificationNamespace.get(id);

    // Send subscription request to Durable Object
    const subscriptionData = {
      userId,
      events,
      timestamp: new Date().toISOString(),
    };

    const response = await durableObject.fetch('http://internal/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscriptionData),
    });

    if (response.ok) {
      return c.json({
        success: true,
        message: 'Subscription updated successfully',
        data: subscriptionData,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to update subscription',
      }, 500);
    }
  } catch (error) {
    console.error('Subscribe error:', error);
    return c.json({
      success: false,
      error: 'Subscription failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Unsubscribe from events endpoint
realtimeRouter.post('/unsubscribe', authenticate, async (c: Context<{ Bindings: Env; Variables: { user?: any } }>) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const body = await c.req.json();
    const { events = [], userId = user.id } = body;

    // Get Durable Object namespace
    const notificationNamespace = c.env.NOTIFICATION_OBJECT;
    if (!notificationNamespace) {
      return c.json({ 
        success: false, 
        error: 'Realtime service not available' 
      }, 503);
    }

    // Create or get Durable Object instance
    const id = notificationNamespace.idFromName('global');
    const durableObject = notificationNamespace.get(id);

    // Send unsubscription request to Durable Object
    const unsubscriptionData = {
      userId,
      events,
      timestamp: new Date().toISOString(),
    };

    const response = await durableObject.fetch('http://internal/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unsubscriptionData),
    });

    if (response.ok) {
      return c.json({
        success: true,
        message: 'Unsubscription successful',
        data: unsubscriptionData,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to unsubscribe',
      }, 500);
    }
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return c.json({
      success: false,
      error: 'Unsubscription failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

// Get realtime status endpoint
realtimeRouter.get('/status', async (c: Context<{ Bindings: Env }>) => {
  try {
    // Get Durable Object namespace
    const notificationNamespace = c.env.NOTIFICATION_OBJECT;
    if (!notificationNamespace) {
      return c.json({ 
        success: false, 
        error: 'Realtime service not available' 
      }, 503);
    }

    // Create or get Durable Object instance
    const id = notificationNamespace.idFromName('global');
    const durableObject = notificationNamespace.get(id);

    // Get status from Durable Object
    const response = await durableObject.fetch('http://internal/status');
    
    if (response.ok) {
      const data = await response.json();
      return c.json({
        success: true,
        data: {
          ...data,
          service: 'realtime',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to get status',
      }, 500);
    }
  } catch (error) {
    console.error('Get status error:', error);
    return c.json({
      success: false,
      error: 'Failed to get status',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default realtimeRouter;