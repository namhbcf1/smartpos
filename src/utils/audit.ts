/**
 * Simple audit logging utility
 */

export async function logAudit(
  kv: KVNamespace,
  tenantId: string,
  userId: string,
  action: string,
  entity: string,
  entityId: string,
  data: any,
  options?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<void> {
  try {
    const auditEntry = {
      id: crypto.randomUUID(),
      tenant_id: tenantId,
      user_id: userId,
      action,
      entity,
      entity_id: entityId,
      data: JSON.stringify(data),
      ip_address: options?.ipAddress,
      user_agent: options?.userAgent,
      timestamp: new Date().toISOString()
    };

    // Store in KV with TTL (30 days)
    const auditKey = `${tenantId}:audit:${auditEntry.id}`;
    await kv.put(auditKey, JSON.stringify(auditEntry), {
      expirationTtl: 2592000 // 30 days
    });

    // Store in recent audits list (for quick access)
    const recentKey = `${tenantId}:audit:recent`;
    const recent = await kv.get(recentKey);
    const recentLogs = recent ? JSON.parse(recent) : [];

    // Keep only last 1000 entries
    recentLogs.unshift(auditEntry);
    if (recentLogs.length > 1000) {
      recentLogs.splice(1000);
    }

    await kv.put(recentKey, JSON.stringify(recentLogs), {
      expirationTtl: 2592000 // 30 days
    });

  } catch (error) {
    console.error('Audit logging failed:', error);
    // Don't throw error to avoid breaking main functionality
  }
}