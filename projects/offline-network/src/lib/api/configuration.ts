/**
 * Module configuration.
 *
 *
 * **maxAge** - maximum number of hours while cache is available.
 *
 * **includeServerOff** - either server's 500 errors to use the cache. Default is **false**.
 */
export interface Configuration {
	maxAge: number; // in hours
	includeServerOff: boolean;
}
