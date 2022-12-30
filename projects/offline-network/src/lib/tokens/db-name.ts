import { InjectionToken } from '@angular/core';

/**
 * Injectable Database name token.
 *
 * For **IndexedDB** type used as database name.
 * For **LocalStorage** type used as prefix for key (if IndexedDB is unavailable).
 */
export const DB_NAME = new InjectionToken<string>('db-name');
