/**
 * REAL-TIME COLLABORATION SERVICE
 * 
 * Enhanced WebSocket infrastructure for real-time collaboration,
 * operational transformation, conflict resolution, and live updates.
 */

import { Env } from '../types';
import { log } from '../utils/logger';

// Collaboration Event Types
export enum CollaborationEventType {
  USER_JOIN = 'user_join',
  USER_LEAVE = 'user_leave',
  DOCUMENT_EDIT = 'document_edit',
  CURSOR_MOVE = 'cursor_move',
  SELECTION_CHANGE = 'selection_change',
  LOCK_ACQUIRE = 'lock_acquire',
  LOCK_RELEASE = 'lock_release',
  SYNC_REQUEST = 'sync_request',
  SYNC_RESPONSE = 'sync_response',
  CONFLICT_DETECTED = 'conflict_detected',
  CONFLICT_RESOLVED = 'conflict_resolved'
}

// Document Types
export enum DocumentType {
  PRODUCT = 'product',
  SALE = 'sale',
  INVENTORY = 'inventory',
  CUSTOMER = 'customer',
  REPORT = 'report'
}

// Operation Types for Operational Transformation
export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
  RETAIN = 'retain',
  UPDATE = 'update'
}

// Interfaces
interface CollaborationUser {
  id: string;
  name: string;
  role: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
    field?: string;
  };
  selection?: {
    start: number;
    end: number;
    field?: string;
  };
  lastSeen: number;
}

interface CollaborationDocument {
  id: string;
  type: DocumentType;
  version: number;
  content: any;
  locks: Record<string, string>; // field -> userId
  lastModified: number;
  modifiedBy: string;
}

interface Operation {
  id: string;
  type: OperationType;
  position?: number;
  length?: number;
  content?: any;
  field?: string;
  userId: string;
  timestamp: number;
  version: number;
}

interface CollaborationEvent {
  id: string;
  type: CollaborationEventType;
  documentId: string;
  userId: string;
  data: any;
  timestamp: number;
  version?: number;
}

interface ConflictResolution {
  conflictId: string;
  operations: Operation[];
  resolution: 'merge' | 'override' | 'manual';
  resolvedBy: string;
  resolvedAt: number;
}

export class RealtimeCollaborationService {
  private documents: Map<string, CollaborationDocument> = new Map();
  private users: Map<string, CollaborationUser> = new Map();
  private operations: Map<string, Operation[]> = new Map(); // documentId -> operations
  private conflicts: Map<string, ConflictResolution> = new Map();
  private websockets: Map<string, WebSocket> = new Map(); // userId -> websocket

  constructor(private env: Env) {
    this.startCleanupInterval();
  }

  /**
   * Smoke test broadcast to all connected users
   */
  public async broadcastSmokeTest(message: string = 'collab_broadcast_test'): Promise<number> {
    const payload = {
      id: this.generateId(),
      type: CollaborationEventType.DOCUMENT_EDIT,
      documentId: 'smoke-test',
      userId: 'system',
      data: { message },
      timestamp: Date.now()
    } as any;

    let delivered = 0;
    for (const userId of this.websockets.keys()) {
      await this.sendToUser(userId, payload);
      delivered++;
    }
    return delivered;
  }

  /**
   * User joins collaboration session
   */
  async joinDocument(
    documentId: string,
    documentType: DocumentType,
    user: CollaborationUser,
    websocket: WebSocket
  ): Promise<void> {
    try {
      // Store user and websocket
      this.users.set(user.id, { ...user, lastSeen: Date.now() });
      this.websockets.set(user.id, websocket);

      // Initialize document if not exists
      if (!this.documents.has(documentId)) {
        const document = await this.loadDocument(documentId, documentType);
        this.documents.set(documentId, document);
        this.operations.set(documentId, []);
      }

      const document = this.documents.get(documentId)!;

      // Send current document state to user
      await this.sendToUser(user.id, {
        id: this.generateId(),
        type: CollaborationEventType.SYNC_RESPONSE,
        documentId: documentId,
        userId: 'system',
        data: {
          document,
          users: this.getDocumentUsers(documentId),
          operations: this.operations.get(documentId) || []
        },
        timestamp: Date.now()
      });

      // Notify other users
      await this.broadcastToDocument(documentId, {
        id: this.generateId(),
        type: CollaborationEventType.USER_JOIN,
        documentId: documentId,
        userId: user.id,
        data: { user },
        timestamp: Date.now()
      }, user.id);

      log.info('User joined collaboration', {
        documentId: documentId,
        userId: user.id,
        userName: user.name
      });

    } catch (error) {
      log.error('Failed to join collaboration', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }

  /**
   * User leaves collaboration session
   */
  async leaveDocument(documentId: string, userId: string): Promise<void> {
    try {
      // Release all locks held by user
      const document = this.documents.get(documentId);
      if (document) {
        Object.keys(document.locks).forEach(field => {
          if (document.locks[field] === userId) {
            delete document.locks[field];
          }
        });
      }

      // Remove user
      this.users.delete(userId);
      this.websockets.delete(userId);

      // Notify other users
      await this.broadcastToDocument(documentId, {
        id: this.generateId(),
        type: CollaborationEventType.USER_LEAVE,
        documentId: documentId,
        userId: userId,
        data: {},
        timestamp: Date.now()
      });

      log.info('User left collaboration', { documentId, userId });

    } catch (error) {
      log.error('Failed to leave collaboration', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Apply operation with operational transformation
   */
  async applyOperation(
    documentId: string,
    operation: Operation
  ): Promise<void> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Check for conflicts
      const conflicts = await this.detectConflicts(documentId, operation);
      if (conflicts.length > 0) {
        await this.handleConflicts(documentId, operation, conflicts);
        return;
      }

      // Transform operation against concurrent operations
      const transformedOperation = await this.transformOperation(documentId, operation);

      // Apply operation to document
      await this.applyOperationToDocument(document, transformedOperation);

      // Store operation
      const operations = this.operations.get(documentId) || [];
      operations.push(transformedOperation);
      this.operations.set(documentId, operations);

      // Update document version
      document.version++;
      document.lastModified = Date.now();
      document.modifiedBy = operation.userId;

      // Broadcast to all users
      await this.broadcastToDocument(documentId, {
        id: this.generateId(),
        type: CollaborationEventType.DOCUMENT_EDIT,
        documentId: documentId,
        userId: operation.userId,
        data: { operation: transformedOperation, document },
        timestamp: Date.now(),
        version: document.version
      });

      // Persist changes
      await this.persistDocument(document);

      log.info('Operation applied successfully', {
        documentId: documentId,
        operationType: operation.type,
        userId: operation.userId,
        version: document.version
      });

    } catch (error) {
      log.error('Failed to apply operation', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }

  /**
   * Acquire lock on document field
   */
  async acquireLock(
    documentId: string,
    field: string,
    userId: string
  ): Promise<boolean> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        throw new Error(`Document not found: ${documentId}`);
      }

      // Check if field is already locked
      if (document.locks[field] && document.locks[field] !== userId) {
        return false;
      }

      // Acquire lock
      document.locks[field] = userId;

      // Broadcast lock acquisition
      await this.broadcastToDocument(documentId, {
        id: this.generateId(),
        type: CollaborationEventType.LOCK_ACQUIRE,
        documentId: documentId,
        userId: userId,
        data: { field },
        timestamp: Date.now()
      });

      log.info('Lock acquired', { documentId, field, userId });
      return true;

    } catch (error) {
      log.error('Failed to acquire lock', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  }

  /**
   * Release lock on document field
   */
  async releaseLock(
    documentId: string,
    field: string,
    userId: string
  ): Promise<void> {
    try {
      const document = this.documents.get(documentId);
      if (!document) {
        return;
      }

      // Release lock if owned by user
      if (document.locks[field] === userId) {
        delete document.locks[field];

        // Broadcast lock release
        await this.broadcastToDocument(documentId, {
          id: this.generateId(),
          type: CollaborationEventType.LOCK_RELEASE,
        documentId: documentId,
        userId: userId,
          data: { field },
          timestamp: Date.now()
        });

        log.info('Lock released', { documentId, field, userId });
      }

    } catch (error) {
      log.error('Failed to release lock', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Update user cursor position
   */
  async updateCursor(
    documentId: string,
    userId: string,
    cursor: { x: number; y: number; field?: string }
  ): Promise<void> {
    try {
      const user = this.users.get(userId);
      if (user) {
        user.cursor = cursor;
        user.lastSeen = Date.now();

        // Broadcast cursor update
        await this.broadcastToDocument(documentId, {
          id: this.generateId(),
          type: CollaborationEventType.CURSOR_MOVE,
        documentId: documentId,
        userId: userId,
          data: { cursor },
          timestamp: Date.now()
        }, userId);
      }

    } catch (error) {
      log.error('Failed to update cursor', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Load document from database
   */
  private async loadDocument(
    documentId: string,
    documentType: DocumentType
  ): Promise<CollaborationDocument> {
    try {
      let content: any = {};
      
      // Load document based on type
      switch (documentType) {
        case DocumentType.PRODUCT:
          const product = await this.env.DB.prepare(
            'SELECT * FROM products WHERE id = ?'
          ).bind(documentId).first();
          content = product || {};
          break;
          
        case DocumentType.SALE:
          const sale = await this.env.DB.prepare(
            'SELECT * FROM sales WHERE id = ?'
          ).bind(documentId).first();
          content = sale || {};
          break;
          
        default:
          content = { id: documentId, type: documentType };
      }

      return {
        id: documentId,
        type: documentType,
        version: 1,
        content,
        locks: {},
        lastModified: Date.now(),
        modifiedBy: 'system'
      };

    } catch (error) {
      log.error('Failed to load document', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
      throw error;
    }
  }

  /**
   * Persist document to database
   */
  private async persistDocument(document: CollaborationDocument): Promise<void> {
    try {
      // Save document based on type
      switch (document.type) {
        case DocumentType.PRODUCT:
          await this.env.DB.prepare(`
            UPDATE products 
            SET name = ?, description = ?, price = ?, cost_price = ?, 
                stock = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            document.content.name,
            document.content.description,
            document.content.price,
            document.content.cost_price,
            document.content.stock,
            document.id
          ).run();
          break;
          
        case DocumentType.SALE:
          await this.env.DB.prepare(`
            UPDATE sales 
            SET total_amount = ?, status = ?, updated_at = datetime('now')
            WHERE id = ?
          `).bind(
            document.content.total_amount,
            document.content.status,
            document.id
          ).run();
          break;
      }

      log.debug('Document persisted', {
        documentId: document.id,
        version: document.version
      });

    } catch (error) {
      log.error('Failed to persist document', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Transform operation against concurrent operations
   */
  private async transformOperation(
    documentId: string,
    operation: Operation
  ): Promise<Operation> {
    const operations = this.operations.get(documentId) || [];
    const concurrentOps = operations.filter(op => 
      op.timestamp > operation.timestamp && op.userId !== operation.userId
    );

    let transformedOp = { ...operation };

    // Apply operational transformation
    for (const concurrentOp of concurrentOps) {
      transformedOp = this.transformAgainstOperation(transformedOp, concurrentOp);
    }

    return transformedOp;
  }

  /**
   * Transform one operation against another
   */
  private transformAgainstOperation(op1: Operation, op2: Operation): Operation {
    // Simple operational transformation logic
    // In production, use a more sophisticated OT library
    
    if (op1.field !== op2.field) {
      return op1; // No conflict if different fields
    }

    const transformed = { ...op1 };

    if (op1.type === OperationType.INSERT && op2.type === OperationType.INSERT) {
      if (op1.position! >= op2.position!) {
        transformed.position = op1.position! + (op2.length || 1);
      }
    } else if (op1.type === OperationType.DELETE && op2.type === OperationType.INSERT) {
      if (op1.position! > op2.position!) {
        transformed.position = op1.position! + (op2.length || 1);
      }
    }

    return transformed;
  }

  /**
   * Apply operation to document content
   */
  private async applyOperationToDocument(
    document: CollaborationDocument,
    operation: Operation
  ): Promise<void> {
    switch (operation.type) {
      case OperationType.UPDATE:
        if (operation.field) {
          document.content[operation.field] = operation.content;
        }
        break;
        
      case OperationType.INSERT:
        // Handle text insertion for string fields
        if (operation.field && typeof document.content[operation.field] === 'string') {
          const text = document.content[operation.field];
          const pos = operation.position || 0;
          document.content[operation.field] = 
            text.slice(0, pos) + operation.content + text.slice(pos);
        }
        break;
        
      case OperationType.DELETE:
        // Handle text deletion for string fields
        if (operation.field && typeof document.content[operation.field] === 'string') {
          const text = document.content[operation.field];
          const pos = operation.position || 0;
          const length = operation.length || 1;
          document.content[operation.field] = 
            text.slice(0, pos) + text.slice(pos + length);
        }
        break;
    }
  }

  /**
   * Detect conflicts between operations
   */
  private async detectConflicts(
    documentId: string,
    operation: Operation
  ): Promise<Operation[]> {
    const operations = this.operations.get(documentId) || [];
    const recentOps = operations.filter(op => 
      op.field === operation.field &&
      op.userId !== operation.userId &&
      Math.abs(op.timestamp - operation.timestamp) < 5000 // 5 seconds
    );

    return recentOps;
  }

  /**
   * Handle conflicts between operations
   */
  private async handleConflicts(
    documentId: string,
    operation: Operation,
    conflicts: Operation[]
  ): Promise<void> {
    const conflictId = this.generateId();
    
    // Simple conflict resolution: last writer wins
    const resolution: ConflictResolution = {
      conflictId,
      operations: [operation, ...conflicts],
      resolution: 'override',
      resolvedBy: operation.userId,
      resolvedAt: Date.now()
    };

    this.conflicts.set(conflictId, resolution);

    // Broadcast conflict detection
    await this.broadcastToDocument(documentId, {
      id: this.generateId(),
      type: CollaborationEventType.CONFLICT_DETECTED,
      documentId,
      userId: 'system',
      data: { conflictId, operations: [operation, ...conflicts] },
      timestamp: Date.now()
    });

    // Apply the operation (override strategy)
    await this.applyOperation(documentId, operation);

    // Broadcast conflict resolution
    await this.broadcastToDocument(documentId, {
      id: this.generateId(),
      type: CollaborationEventType.CONFLICT_RESOLVED,
      documentId,
      userId: 'system',
      data: { conflictId, resolution },
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast event to all users in document
   */
  private async broadcastToDocument(
    documentId: string,
    event: CollaborationEvent,
    excludeUserId?: string
  ): Promise<void> {
    const documentUsers = this.getDocumentUsers(documentId);
    
    for (const user of documentUsers) {
      if (user.id !== excludeUserId) {
        await this.sendToUser(user.id, event);
      }
    }
  }

  /**
   * Send event to specific user
   */
  private async sendToUser(userId: string, event: CollaborationEvent): Promise<void> {
    try {
      const websocket = this.websockets.get(userId);
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify(event));
      }
    } catch (error) {
      log.error('Failed to send event to user', error instanceof Error ? error : new Error(error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  /**
   * Get all users currently in document
   */
  private getDocumentUsers(documentId: string): CollaborationUser[] {
    // In a real implementation, track users per document
    return Array.from(this.users.values());
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Start cleanup interval for inactive users
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupInactiveUsers();
    }, 60000); // 1 minute
  }

  /**
   * Clean up inactive users
   */
  private cleanupInactiveUsers(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000; // 5 minutes

    for (const [userId, user] of this.users.entries()) {
      if (now - user.lastSeen > timeout) {
        this.users.delete(userId);
        this.websockets.delete(userId);
        log.info('Cleaned up inactive user', { userId });
      }
    }
  }
}
