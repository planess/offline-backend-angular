import { InjectionToken } from '@angular/core';

/**
 * Injectable Database version token.
 *
 * For **IndexedDB** type used as database version.
 * For **LocalStorage** type used as piece of prefix for storage key (if IndexedDB is unavailable).
 */
export const DB_VERSION = new InjectionToken<number>('db-version');
