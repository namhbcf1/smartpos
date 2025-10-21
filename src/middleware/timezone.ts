/**
 * Timezone Middleware - Phase 2 Implementation
 * Handles X-Timezone header and ensures consistent datetime handling
 */

import { Context, Next } from 'hono';
import { Env } from '../types';

export interface TimezoneInfo {
  timezone: string;
  offset: number;
  name: string;
  abbreviation: string;
}

// Default timezone for Vietnam
const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Middleware to handle timezone consistency across API
 */
export const timezoneMiddleware = async (c: Context, next: Next) => {
  // Get timezone from header or use default
  const clientTimezone = c.req.header('X-Timezone') || DEFAULT_TIMEZONE;
  
  // Validate timezone
  let validTimezone = DEFAULT_TIMEZONE;
  try {
    // Test if timezone is valid
    Intl.DateTimeFormat(undefined, { timeZone: clientTimezone });
    validTimezone = clientTimezone;
  } catch { /* No operation */ }
  // Store timezone info in context
  const timezoneInfo: TimezoneInfo = {
    timezone: validTimezone,
    offset: getTimezoneOffset(validTimezone),
    name: getTimezoneName(validTimezone),
    abbreviation: getTimezoneAbbreviation(validTimezone)
  };

  c.set('timezone', timezoneInfo);

  // Add timezone echo to response headers
  c.header('X-Timezone', validTimezone);
  c.header('X-Server-Time', new Date().toISOString());
  c.header('X-Timezone-Offset', timezoneInfo.offset.toString());

  await next();
};

/**
 * Helper function to get timezone offset in minutes
 */
function getTimezoneOffset(timezone: string): number {
  try {
    const now = new Date();
    const utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 
                        now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    const local = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return Math.round((local.getTime() - utc.getTime()) / 60000);
  } catch {
    return 420; // +7 hours for Vietnam
  }
}

/**
 * Helper function to get timezone display name
 */
function getTimezoneName(timezone: string): string {
  try {
    return Intl.DateTimeFormat('en', { 
      timeZone: timezone, 
      timeZoneName: 'long' 
    }).formatToParts().find(part => part.type === 'timeZoneName')?.value || timezone;
  } catch {
    return 'Indochina Time';
  }
}

/**
 * Helper function to get timezone abbreviation
 */
function getTimezoneAbbreviation(timezone: string): string {
  try {
    return Intl.DateTimeFormat('en', { 
      timeZone: timezone, 
      timeZoneName: 'short' 
    }).formatToParts().find(part => part.type === 'timeZoneName')?.value || 'ICT';
  } catch {
    return 'ICT';
  }
}

/**
 * Utility class for timezone-aware date operations
 */
export class TimezoneHelper {
  
  /**
   * Format date for specific timezone
   */
  static formatDate(date: Date | string, timezone: string, format: 'short' | 'long' | 'iso' = 'iso'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    if (format === 'iso') {
      return d.toISOString();
    }
    
    try {
      return new Intl.DateTimeFormat('vi-VN', {
        timeZone: timezone,
        year: 'numeric',
        month: format === 'long' ? 'long' : '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(d);
    } catch {
      return d.toISOString();
    }
  }

  /**
   * Get start/end of day for timezone
   */
  static getDayBounds(date: string | Date, timezone: string): { start: string; end: string } {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    try {
      // Create date in the target timezone
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();
      // Start of day in target timezone
      const start = new Date(year, month, day, 0, 0, 0, 0);
      const startInTimezone = new Date(start.toLocaleString('en-US', { timeZone: timezone }));
      const startOffset = start.getTime() - startInTimezone.getTime();
      const startUTC = new Date(start.getTime() + startOffset);
      
      // End of day in target timezone  
      const end = new Date(year, month, day, 23, 59, 59, 999);
      const endInTimezone = new Date(end.toLocaleString('en-US', { timeZone: timezone }));
      const endOffset = end.getTime() - endInTimezone.getTime();
      const endUTC = new Date(end.getTime() + endOffset);
      
      return {
        start: startUTC.toISOString(),
        end: endUTC.toISOString();
      };
    } catch {
      // Fallback to UTC if timezone calculations fail
      const utcStart = new Date(d);
      utcStart.setUTCHours(0, 0, 0, 0);
      
      const utcEnd = new Date(d);
      utcEnd.setUTCHours(23, 59, 59, 999);
      
      return {
        start: utcStart.toISOString(),
        end: utcEnd.toISOString();
      };
    }
  }

  /**
   * Parse date string with timezone context
   */
  static parseDate(dateString: string, timezone: string = DEFAULT_TIMEZONE): Date {
    // If already ISO string, return as-is
    if (dateString.includes('T') && dateString.includes('Z')) {
      return new Date(dateString);
    }
    
    try {
      // Parse as if in the target timezone
      const parsed = new Date(dateString);
      if (isNaN(parsed.getTime())) {
        return new Date();
      }
      return parsed;
    } catch {
      return new Date();
    }
  }

  /**
   * Get current time in specific timezone
   */
  static now(timezone: string = DEFAULT_TIMEZONE): string {
    return this.formatDate(new Date(), timezone, 'iso');
  }

  /**
   * Convert UTC time to timezone-aware display
   */
  static toDisplayTime(utcTime: string | Date, timezone: string = DEFAULT_TIMEZONE): string {
    return this.formatDate(utcTime, timezone, 'long');
  }
}

/**
 * Get timezone info from context
 */
export function getTimezone(c: Context): TimezoneInfo {
  return c.get('timezone') || {
    timezone: DEFAULT_TIMEZONE,
    offset: 420,
    name: 'Indochina Time',
    abbreviation: 'ICT'
  };
}

/**
 * SQL helper for timezone-aware queries
 */
export class TimezoneSQL {
  
  /**
   * Generate timezone-aware date range conditions
   */
  static dateRange(
    column: string, 
    from: string | Date, 
    to: string | Date, 
    timezone: string = DEFAULT_TIMEZONE
  ): { sql: string; params: string[] } {
    const fromBounds = TimezoneHelper.getDayBounds(from, timezone);
    const toBounds = TimezoneHelper.getDayBounds(to, timezone);
    
    return {
      sql: `${column} >= ? AND ${column} <= ?`,
      params: [fromBounds.start, toBounds.end]
    };
  }

  /**
   * Generate timezone-aware date grouping (for analytics)
   */
  static dateGroup(
    column: string,
    groupBy: 'hour' | 'day' | 'week' | 'month',
    timezone: string = DEFAULT_TIMEZONE
  ): string {
    // For SQLite, we'll use strftime with timezone adjustment
    const offsetMinutes = getTimezoneOffset(timezone);
    const offsetHours = Math.round(offsetMinutes / 60);
    
    switch (groupBy) {
      case 'hour':
        return `strftime('%Y-%m-%d %H:00:00', datetime(${column}, '${offsetHours >= 0 ? '+' : ''}${offsetHours} hours'))`;
      case 'day':
        return `strftime('%Y-%m-%d', datetime(${column}, '${offsetHours >= 0 ? '+' : ''}${offsetHours} hours'))`;
      case 'week':
        return `strftime('%Y-W%W', datetime(${column}, '${offsetHours >= 0 ? '+' : ''}${offsetHours} hours'))`;
      case 'month':
        return `strftime('%Y-%m', datetime(${column}, '${offsetHours >= 0 ? '+' : ''}${offsetHours} hours'))`;
      default:
        return `strftime('%Y-%m-%d', datetime(${column}, '${offsetHours >= 0 ? '+' : ''}${offsetHours} hours'))`;
    }
  }
}